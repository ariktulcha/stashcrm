
import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MoreVertical, UserPlus, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { CUSTOMER_TYPE_LABELS } from '../constants';
import { Customer, CustomerType } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { customersService } from '../services/customersService';

interface CustomersProps {
  onViewCustomer?: (customerId: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ onViewCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customers from Supabase
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast('שגיאה בטעינת הלקוחות', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    customer_type: 'private' as CustomerType,
    company_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address_city: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.first_name?.includes(searchTerm) || 
    c.last_name?.includes(searchTerm) || 
    c.company_name?.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.phone) {
      showToast('נא למלא שדות חובה (שם פרטי וטלפון)', 'error');
      return;
    }

    if (formData.customer_type === 'business' && !formData.company_name) {
      showToast('נא למלא שם חברה ללקוח עסקי', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingCustomer) {
        // Update existing customer
        await customersService.update(editingCustomer.id, {
          customer_type: formData.customer_type,
          company_name: formData.company_name || undefined,
          first_name: formData.first_name,
          last_name: formData.last_name || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          address_city: formData.address_city || undefined
        });
        showToast('הלקוח עודכן בהצלחה');
        setIsEditModalOpen(false);
      } else {
        // Create new customer
        await customersService.create({
          customer_type: formData.customer_type,
          company_name: formData.company_name || undefined,
          first_name: formData.first_name,
          last_name: formData.last_name || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          address_city: formData.address_city || undefined,
          is_active: true
        });
        showToast('הלקוח נוסף בהצלחה');
        setIsAddModalOpen(false);
      }
      
      // Reload customers
      await loadCustomers();
      
      setEditingCustomer(null);
      setFormData({
        customer_type: 'private',
        company_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address_city: ''
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      showToast('שגיאה בשמירת הלקוח', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_type: customer.customer_type,
      company_name: customer.company_name || '',
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone,
      email: customer.email || '',
      address_city: customer.address_city || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    
    try {
      // Note: In a real app, you might want to check if customer has active orders
      // For now, we'll mark as inactive instead of deleting
      await customersService.update(deletingCustomer.id, { is_active: false });
      showToast('הלקוח סומן כלא פעיל');
      setIsDeleteModalOpen(false);
      setDeletingCustomer(null);
      // Reload customers
      await loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast('שגיאה במחיקת הלקוח', 'error');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">לקוחות</h2>
          <p className="text-slate-500 text-sm">ניהול מאגר הלקוחות</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <UserPlus size={18} />
          <span>לקוח חדש</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="חיפוש שם, חברה או טלפון..." 
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  {customer.customer_type === 'business' ? (
                    <>
                      <div className="font-bold text-slate-900 text-lg mb-1 truncate">{customer.company_name}</div>
                      <div className="text-sm text-slate-600">{customer.first_name} {customer.last_name}</div>
                    </>
                  ) : (
                    <div className="font-bold text-slate-900 text-lg">{customer.first_name} {customer.last_name}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded border shrink-0 ${customer.customer_type === 'business' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {CUSTOMER_TYPE_LABELS[customer.customer_type]}
                </span>
              </div>
              <div className="space-y-2 mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span dir="ltr" className="truncate">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address_city && (
                  <div className="text-xs text-slate-500">{customer.address_city}</div>
                )}
              </div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-xs text-slate-500">הזמנות</div>
                  <div className="font-medium text-slate-900">{customer.orders_count}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500">סה"כ רכישות</div>
                  <div className="font-bold text-slate-900">₪{customer.total_purchases.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                {onViewCustomer && (
                  <button 
                    onClick={() => onViewCustomer(customer.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium touch-manipulation transition-colors"
                  >
                    צפה
                  </button>
                )}
                <button 
                  onClick={() => handleEditCustomer(customer)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg touch-manipulation transition-colors"
                  aria-label="ערוך"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteCustomer(customer)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-lg touch-manipulation transition-colors"
                  aria-label="מחק"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">שם / חברה</th>
                <th className="px-6 py-4">פרטי קשר</th>
                <th className="px-6 py-4">סוג</th>
                <th className="px-6 py-4">עיר</th>
                <th className="px-6 py-4">הזמנות</th>
                <th className="px-6 py-4">סה"כ רכישות</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    {customer.customer_type === 'business' ? (
                      <div>
                        <div className="font-medium text-slate-900">{customer.company_name}</div>
                        <div className="text-xs text-slate-500">{customer.first_name} {customer.last_name}</div>
                      </div>
                    ) : (
                      <div className="font-medium text-slate-900">{customer.first_name} {customer.last_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded border ${customer.customer_type === 'business' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                      {CUSTOMER_TYPE_LABELS[customer.customer_type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{customer.address_city || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm font-medium">{customer.orders_count}</td>
                  <td className="px-6 py-4 text-slate-900 font-medium">₪{customer.total_purchases.toLocaleString()}</td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-1">
                      {onViewCustomer && (
                        <button 
                          onClick={() => onViewCustomer(customer.id)}
                          className="p-2 hover:bg-blue-50 rounded-full text-blue-600 hover:text-blue-700 transition-colors"
                          title="צפה בפרטים"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        className="p-2 hover:bg-blue-50 rounded-full text-blue-600 hover:text-blue-700 transition-colors"
                        title="ערוך"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer)}
                        className="p-2 hover:bg-red-50 rounded-full text-red-600 hover:text-red-700 transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingCustomer(null);
          setFormData({
            customer_type: 'private',
            company_name: '',
            first_name: '',
            last_name: '',
            phone: '',
            email: '',
            address_city: ''
          });
        }} 
        title={editingCustomer ? 'ערוך לקוח' : 'לקוח חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${formData.customer_type === 'private' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input 
                type="radio" 
                name="customer_type" 
                value="private" 
                checked={formData.customer_type === 'private'}
                onChange={(e) => setFormData({...formData, customer_type: e.target.value as CustomerType})}
                className="w-4 h-4 text-blue-600" 
              />
              <span className="text-sm font-medium">לקוח פרטי</span>
            </label>
            <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${formData.customer_type === 'business' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input 
                type="radio" 
                name="customer_type" 
                value="business" 
                checked={formData.customer_type === 'business'}
                onChange={(e) => setFormData({...formData, customer_type: e.target.value as CustomerType})}
                className="w-4 h-4 text-blue-600" 
              />
              <span className="text-sm font-medium">לקוח עסקי</span>
            </label>
          </div>
          
          {formData.customer_type === 'business' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
               <label className="text-sm font-medium text-slate-700">שם חברה *</label>
               <input 
                 name="company_name" 
                 value={formData.company_name}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">שם פרטי *</label>
               <input 
                 name="first_name" 
                 value={formData.first_name}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">שם משפחה</label>
               <input 
                 name="last_name" 
                 value={formData.last_name}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">טלפון *</label>
               <input 
                 name="phone" 
                 value={formData.phone}
                 onChange={handleInputChange}
                 type="tel" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">אימייל</label>
               <input 
                 name="email" 
                 value={formData.email}
                 onChange={handleInputChange}
                 type="email" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">עיר / כתובת</label>
             <input 
               name="address_city" 
               value={formData.address_city}
               onChange={handleInputChange}
               type="text" 
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
             />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">ביטול</button>
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
             >
               {isSubmitting && <Loader2 size={16} className="animate-spin" />}
               {editingCustomer ? 'שמור שינויים' : 'שמור לקוח'}
             </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCustomer(null);
        }}
        title="מחיקת לקוח"
      >
        <div className="space-y-4">
          {deletingCustomer && (
            <>
              <p className="text-slate-700">
                האם אתה בטוח שברצונך למחוק את הלקוח{' '}
                <strong>
                  {deletingCustomer.customer_type === 'business' 
                    ? deletingCustomer.company_name 
                    : `${deletingCustomer.first_name} ${deletingCustomer.last_name}`}
                </strong>?
              </p>
              {false && // TODO: Check if customer has active orders
              (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  ⚠️ ללקוח זה יש הזמנות פעילות. במקום מחיקה, הלקוח יסומן כלא פעיל.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingCustomer(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmDeleteCustomer}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                  מחק
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
