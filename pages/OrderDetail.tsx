
import React, { useState } from 'react';
import { ArrowRight, Printer, CreditCard, Truck, CheckCircle, Clock, Edit, Copy, Share2, MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { Order, OrderStatus, LocalProductionStatus, ImportStatus } from '../types';
import { mockOrders } from '../services/mockData';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PRODUCTION_TYPE_LABELS, LOCAL_PRODUCTION_STATUS_LABELS, IMPORT_STATUS_LABELS } from '../constants';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
  onEdit?: (id: string) => void;
  onViewCustomer?: (customerId: string) => void;
}

interface OrderComment {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  type: 'status_change' | 'production_change' | 'comment' | 'payment';
  description: string;
  author: string;
  created_at: string;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack, onEdit, onViewCustomer }) => {
  const { showToast } = useToast();
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  const order = orderIndex !== -1 ? mockOrders[orderIndex] : null;
  
  const [localOrder, setLocalOrder] = useState<Order | null>(order);
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    {
      id: '1',
      type: 'status_change',
      description: `הזמנה נוצרה - ${ORDER_STATUS_LABELS[localOrder?.status || 'draft']}`,
      author: 'דני מנהל',
      created_at: localOrder?.created_at || new Date().toISOString()
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isProductionStatusModalOpen, setIsProductionStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [selectedProductionStatus, setSelectedProductionStatus] = useState<LocalProductionStatus | ImportStatus | null>(null);
  const [statusChangeNote, setStatusChangeNote] = useState('');

  if (!localOrder) {
    return <div>הזמנה לא נמצאה</div>;
  }

  const nonEditableStatuses: OrderStatus[] = ['shipped', 'delivered', 'completed', 'cancelled'];
  const canEdit = !nonEditableStatuses.includes(localOrder.status);

  // Get available next statuses
  const getAvailableStatuses = (): OrderStatus[] => {
    const statusFlow: Record<OrderStatus, OrderStatus[]> = {
      draft: ['pending_approval', 'cancelled'],
      pending_approval: ['approved', 'cancelled'],
      approved: ['pending_payment', 'cancelled'],
      pending_payment: ['paid', 'cancelled'],
      paid: ['in_production'],
      in_production: ['ready'],
      ready: ['shipped'],
      shipped: ['delivered'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };
    return statusFlow[localOrder.status] || [];
  };

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    
    const oldStatus = localOrder.status;
    const newOrder = { ...localOrder, status: selectedStatus };
    setLocalOrder(newOrder);
    
    // Update in mock data
    if (orderIndex !== -1) {
      mockOrders[orderIndex] = newOrder;
    }
    
    // Add to activity log
    setActivityLog(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'status_change',
      description: `שינוי סטטוס: ${ORDER_STATUS_LABELS[oldStatus]} → ${ORDER_STATUS_LABELS[selectedStatus]}${statusChangeNote ? ` (${statusChangeNote})` : ''}`,
      author: 'דני מנהל',
      created_at: new Date().toISOString()
    }, ...prev]);
    
    showToast('סטטוס ההזמנה עודכן בהצלחה');
    setIsStatusModalOpen(false);
    setSelectedStatus(null);
    setStatusChangeNote('');
  };

  const handleProductionStatusUpdate = () => {
    if (!selectedProductionStatus) return;
    
    const newOrder = { 
      ...localOrder, 
      ...(localOrder.production_type === 'local' 
        ? { local_production_status: selectedProductionStatus as LocalProductionStatus }
        : { import_status: selectedProductionStatus as ImportStatus })
    };
    setLocalOrder(newOrder);
    
    // Update in mock data
    if (orderIndex !== -1) {
      mockOrders[orderIndex] = newOrder;
    }
    
    // Add to activity log
    setActivityLog(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'production_change',
      description: `עדכון סטטוס ייצור: ${localOrder.production_type === 'local' 
        ? LOCAL_PRODUCTION_STATUS_LABELS[selectedProductionStatus as LocalProductionStatus]
        : IMPORT_STATUS_LABELS[selectedProductionStatus as ImportStatus]}`,
      author: 'דני מנהל',
      created_at: new Date().toISOString()
    }, ...prev]);
    
    showToast('סטטוס הייצור עודכן בהצלחה');
    setIsProductionStatusModalOpen(false);
    setSelectedProductionStatus(null);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      showToast('נא להזין הערה', 'error');
      return;
    }
    
    const comment: OrderComment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment,
      author: 'דני מנהל',
      created_at: new Date().toISOString()
    };
    
    setComments(prev => [comment, ...prev]);
    setActivityLog(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'comment',
      description: `הערה: ${newComment.substring(0, 50)}${newComment.length > 50 ? '...' : ''}`,
      author: 'דני מנהל',
      created_at: new Date().toISOString()
    }, ...prev]);
    
    setNewComment('');
    setIsCommentModalOpen(false);
    showToast('הערה נוספה בהצלחה');
  };

  const handleApproveOrder = () => {
    if (localOrder.status === 'pending_approval') {
      setSelectedStatus('approved');
      handleStatusUpdate();
    }
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(localOrder.order_number);
    showToast('מספר הזמנה הועתק');
  };

  const handlePrintOrder = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowRight size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">הזמנה #{localOrder.order_number}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[localOrder.status]}`}>
                {ORDER_STATUS_LABELS[localOrder.status]}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">נוצר ב- {new Date(localOrder.created_at).toLocaleDateString('he-IL')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <button 
              onClick={() => onEdit(localOrder.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit size={18} />
              ערוך
            </button>
          )}
          <button 
            onClick={handleCopyOrderNumber}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="העתק מספר הזמנה"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer & Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium mb-3 sm:mb-4 uppercase tracking-wider">פרטי לקוח</h3>
              <div className="space-y-2">
                <div className="text-lg font-bold text-slate-800">{localOrder.customer_name}</div>
                <div className="text-slate-600">ID: {localOrder.customer_id}</div>
                {onViewCustomer && (
                  <button 
                    onClick={() => onViewCustomer(localOrder.customer_id)}
                    className="text-blue-600 text-sm hover:underline mt-2"
                  >
                    צפה בכרטיס לקוח
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium mb-3 sm:mb-4 uppercase tracking-wider">פרטי אירוע</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">שם האירוע:</span>
                  <span className="font-medium">{localOrder.event_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">תאריך:</span>
                  <span className="font-medium">{localOrder.event_date || '-'}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>דדליין:</span>
                  <span>{localOrder.deadline || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">פריטים בהזמנה</h3>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {localOrder.items?.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="font-medium text-slate-800 mb-2">{item.product_name}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">כמות</div>
                      <div className="font-medium">{item.quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">מחיר יח'</div>
                      <div className="font-medium">₪{item.unit_price}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">סה"כ</div>
                      <div className="font-bold">₪{item.total.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-slate-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">סה"כ ביניים:</span>
                  <span className="font-medium">₪{localOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">מע"מ (17%):</span>
                  <span className="font-medium">₪{localOrder.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                  <span>סה"כ לתשלום:</span>
                  <span>₪{localOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">מוצר</th>
                  <th className="px-6 py-3">כמות</th>
                  <th className="px-6 py-3">מחיר יח'</th>
                  <th className="px-6 py-3">סה"כ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.product_name}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">₪{item.unit_price}</td>
                    <td className="px-6 py-4 font-medium">₪{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-left font-medium text-slate-600">סה"כ ביניים:</td>
                  <td className="px-6 py-3 font-medium">₪{localOrder.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-left font-medium text-slate-600">מע"מ (17%):</td>
                  <td className="px-6 py-3 font-medium">₪{localOrder.tax_amount.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="px-6 py-4 text-left font-bold text-slate-800 text-lg">סה"כ לתשלום:</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-lg">₪{localOrder.total_amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        {/* Sidebar Status & Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-slate-800 font-bold mb-4">פעולות מהירות</h3>
            <div className="space-y-3">
              {localOrder.status === 'pending_approval' && (
                <button 
                  onClick={handleApproveOrder}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  אשר הזמנה
                </button>
              )}
              <button 
                onClick={() => setIsStatusModalOpen(true)}
                className="w-full py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                עדכן סטטוס
              </button>
              <button 
                onClick={handlePrintOrder}
                className="w-full py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                הדפס הזמנת עבודה
              </button>
              <button className="w-full py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                <CreditCard size={18} />
                שלח דרישת תשלום
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-slate-800 font-bold mb-4">סטטוס ייצור</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">סוג:</span>
                <span className="font-medium bg-slate-100 px-2 py-1 rounded">{PRODUCTION_TYPE_LABELS[localOrder.production_type]}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <Clock size={20} />
                  <span className="font-medium">
                    {localOrder.production_type === 'local' 
                      ? (localOrder.local_production_status ? LOCAL_PRODUCTION_STATUS_LABELS[localOrder.local_production_status] : 'ממתין להדפסה')
                      : (localOrder.import_status ? IMPORT_STATUS_LABELS[localOrder.import_status] : 'ממתין לייצור בסין')}
                  </span>
                </div>
                <button 
                  onClick={() => setIsProductionStatusModalOpen(true)}
                  className="w-full py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors text-sm"
                >
                  עדכן סטטוס ייצור
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">הערות</h3>
          <button 
            onClick={() => setIsCommentModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <Plus size={16} />
            הוסף הערה
          </button>
        </div>
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            אין הערות עדיין
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-slate-800">{comment.author}</div>
                    <div className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString('he-IL')}</div>
                  </div>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">היסטוריית פעילות</h3>
        <div className="space-y-3">
          {activityLog.map(activity => (
            <div key={activity.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-b-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm text-slate-700">{activity.description}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {activity.author} • {new Date(activity.created_at).toLocaleString('he-IL')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedStatus(null);
          setStatusChangeNote('');
        }}
        title="עדכן סטטוס הזמנה"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">סטטוס חדש</label>
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">בחר סטטוס</option>
              {getAvailableStatuses().map(status => (
                <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">הערה (אופציונלי)</label>
            <textarea
              value={statusChangeNote}
              onChange={(e) => setStatusChangeNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
              placeholder="הוסף הערה לשינוי הסטטוס..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedStatus(null);
                setStatusChangeNote('');
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              ביטול
            </button>
            <button 
              onClick={handleStatusUpdate}
              disabled={!selectedStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              עדכן
            </button>
          </div>
        </div>
      </Modal>

      {/* Production Status Update Modal */}
      <Modal
        isOpen={isProductionStatusModalOpen}
        onClose={() => {
          setIsProductionStatusModalOpen(false);
          setSelectedProductionStatus(null);
        }}
        title="עדכן סטטוס ייצור"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">סטטוס ייצור חדש</label>
            <select
              value={selectedProductionStatus || ''}
              onChange={(e) => setSelectedProductionStatus(e.target.value as LocalProductionStatus | ImportStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">בחר סטטוס</option>
              {localOrder.production_type === 'local' ? (
                Object.entries(LOCAL_PRODUCTION_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))
              ) : (
                Object.entries(IMPORT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsProductionStatusModalOpen(false);
                setSelectedProductionStatus(null);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              ביטול
            </button>
            <button 
              onClick={handleProductionStatusUpdate}
              disabled={!selectedProductionStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              עדכן
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false);
          setNewComment('');
        }}
        title="הוסף הערה"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">הערה</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32"
              placeholder="הזן הערה..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsCommentModalOpen(false);
                setNewComment('');
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              ביטול
            </button>
            <button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              שמור
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
