
import React, { useState, useMemo, useEffect } from 'react';
import { Plane, Ship, Edit, Plus, Loader2, Package, AlertCircle } from 'lucide-react';
import { IMPORT_STATUS_LABELS } from '../constants';
import { ImportOrder, ImportStatus } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { importOrdersService } from '../services/importOrdersService';

const ProductionImport: React.FC = () => {
  const [importOrders, setImportOrders] = useState<ImportOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ImportOrder | null>(null);
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load import orders from Supabase
  useEffect(() => {
    loadImportOrders();
  }, []);

  const loadImportOrders = async () => {
    try {
      setIsLoading(true);
      const data = await importOrdersService.getAll();
      setImportOrders(data);
    } catch (error) {
      console.error('Error loading import orders:', error);
      showToast('שגיאה בטעינת הזמנות היבוא', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    supplier_name: '',
    order_numbers: '',
    total_cost: '',
    estimated_arrival: '',
    tracking_number: '',
    status: 'quote_requested' as ImportStatus
  });

  // Calculate progress percentage based on status
  const getProgressPercentage = (status: ImportStatus): number => {
    const statusOrder: ImportStatus[] = [
      'quote_requested', 'quote_received', 'order_placed', 'graphics_sent',
      'graphics_approved', 'payment_sent', 'in_production', 'samples_received',
      'samples_approved', 'shipped', 'in_transit', 'customs', 'customs_released',
      'received', 'quality_check', 'repackaging', 'ready_ship'
    ];
    const index = statusOrder.indexOf(status);
    return index >= 0 ? Math.round(((index + 1) / statusOrder.length) * 100) : 0;
  };

  // Filter orders with urgent deadlines
  const urgentOrders = useMemo(() => {
    return importOrders.filter(imp => {
      if (!imp.estimated_arrival) return false;
      const arrival = new Date(imp.estimated_arrival);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return arrival <= threeDaysFromNow && arrival >= new Date();
    });
  }, [importOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: ImportStatus) => {
    try {
      await importOrdersService.update(orderId, { status: newStatus });
      
      // Update local state
      setImportOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      showToast('סטטוס היבוא עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating import order status:', error);
      showToast('שגיאה בעדכון סטטוס היבוא', 'error');
    }
  };

  const handleEditOrder = (order: ImportOrder) => {
    setEditingOrder(order);
    setFormData({
      supplier_name: order.supplier_name,
      order_numbers: order.order_numbers.join(', '),
      total_cost: order.total_cost.toString(),
      estimated_arrival: order.estimated_arrival,
      tracking_number: order.tracking_number || '',
      status: order.status
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name || !formData.order_numbers) {
      showToast('נא למלא שדות חובה', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingOrder) {
        await importOrdersService.update(editingOrder.id, {
          supplier_name: formData.supplier_name,
          order_numbers: formData.order_numbers.split(',').map(s => s.trim()),
          total_cost: parseFloat(formData.total_cost) || 0,
          estimated_arrival: formData.estimated_arrival,
          tracking_number: formData.tracking_number || undefined,
          status: formData.status
        });
        showToast('הזמנת היבוא עודכנה בהצלחה');
        setIsEditModalOpen(false);
      } else {
        await importOrdersService.create({
          supplier_name: formData.supplier_name,
          order_numbers: formData.order_numbers.split(',').map(s => s.trim()),
          total_cost: parseFloat(formData.total_cost) || 0,
          estimated_arrival: formData.estimated_arrival,
          tracking_number: formData.tracking_number || undefined,
          status: formData.status
        });
        showToast('הזמנת יבוא נוצרה בהצלחה');
        setIsAddModalOpen(false);
      }
      
      // Reload import orders
      await loadImportOrders();
      
      setEditingOrder(null);
      setFormData({
        supplier_name: '',
        order_numbers: '',
        total_cost: '',
        estimated_arrival: '',
        tracking_number: '',
        status: 'quote_requested'
      });
    } catch (error) {
      console.error('Error saving import order:', error);
      showToast('שגיאה בשמירת הזמנת היבוא', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">יבוא</h2>
          <p className="text-slate-500 text-sm">מעקב אחר הזמנות מספקים בחו״ל</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>הזמנת יבוא חדשה</span>
        </button>
      </div>

      {/* Alerts */}
      {urgentOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <h3 className="font-bold text-yellow-900">התראות דדליין</h3>
          </div>
          <div className="space-y-1">
            {urgentOrders.map(order => (
              <div key={order.id} className="text-sm text-yellow-800">
                • {order.id} - צפוי להגיע ב-{order.estimated_arrival}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {importOrders.map(imp => {
          const progress = getProgressPercentage(imp.status);
          return (
            <div key={imp.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Plane className="text-blue-500" size={20} />
                    {imp.id}
                  </h3>
                  <p className="text-slate-500 text-sm">{imp.supplier_name}</p>
                </div>
                <div className="text-left flex items-center gap-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">צפי הגעה: {imp.estimated_arrival}</div>
                    <div className="text-xs text-slate-500">{imp.tracking_number || 'אין מספר מעקב'}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditOrder(imp)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="ערוך"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 bg-slate-50 p-3 rounded-lg text-sm">
                <strong>הזמנות מקושרות:</strong> {imp.order_numbers.join(', ')}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">סטטוס</span>
                  <select
                    value={imp.status}
                    onChange={(e) => handleStatusUpdate(imp.id, e.target.value as ImportStatus)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {Object.entries(IMPORT_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="relative pt-6 pb-2">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                    <span>הוזמן</span>
                    <span className="text-blue-600">{IMPORT_STATUS_LABELS[imp.status]}</span>
                    <span>הגיע</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-600">
                  <strong>עלות כוללת:</strong> ₪{imp.total_cost.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  {progress}% הושלם
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Import Order Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingOrder(null);
          setFormData({
            supplier_name: '',
            order_numbers: '',
            total_cost: '',
            estimated_arrival: '',
            tracking_number: '',
            status: 'quote_requested'
          });
        }}
        title={editingOrder ? 'ערוך הזמנת יבוא' : 'הזמנת יבוא חדשה'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">שם ספק *</label>
            <input
              name="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">מספרי הזמנות (מופרדים בפסיק) *</label>
            <input
              name="order_numbers"
              value={formData.order_numbers}
              onChange={(e) => setFormData({...formData, order_numbers: e.target.value})}
              type="text"
              placeholder="24-00150, 24-00151"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">עלות כוללת (₪)</label>
              <input
                name="total_cost"
                value={formData.total_cost}
                onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">תאריך הגעה משוער</label>
              <input
                name="estimated_arrival"
                value={formData.estimated_arrival}
                onChange={(e) => setFormData({...formData, estimated_arrival: e.target.value})}
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">מספר מעקב</label>
            <input
              name="tracking_number"
              value={formData.tracking_number}
              onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
              type="text"
              placeholder="DHL123456789"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">סטטוס</label>
            <select
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as ImportStatus})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {Object.entries(IMPORT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingOrder(null);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              ביטול
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {editingOrder ? 'שמור שינויים' : 'צור הזמנת יבוא'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductionImport;
