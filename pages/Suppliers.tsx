
import React, { useState } from 'react';
import { Phone, Mail, MapPin, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { mockSuppliers } from '../services/mockData';
import { Supplier } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    contact_name: '',
    email: '',
    phone: '',
    lead_time_days: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_name || !formData.phone) {
      showToast('נא למלא שדות חובה (שם, איש קשר, טלפון)', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (editingSupplier) {
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id 
            ? {
                ...supplier,
                name: formData.name,
                country: formData.country,
                contact_name: formData.contact_name,
                email: formData.email,
                phone: formData.phone,
                lead_time_days: parseInt(formData.lead_time_days) || 0
              }
            : supplier
        ));
        showToast('הספק עודכן בהצלחה');
        setIsEditModalOpen(false);
      } else {
        const newSupplier: Supplier = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          country: formData.country,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
          lead_time_days: parseInt(formData.lead_time_days) || 0
        };
        setSuppliers(prev => [newSupplier, ...prev]);
        showToast('הספק נוסף בהצלחה');
        setIsAddModalOpen(false);
      }
      
      setIsSubmitting(false);
      setEditingSupplier(null);
      setFormData({
        name: '',
        country: '',
        contact_name: '',
        email: '',
        phone: '',
        lead_time_days: ''
      });
    }, 500);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      country: supplier.country,
      contact_name: supplier.contact_name,
      email: supplier.email,
      phone: supplier.phone,
      lead_time_days: supplier.lead_time_days.toString()
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSupplier = () => {
    if (!deletingSupplier) return;
    setSuppliers(prev => prev.filter(supplier => supplier.id !== deletingSupplier.id));
    showToast('הספק נמחק בהצלחה');
    setIsDeleteModalOpen(false);
    setDeletingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ספקים</h2>
          <p className="text-slate-500 text-sm">ניהול ספקים ויצרנים</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>ספק חדש</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
            <div className="absolute top-4 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEditSupplier(supplier)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="ערוך"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleDeleteSupplier(supplier)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="מחק"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{supplier.name}</h3>
            <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
              <MapPin size={14} />
              {supplier.country}
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="font-bold">{supplier.contact_name.charAt(0)}</span>
                </div>
                <span>{supplier.contact_name}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span dir="ltr">{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{supplier.email}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-500">
               <span>זמן אספקה ממוצע:</span>
               <span className="font-medium text-slate-800">{supplier.lead_time_days} ימים</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingSupplier(null);
          setFormData({
            name: '',
            country: '',
            contact_name: '',
            email: '',
            phone: '',
            lead_time_days: ''
          });
        }}
        title={editingSupplier ? 'ערוך ספק' : 'ספק חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">שם הספק *</label>
            <input
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מדינה</label>
              <input
                name="country"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">זמן אספקה (ימים)</label>
              <input
                name="lead_time_days"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({...formData, lead_time_days: e.target.value})}
                type="number"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">איש קשר *</label>
            <input
              name="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">טלפון *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                type="tel"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">אימייל</label>
              <input
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                type="email"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingSupplier(null);
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
              {editingSupplier ? 'שמור שינויים' : 'שמור ספק'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSupplier(null);
        }}
        title="מחיקת ספק"
      >
        <div className="space-y-4">
          {deletingSupplier && (
            <>
              <p className="text-slate-700">
                האם אתה בטוח שברצונך למחוק את הספק <strong>{deletingSupplier.name}</strong>?
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingSupplier(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmDeleteSupplier}
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

export default Suppliers;
