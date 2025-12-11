
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, ArrowUpDown, Download, LayoutGrid, List, ShoppingCart, Loader2 } from 'lucide-react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PRODUCTION_TYPE_LABELS } from '../constants';
import { Order, OrderStatus } from '../types';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../contexts/ToastContext';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import { ordersService } from '../services/ordersService';

interface OrdersProps {
  onOrderClick?: (id: string) => void;
  onCreateOrder?: () => void;
}

type SortField = 'order_number' | 'created_at' | 'deadline' | 'total_amount' | 'customer_name';
type SortDirection = 'asc' | 'desc';

const Orders: React.FC<OrdersProps> = ({ onOrderClick, onCreateOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productionTypeFilter, setProductionTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load orders from Supabase
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await ordersService.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('שגיאה בטעינת ההזמנות', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Search filter
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Production type filter
      const matchesProductionType = productionTypeFilter === 'all' || order.production_type === productionTypeFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        if (dateFilter === 'today') {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
        } else if (dateFilter === 'custom') {
          if (customDateFrom) {
            const fromDate = new Date(customDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            matchesDate = orderDate >= fromDate;
          }
          if (customDateTo) {
            const toDate = new Date(customDateTo);
            toDate.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && orderDate <= toDate;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesProductionType && matchesDate;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'order_number':
          aValue = a.order_number;
          bValue = b.order_number;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
          bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'customer_name':
          aValue = a.customer_name.toLowerCase();
          bValue = b.customer_name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, productionTypeFilter, dateFilter, customDateFrom, customDateTo, sortField, sortDirection]);

  // Group orders by status for Kanban view
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    const statusKeys: OrderStatus[] = ['draft', 'pending_approval', 'approved', 'pending_payment', 'paid', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled'];
    
    statusKeys.forEach(status => {
      groups[status] = filteredAndSortedOrders.filter(o => o.status === status);
    });
    
    return groups;
  }, [filteredAndSortedOrders]);

  const statusKeys: OrderStatus[] = ['draft', 'pending_approval', 'approved', 'pending_payment', 'paid', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled'];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as OrderStatus;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      // Update order status in Supabase
      await ordersService.update(orderId, { status: newStatus });
      
      // Update local state
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);
      
      showToast(`ההזמנה עודכנה ל-${ORDER_STATUS_LABELS[newStatus]}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('שגיאה בעדכון סטטוס ההזמנה', 'error');
    }
  };

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

  // Sortable Order Card Component
  const SortableOrderCard: React.FC<{ order: Order }> = ({ order }) => {
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
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
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
          {PRODUCTION_TYPE_LABELS[order.production_type]}
        </div>
        <div className="text-sm font-medium text-slate-800">
          ₪{order.total_amount.toLocaleString()}
        </div>
      </div>
    );
  };

  // Droppable Column Component
  const DroppableColumn: React.FC<{ status: OrderStatus; children: React.ReactNode }> = ({ status, children }) => {
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    // Placeholder for export functionality
    const csv = [
      ['מס\' הזמנה', 'לקוח', 'סטטוס', 'סוג', 'דדליין', 'סכום'].join(','),
      ...filteredAndSortedOrders.map(order => [
        order.order_number,
        order.customer_name,
        ORDER_STATUS_LABELS[order.status],
        PRODUCTION_TYPE_LABELS[order.production_type],
        order.deadline ? new Date(order.deadline).toLocaleDateString('he-IL') : '',
        order.total_amount.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">הזמנות</h2>
          <p className="text-slate-500 text-xs sm:text-sm">ניהול ומעקב אחר הזמנות לקוח</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors touch-manipulation ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
              }`}
              title="תצוגת רשימה"
              aria-label="תצוגת רשימה"
            >
              <List size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded transition-colors touch-manipulation ${
                viewMode === 'kanban' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
              }`}
              title="תצוגת Kanban"
              aria-label="תצוגת Kanban"
            >
              <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
          <button 
            onClick={handleExport}
            className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors touch-manipulation shrink-0"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline text-sm">ייצא</span>
          </button>
          <button 
            onClick={onCreateOrder}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm touch-manipulation flex-1 sm:flex-initial justify-center"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-sm sm:text-base">הזמנה חדשה</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        {/* Filter Chips */}
        {((statusFilter !== 'all') || (productionTypeFilter !== 'all') || (dateFilter !== 'all') || searchTerm) && (
          <FilterChips
            chips={[
              ...(statusFilter !== 'all' ? [{
                id: 'status',
                label: 'סטטוס',
                value: ORDER_STATUS_LABELS[statusFilter as OrderStatus]
              }] : []),
              ...(productionTypeFilter !== 'all' ? [{
                id: 'production',
                label: 'סוג',
                value: PRODUCTION_TYPE_LABELS[productionTypeFilter as 'local' | 'import']
              }] : []),
              ...(dateFilter !== 'all' ? [{
                id: 'date',
                label: 'תאריך',
                value: dateFilter === 'today' ? 'היום' : dateFilter === 'week' ? 'שבוע' : dateFilter === 'month' ? 'חודש' : 'מותאם אישית'
              }] : []),
              ...(searchTerm ? [{
                id: 'search',
                label: 'חיפוש',
                value: searchTerm
              }] : [])
            ]}
            onRemove={(id) => {
              if (id === 'status') setStatusFilter('all');
              if (id === 'production') setProductionTypeFilter('all');
              if (id === 'date') {
                setDateFilter('all');
                setCustomDateFrom('');
                setCustomDateTo('');
              }
              if (id === 'search') setSearchTerm('');
            }}
            onClearAll={() => {
              setStatusFilter('all');
              setProductionTypeFilter('all');
              setDateFilter('all');
              setCustomDateFrom('');
              setCustomDateTo('');
              setSearchTerm('');
            }}
          />
        )}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="חיפוש לפי מספר הזמנה או שם לקוח..." 
              className="w-full pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative shrink-0">
              <select 
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 pr-8 sm:pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer text-sm sm:text-base touch-manipulation"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">כל הסטטוסים</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <Filter className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <div className="relative shrink-0">
              <select 
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 pr-8 sm:pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer text-sm sm:text-base touch-manipulation"
                value={productionTypeFilter}
                onChange={(e) => setProductionTypeFilter(e.target.value)}
              >
                <option value="all">כל הסוגים</option>
                {Object.entries(PRODUCTION_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="relative shrink-0">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 flex items-center gap-2 text-slate-600 hover:bg-slate-50 active:bg-slate-100 touch-manipulation transition-colors ${dateFilter !== 'all' ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline text-sm sm:text-base">
                  {dateFilter === 'all' ? 'תאריך' : 
                   dateFilter === 'today' ? 'היום' :
                   dateFilter === 'week' ? 'שבוע' :
                   dateFilter === 'month' ? 'חודש' : 'מותאם אישית'}
                </span>
                <span className="sm:hidden text-sm">תאריך</span>
              </button>
              {showDatePicker && (
                <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 min-w-[250px]">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-700 mb-2">סינון לפי תאריך</div>
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value as any);
                        if (e.target.value !== 'custom') {
                          setShowDatePicker(false);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="all">כל התאריכים</option>
                      <option value="today">היום</option>
                      <option value="week">7 ימים אחרונים</option>
                      <option value="month">30 ימים אחרונים</option>
                      <option value="custom">מותאם אישית</option>
                    </select>
                    {dateFilter === 'custom' && (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">מ-תאריך</label>
                          <input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">עד תאריך</label>
                          <input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          החל
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredAndSortedOrders.length > 0 ? (
              filteredAndSortedOrders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => onOrderClick && onOrderClick(order.id)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:bg-slate-50 transition-colors touch-manipulation"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-slate-900 mb-1">#{order.order_number}</div>
                      <div className="text-slate-900 font-medium truncate">{order.customer_name}</div>
                      {order.event_name && (
                        <div className="text-xs text-slate-500 mt-0.5">{order.event_name}</div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">סוג</div>
                      <div className="font-medium text-slate-700">{PRODUCTION_TYPE_LABELS[order.production_type]}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">דדליין</div>
                      <div className="font-medium text-slate-700">{order.deadline ? new Date(order.deadline).toLocaleDateString('he-IL') : '-'}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">סכום</div>
                      <div className="text-lg font-bold text-slate-900">₪{order.total_amount.toLocaleString()}</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOrderClick && onOrderClick(order.id);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium touch-manipulation"
                    >
                      ניהול
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center text-slate-500">
                לא נמצאו הזמנות תואמות לסינון
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm">
                  <tr>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleSort('order_number')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        מס' הזמנה
                        <ArrowUpDown size={14} className={sortField === 'order_number' ? 'text-blue-600' : 'text-slate-400'} />
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleSort('customer_name')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        לקוח
                        <ArrowUpDown size={14} className={sortField === 'customer_name' ? 'text-blue-600' : 'text-slate-400'} />
                      </button>
                    </th>
                    <th className="px-6 py-4">סטטוס</th>
                    <th className="px-6 py-4">סוג</th>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleSort('deadline')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        דדליין
                        <ArrowUpDown size={14} className={sortField === 'deadline' ? 'text-blue-600' : 'text-slate-400'} />
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleSort('total_amount')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        סכום
                        <ArrowUpDown size={14} className={sortField === 'total_amount' ? 'text-blue-600' : 'text-slate-400'} />
                      </button>
                    </th>
                    <th className="px-6 py-4">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">#{order.order_number}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-slate-100">{order.customer_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{order.event_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                        {PRODUCTION_TYPE_LABELS[order.production_type]}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                        {order.deadline ? new Date(order.deadline).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                        ₪{order.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => onOrderClick && onOrderClick(order.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          ניהול
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Kanban View */
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-4 h-full min-w-[2000px]">
              {statusKeys.map((status) => {
                const ordersInCol = groupedOrders[status] || [];
                return (
                  <DroppableColumn key={status} status={status}>
                    <div className="p-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center sticky top-0 bg-slate-100 rounded-t-xl z-10">
                      <span>{ORDER_STATUS_LABELS[status]}</span>
                      <span className="bg-slate-200 text-xs px-2 py-0.5 rounded-full">{ordersInCol.length}</span>
                    </div>
                    <SortableContext
                      items={ordersInCol.map(o => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[200px]">
                        {ordersInCol.map(order => (
                          <SortableOrderCard key={order.id} order={order} />
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
      )}
    </div>
  );
};

export default Orders;
