
import React, { useState, useEffect } from 'react';
import { LOCAL_PRODUCTION_STATUS_LABELS } from '../constants';
import { LocalProductionStatus, Order } from '../types';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../contexts/ToastContext';
import { Search, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { ordersService } from '../services/ordersService';

interface SortableOrderCardProps {
  order: Order;
  onOrderClick?: (orderId: string) => void;
}

const SortableOrderCard: React.FC<SortableOrderCardProps> = ({ order, onOrderClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOrderClick && onOrderClick(order.id)}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-slate-800">#{order.order_number}</span>
        {order.deadline && (
          <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
            {new Date(order.deadline).toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit'})}
          </span>
        )}
      </div>
      <div className="text-sm text-slate-600 mb-1">{order.customer_name}</div>
      <div className="text-xs text-slate-500 mb-2">
        {order.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
      </div>
    </div>
  );
};

const ProductionLocal: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');

  // Load orders from Supabase
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const allOrders = await ordersService.getAll();
      const localOrders = allOrders.filter(o => o.production_type === 'local' && o.status !== 'draft');
      setOrders(localOrders);
    } catch (error) {
      console.error('Error loading local production orders:', error);
      showToast('שגיאה בטעינת ההזמנות', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const columns: LocalProductionStatus[] = ['queued', 'printing', 'quality_check', 'ready_pack', 'packed', 'ready_ship'];

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.includes(searchTerm) || 
      order.customer_name.includes(searchTerm);
    
    if (deadlineFilter === 'all') return matchesSearch;
    if (deadlineFilter === 'urgent') {
      if (!order.deadline) return false;
      const deadline = new Date(order.deadline);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return deadline <= threeDaysFromNow && deadline >= new Date() && matchesSearch;
    }
    return matchesSearch;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as LocalProductionStatus;

    // Find the order
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check if status is valid transition
    const currentIndex = columns.indexOf(order.local_production_status || 'queued');
    const newIndex = columns.indexOf(newStatus);
    
    if (newIndex === -1) return;

    try {
      // Update order in Supabase
      await ordersService.update(orderId, { local_production_status: newStatus });
      
      // Update local state
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, local_production_status: newStatus } : o
      );
      setOrders(updatedOrders);
      
      showToast(`הזמנה ${order.order_number} הועברה ל-${LOCAL_PRODUCTION_STATUS_LABELS[newStatus]}`);
    } catch (error) {
      console.error('Error updating production status:', error);
      showToast('שגיאה בעדכון סטטוס הייצור', 'error');
    }
  };

  const handleOrderClick = (orderId: string) => {
    // Navigate to order detail - would need navigation context
    window.location.hash = `/order-detail/${orderId}`;
  };

  const getOrdersByStatus = (status: LocalProductionStatus) => {
    return filteredOrders.filter(o => o.local_production_status === status);
  };

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

  // Droppable Column Component
  const DroppableColumn: React.FC<{ status: LocalProductionStatus; children: React.ReactNode }> = ({ status, children }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    return (
      <div
        ref={setNodeRef}
        className={`w-72 flex-shrink-0 flex flex-col bg-slate-100 rounded-xl ${isOver ? 'ring-2 ring-blue-500' : ''}`}
      >
        {children}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">ייצור מקומי</h2>
        <p className="text-slate-500 text-sm">מעקב אחר פס הייצור הפנימי</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="חיפוש לפי מספר הזמנה או שם לקוח..." 
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">כל הדדליינים</option>
            <option value="urgent">דדליינים קרובים (3 ימים)</option>
          </select>
        </div>
      </div>

      {/* Alerts for urgent deadlines */}
      {deadlineFilter === 'all' && filteredOrders.some(o => {
        if (!o.deadline) return false;
        const deadline = new Date(o.deadline);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return deadline <= threeDaysFromNow && deadline >= new Date();
      }) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="text-yellow-600" size={18} />
          <span className="text-sm text-yellow-800">
            יש הזמנות עם דדליינים קרובים (3 ימים)
          </span>
        </div>
      )}

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-[1400px]">
            {columns.map((status) => {
              const ordersInCol = getOrdersByStatus(status);
              return (
                <DroppableColumn key={status} status={status}>
                  <div className="p-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center sticky top-0 bg-slate-100 rounded-t-xl z-10">
                    <span>{LOCAL_PRODUCTION_STATUS_LABELS[status]}</span>
                    <span className="bg-slate-200 text-xs px-2 py-0.5 rounded-full">{ordersInCol.length}</span>
                  </div>
                  <SortableContext
                    items={ordersInCol.map(o => o.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[200px]">
                      {ordersInCol.map(order => (
                        <SortableOrderCard
                          key={order.id}
                          order={order}
                          onOrderClick={handleOrderClick}
                        />
                      ))}
                      {ordersInCol.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                          גרור הזמנות לכאן
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>
        </div>
        <DragOverlay>
          {activeOrder ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500 opacity-90">
              <div className="font-bold text-slate-800">#{activeOrder.order_number}</div>
              <div className="text-sm text-slate-600">{activeOrder.customer_name}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default ProductionLocal;
