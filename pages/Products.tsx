
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Package, AlertTriangle, Upload, Loader2, X, Edit, Trash2, PackagePlus } from 'lucide-react';
import { PRODUCTION_TYPE_LABELS } from '../constants';
import { Product, ProductionType } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { productsService } from '../services/productsService';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    production_type: 'import' as ProductionType,
    base_price: '',
    base_cost: '',
    current_stock: '',
    min_stock_alert: ''
  });
  
  const [stockUpdate, setStockUpdate] = useState({
    type: 'add' as 'add' | 'subtract' | 'set',
    quantity: ''
  });

  // Load products from Supabase
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('שגיאה בטעינת המוצרים', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || p.sku.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('נא לבחור קובץ תמונה תקין', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('נא לבחור קובץ תמונה תקין', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.name || !formData.base_price) {
      showToast('נא למלא שדות חובה (מק"ט, שם, מחיר)', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingProduct) {
        // Update existing product
        await productsService.update(editingProduct.id, {
          sku: formData.sku,
          name: formData.name,
          production_type: formData.production_type,
          base_price: parseFloat(formData.base_price),
          base_cost: parseFloat(formData.base_cost) || 0,
          min_stock_alert: parseInt(formData.min_stock_alert) || 0,
          image_url: imagePreview || editingProduct.image_url
        });
        showToast('המוצר עודכן בהצלחה');
        setIsEditModalOpen(false);
      } else {
        // Create new product
        await productsService.create({
          sku: formData.sku,
          name: formData.name,
          production_type: formData.production_type,
          base_price: parseFloat(formData.base_price),
          base_cost: parseFloat(formData.base_cost) || 0,
          current_stock: parseInt(formData.current_stock) || 0,
          min_stock_alert: parseInt(formData.min_stock_alert) || 0,
          image_url: imagePreview || undefined
        });
        showToast('המוצר נוסף בהצלחה');
        setIsAddModalOpen(false);
      }
      
      // Reload products
      await loadProducts();
      
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        production_type: 'import',
        base_price: '',
        base_cost: '',
        current_stock: '',
        min_stock_alert: ''
      });
      setImagePreview(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('שגיאה בשמירת המוצר', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      production_type: product.production_type,
      base_price: product.base_price.toString(),
      base_cost: product.base_cost.toString(),
      current_stock: product.current_stock.toString(),
      min_stock_alert: product.min_stock_alert.toString()
    });
    setImagePreview(product.image_url || null);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      // Note: In a real app, you might want to check if product is used in orders
      // For now, we'll allow deletion
      await productsService.delete(deletingProduct.id);
      showToast('המוצר נמחק בהצלחה');
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
      // Reload products
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('שגיאה במחיקת המוצר', 'error');
    }
  };

  const handleStockUpdate = (product: Product) => {
    setStockProduct(product);
    setStockUpdate({ type: 'add', quantity: '' });
    setIsStockModalOpen(true);
  };

  const confirmStockUpdate = async () => {
    if (!stockProduct || !stockUpdate.quantity) {
      showToast('נא להזין כמות', 'error');
      return;
    }

    const quantity = parseInt(stockUpdate.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast('נא להזין כמות תקינה', 'error');
      return;
    }

    try {
      let newStock = stockProduct.current_stock;
      if (stockUpdate.type === 'add') {
        newStock += quantity;
      } else if (stockUpdate.type === 'subtract') {
        newStock = Math.max(0, newStock - quantity);
      } else {
        newStock = quantity;
      }

      await productsService.update(stockProduct.id, {
        current_stock: newStock
      });

      showToast('המלאי עודכן בהצלחה');
      setIsStockModalOpen(false);
      setStockProduct(null);
      setStockUpdate({ type: 'add', quantity: '' });
      
      // Reload products
      await loadProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      showToast('שגיאה בעדכון המלאי', 'error');
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
          <h2 className="text-2xl font-bold text-slate-800">מוצרים</h2>
          <p className="text-slate-500 text-sm">קטלוג מוצרים ומחירים</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>מוצר חדש</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="חיפוש לפי שם או מק״ט..." 
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex gap-3 mb-3">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                    <Package size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-lg mb-1">{product.name}</div>
                  <div className="font-mono text-xs text-slate-500 mb-2">{product.sku}</div>
                  <span className="inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                    {PRODUCTION_TYPE_LABELS[product.production_type]}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">מחיר בסיס</div>
                  <div className="font-bold text-slate-900">₪{product.base_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">עלות בסיס</div>
                  <div className="font-medium text-slate-600">₪{product.base_cost.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">מלאי</div>
                  <div className={`flex items-center gap-2 ${product.current_stock <= product.min_stock_alert ? 'text-red-600 font-bold' : 'text-slate-700 font-medium'}`}>
                    <span>{product.current_stock.toLocaleString()}</span>
                    {product.current_stock <= product.min_stock_alert && (
                      <AlertTriangle size={16} className="text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => handleStockUpdate(product)}
                  className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-700 rounded-lg text-sm font-medium touch-manipulation transition-colors"
                >
                  עדכן מלאי
                </button>
                <button 
                  onClick={() => handleEditProduct(product)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 rounded-lg touch-manipulation transition-colors"
                  aria-label="ערוך"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product)}
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
          <table className="w-full text-right min-w-[900px]">
            <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">תמונה</th>
                <th className="px-6 py-4">מק״ט</th>
                <th className="px-6 py-4">שם המוצר</th>
                <th className="px-6 py-4">סוג ייצור</th>
                <th className="px-6 py-4">מחיר בסיס</th>
                <th className="px-6 py-4">עלות בסיס</th>
                <th className="px-6 py-4">מלאי</th>
                <th className="px-6 py-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Package size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{product.sku}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {PRODUCTION_TYPE_LABELS[product.production_type]}
                  </td>
                  <td className="px-6 py-4 font-medium">₪{product.base_price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-500">₪{product.base_cost.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={product.current_stock <= product.min_stock_alert ? 'text-red-600 font-bold' : 'text-slate-700'}>
                        {product.current_stock.toLocaleString()}
                      </span>
                      {product.current_stock <= product.min_stock_alert && (
                        <AlertTriangle size={14} className="text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleStockUpdate(product)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="עדכן מלאי"
                      >
                        <PackagePlus size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="ערוך"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product)}
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
      </div>

      {/* Add/Edit Product Modal */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingProduct(null);
          setFormData({
            sku: '',
            name: '',
            production_type: 'import',
            base_price: '',
            base_cost: '',
            current_stock: '',
            min_stock_alert: ''
          });
          setImagePreview(null);
        }} 
        title={editingProduct ? 'ערוך מוצר' : 'מוצר חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1 space-y-1">
               <label className="text-sm font-medium text-slate-700">מק"ט *</label>
               <input 
                 name="sku"
                 value={formData.sku}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="col-span-2 space-y-1">
               <label className="text-sm font-medium text-slate-700">שם המוצר *</label>
               <input 
                 name="name"
                 value={formData.name}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">סוג ייצור</label>
             <select 
               name="production_type"
               value={formData.production_type}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             >
               <option value="import">יבוא</option>
               <option value="local">ייצור עצמי</option>
             </select>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">מחיר ללקוח (₪) *</label>
               <input 
                 name="base_price"
                 value={formData.base_price}
                 onChange={handleInputChange}
                 type="number" 
                 step="0.01"
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">עלות (₪)</label>
               <input 
                 name="base_cost"
                 value={formData.base_cost}
                 onChange={handleInputChange}
                 type="number" 
                 step="0.01"
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">מלאי נוכחי</label>
               <input 
                 name="current_stock"
                 value={formData.current_stock}
                 onChange={handleInputChange}
                 type="number" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">התראת מינימום</label>
               <input 
                 name="min_stock_alert"
                 value={formData.min_stock_alert}
                 onChange={handleInputChange}
                 type="number" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
           </div>

           <div 
             onClick={() => fileInputRef.current?.click()}
             onDragOver={handleDragOver}
             onDrop={handleDrop}
             className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 cursor-pointer relative overflow-hidden transition-colors ${imagePreview ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}
           >
             <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileSelect}
             />
             
             {imagePreview ? (
                 <div className="relative w-full h-40 flex items-center justify-center group">
                     <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
                     <button 
                         type="button"
                         onClick={removeImage}
                         className="absolute top-0 right-0 p-1.5 bg-white rounded-full shadow-md text-slate-500 hover:text-red-500 transition-colors"
                     >
                         <X size={16} />
                     </button>
                 </div>
             ) : (
                 <>
                     <Upload size={24} className="mb-2" />
                     <span className="text-sm font-medium text-center">לחץ להעלאת תמונה או גרור לכאן</span>
                     <span className="text-xs text-slate-400 mt-1">PNG, JPG עד 5MB</span>
                 </>
             )}
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">ביטול</button>
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
             >
               {isSubmitting && <Loader2 size={16} className="animate-spin" />}
               {editingProduct ? 'שמור שינויים' : 'שמור מוצר'}
             </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        title="מחיקת מוצר"
      >
        <div className="space-y-4">
          {deletingProduct && (
            <>
              <p className="text-slate-700">
                האם אתה בטוח שברצונך למחוק את המוצר <strong>{deletingProduct.name}</strong>?
              </p>
              {false && ( // TODO: Check if product is used in orders
                false
              ) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  ⚠️ לא ניתן למחוק מוצר שיש לו הזמנות פעילות.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingProduct(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                  מחק
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockProduct(null);
          setStockUpdate({ type: 'add', quantity: '' });
        }}
        title="עדכן מלאי"
      >
        <div className="space-y-4">
          {stockProduct && (
            <>
              <div>
                <p className="text-sm text-slate-600 mb-2">מוצר: <strong>{stockProduct.name}</strong></p>
                <p className="text-sm text-slate-600">מלאי נוכחי: <strong>{stockProduct.current_stock}</strong></p>
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
                    מלאי חדש: <strong>
                      {stockUpdate.type === 'add' 
                        ? stockProduct.current_stock + parseInt(stockUpdate.quantity)
                        : stockUpdate.type === 'subtract'
                        ? Math.max(0, stockProduct.current_stock - parseInt(stockUpdate.quantity))
                        : parseInt(stockUpdate.quantity)}
                    </strong>
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsStockModalOpen(false);
                    setStockProduct(null);
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
    </div>
  );
};

export default Products;
