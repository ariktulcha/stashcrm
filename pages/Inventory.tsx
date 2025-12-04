
import React, { useState } from 'react';
import { AlertTriangle, Plus, Edit, Trash2, PackagePlus, Loader2 } from 'lucide-react';
import { mockStockItems } from '../services/mockData';
import { STOCK_TYPE_LABELS } from '../constants';
import { StockItem } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

const Inventory: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockUpdateModalOpen, setIsStockUpdateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    type: 'raw_material',
    current_quantity: '',
    min_quantity: '',
    unit: 'units',
    unit_cost: ''
  });

  const [stockUpdate, setStockUpdate] = useState({
    type: 'add' as 'add' | 'subtract' | 'set',
    quantity: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.name) {
      showToast('נא למלא שדות חובה (מק"ט ושם)', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (editingItem) {
        setStockItems(prev => prev.map(item => 
          item.id === editingItem.id 
            ? {
                ...item,
                sku: formData.sku,
                name: formData.name,
                type: formData.type as any,
                min_quantity: parseInt(formData.min_quantity) || 0,
                unit: formData.unit,
                unit_cost: parseFloat(formData.unit_cost) || 0
              }
            : item
        ));
        showToast('הפריט עודכן בהצלחה');
        setIsEditModalOpen(false);
      } else {
        const newItem: StockItem = {
          id: Math.random().toString(36).substr(2, 9),
          sku: formData.sku,
          name: formData.name,
          type: formData.type as any,
          current_quantity: parseInt(formData.current_quantity) || 0,
          min_quantity: parseInt(formData.min_quantity) || 0,
          unit: formData.unit,
          unit_cost: parseFloat(formData.unit_cost) || 0
        };
        setStockItems(prev => [newItem, ...prev]);
        showToast('הפריט נוסף בהצלחה');
        setIsAddModalOpen(false);
      }
      
      setIsSubmitting(false);
      setEditingItem(null);
      setFormData({
        sku: '',
        name: '',
        type: 'raw_material',
        current_quantity: '',
        min_quantity: '',
        unit: 'units',
        unit_cost: ''
      });
    }, 500);
  };

  const handleEditItem = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      type: item.type,
      current_quantity: item.current_quantity.toString(),
      min_quantity: item.min_quantity.toString(),
      unit: item.unit,
      unit_cost: item.unit_cost.toString()
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (item: StockItem) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteItem = () => {
    if (!deletingItem) return;
    setStockItems(prev => prev.filter(item => item.id !== deletingItem.id));
    showToast('הפריט נמחק בהצלחה');
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
  };

  const handleStockUpdate = (item: StockItem) => {
    setStockItem(item);
    setStockUpdate({ type: 'add', quantity: '' });
    setIsStockUpdateModalOpen(true);
  };

  const confirmStockUpdate = () => {
    if (!stockItem || !stockUpdate.quantity) {
      showToast('נא להזין כמות', 'error');
      return;
    }

    const quantity = parseInt(stockUpdate.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast('נא להזין כמות תקינה', 'error');
      return;
    }

    setStockItems(prev => prev.map(item => {
      if (item.id === stockItem.id) {
        let newQuantity = item.current_quantity;
        if (stockUpdate.type === 'add') {
          newQuantity += quantity;
        } else if (stockUpdate.type === 'subtract') {
          newQuantity = Math.max(0, newQuantity - quantity);
        } else {
          newQuantity = quantity;
        }
        return { ...item, current_quantity: newQuantity };
      }
      return item;
    }));

    showToast('המלאי עודכן בהצלחה');
    setIsStockUpdateModalOpen(false);
    setStockItem(null);
    setStockUpdate({ type: 'add', quantity: '' });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">מלאי</h2>
          <p className="text-slate-500 text-sm">חומרי גלם ומוצרים מתכלים</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>פריט חדש</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
            <tr>
              <th className="px-6 py-4">מק״ט</th>
              <th className="px-6 py-4">שם הפריט</th>
              <th className="px-6 py-4">סוג</th>
              <th className="px-6 py-4">כמות במלאי</th>
              <th className="px-6 py-4">סף התראה</th>
              <th className="px-6 py-4">עלות ליח'</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stockItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4 font-mono text-sm text-slate-600">{item.sku}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">
                  {STOCK_TYPE_LABELS[item.type] || item.type}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${item.current_quantity <= item.min_quantity ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.current_quantity} {item.unit}
                    </span>
                    {item.current_quantity <= item.min_quantity && (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{item.min_quantity} {item.unit}</td>
                <td className="px-6 py-4 text-slate-500">₪{item.unit_cost}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleStockUpdate(item)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="עדכן כמות"
                    >
                      <PackagePlus size={16} />
                    </button>
                    <button 
                      onClick={() => handleEditItem(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="ערוך"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingItem(null);
          setFormData({
            sku: '',
            name: '',
            type: 'raw_material',
            current_quantity: '',
            min_quantity: '',
            unit: 'units',
            unit_cost: ''
          });
        }}
        title={editingItem ? 'ערוך פריט' : 'פריט חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מק"ט *</label>
              <input
                name="sku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם *</label>
              <input
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">סוג</label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {Object.entries(STOCK_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">יחידה</label>
              <input
                name="unit"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">כמות נוכחית</label>
              <input
                name="current_quantity"
                value={formData.current_quantity}
                onChange={(e) => setFormData({...formData, current_quantity: e.target.value})}
                type="number"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">סף התראה</label>
              <input
                name="min_quantity"
                value={formData.min_quantity}
                onChange={(e) => setFormData({...formData, min_quantity: e.target.value})}
                type="number"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">עלות ליחידה (₪)</label>
            <input
              name="unit_cost"
              value={formData.unit_cost}
              onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingItem(null);
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
              {editingItem ? 'שמור שינויים' : 'שמור פריט'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        isOpen={isStockUpdateModalOpen}
        onClose={() => {
          setIsStockUpdateModalOpen(false);
          setStockItem(null);
          setStockUpdate({ type: 'add', quantity: '' });
        }}
        title="עדכן כמות במלאי"
      >
        <div className="space-y-4">
          {stockItem && (
            <>
              <div>
                <p className="text-sm text-slate-600 mb-2">פריט: <strong>{stockItem.name}</strong></p>
                <p className="text-sm text-slate-600">כמות נוכחית: <strong>{stockItem.current_quantity} {stockItem.unit}</strong></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">סוג עדכון</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockUpdate({...stockUpdate, type: 'add'})}
                    className={`p-3 border rounded-lg transition-colors ${
                      stockUpdate.type === 'add' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    הוספה
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockUpdate({...stockUpdate, type: 'subtract'})}
                    className={`p-3 border rounded-lg transition-colors ${
                      stockUpdate.type === 'subtract' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    הפחתה
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockUpdate({...stockUpdate, type: 'set'})}
                    className={`p-3 border rounded-lg transition-colors ${
                      stockUpdate.type === 'set' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    הגדר
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">כמות</label>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({...stockUpdate, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="הזן כמות"
                />
              </div>
              
              {stockUpdate.quantity && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    כמות חדשה: <strong>
                      {stockUpdate.type === 'add' 
                        ? stockItem.current_quantity + parseInt(stockUpdate.quantity)
                        : stockUpdate.type === 'subtract'
                        ? Math.max(0, stockItem.current_quantity - parseInt(stockUpdate.quantity))
                        : parseInt(stockUpdate.quantity)} {stockItem.unit}
                    </strong>
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsStockUpdateModalOpen(false);
                    setStockItem(null);
                    setStockUpdate({ type: 'add', quantity: '' });
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmStockUpdate}
                  disabled={!stockUpdate.quantity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  עדכן
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        title="מחיקת פריט"
      >
        <div className="space-y-4">
          {deletingItem && (
            <>
              <p className="text-slate-700">
                האם אתה בטוח שברצונך למחוק את הפריט <strong>{deletingItem.name}</strong>?
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingItem(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmDeleteItem}
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

export default Inventory;
