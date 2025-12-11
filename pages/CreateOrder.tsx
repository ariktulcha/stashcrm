
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, User, Calendar, Package, Upload, FileText, Trash2, Plus, X, Search, Loader2 } from 'lucide-react';
import { Product, Customer, CustomerType, ShippingType } from '../types';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import { generateOrderNumber } from '../services/orderUtils';
import { productsService } from '../services/productsService';
import { customersService } from '../services/customersService';
import { ordersService } from '../services/ordersService';

interface CreateOrderProps {
  onCancel: () => void;
}

interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  priceOverride?: number;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

const steps = [
  { id: 1, title: 'בחירת לקוח', icon: User },
  { id: 2, title: 'פרטי אירוע', icon: Calendar },
  { id: 3, title: 'מוצרים', icon: Package },
  { id: 4, title: 'גרפיקה', icon: Upload },
  { id: 5, title: 'סיכום', icon: FileText },
];

const CreateOrder: React.FC<CreateOrderProps> = ({ onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { showToast } = useToast();
  
  // Order State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data and generate order number
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsData, customersData, orderNum] = await Promise.all([
        productsService.getAll(),
        customersService.getAll(),
        generateOrderNumber()
      ]);
      setProducts(productsData);
      setCustomers(customersData);
      setOrderNumber(orderNum);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const [orderDetails, setOrderDetails] = useState({
    productionType: 'local' as 'local' | 'import',
    eventName: '',
    eventDate: '',
    deadline: '',
    shippingType: 'pickup' as ShippingType,
    shippingAddress: '',
    notes: ''
  });
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [graphicsNotes, setGraphicsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Customer creation form state
  const [customerFormData, setCustomerFormData] = useState({
    customer_type: 'private' as CustomerType,
    company_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address_city: ''
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => {
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(searchLower) ||
      c.last_name?.toLowerCase().includes(searchLower) ||
      c.company_name?.toLowerCase().includes(searchLower) ||
      c.phone.includes(customerSearchTerm) ||
      c.email?.toLowerCase().includes(searchLower)
    );
  });

  // Totals
  const subtotal = items.reduce((sum, item) => sum + (item.priceOverride || item.product.base_price) * item.quantity, 0);
  const tax = subtotal * 0.17;
  const total = subtotal + tax;

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.customer_type === 'business' ? customer.company_name || '' : `${customer.first_name} ${customer.last_name}`.trim());
    setShowCustomerDropdown(false);
  };

  // Handle create customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerFormData.first_name || !customerFormData.phone) {
      showToast('נא למלא שדות חובה (שם פרטי וטלפון)', 'error');
      return;
    }

    if (customerFormData.customer_type === 'business' && !customerFormData.company_name) {
      showToast('נא למלא שם חברה ללקוח עסקי', 'error');
      return;
    }

    try {
      const newCustomer = await customersService.create({
        customer_type: customerFormData.customer_type,
        company_name: customerFormData.company_name || undefined,
        first_name: customerFormData.first_name,
        last_name: customerFormData.last_name || undefined,
        phone: customerFormData.phone,
        email: customerFormData.email || undefined,
        address_city: customerFormData.address_city || undefined,
        is_active: true
      });

      // Reload customers
      await loadData();
      
      handleCustomerSelect(newCustomer);
      setIsCreateCustomerModalOpen(false);
      setCustomerFormData({
        customer_type: 'private',
        company_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address_city: ''
      });
      showToast('הלקוח נוצר ונבחר בהצלחה');
    } catch (error) {
      console.error('Error creating customer:', error);
      showToast('שגיאה ביצירת הלקוח', 'error');
    }
  };

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: UploadedFile[] = [];

    files.forEach(file => {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/postscript'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        showToast(`קובץ ${file.name} אינו בפורמט נתמך (PDF, AI, PNG, JPG)`, 'error');
        return;
      }

      if (file.size > maxSize) {
        showToast(`קובץ ${file.name} גדול מדי (מקסימום 10MB)`, 'error');
        return;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const uploadedFile: UploadedFile = { id: fileId, file };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(uploadedFile);
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.files = e.dataTransfer.files as FileList;
    const event = { target: input } as any;
    handleFileSelect(event);
  };

  const nextStep = () => {
    // Validation
    if (currentStep === 1 && !selectedCustomer) {
      showToast('נא לבחור לקוח', 'error');
      return;
    }
    if (currentStep === 2) {
      if (!orderDetails.eventName || !orderDetails.deadline) {
        showToast('נא למלא שם אירוע ותאריך יעד', 'error');
        return;
      }
      // Validate deadline is not in the past
      const deadlineDate = new Date(orderDetails.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        showToast('תאריך יעד לא יכול להיות בעבר', 'error');
        return;
      }
      // Validate shipping address if delivery
      if (orderDetails.shippingType === 'delivery' && !orderDetails.shippingAddress) {
        showToast('נא למלא כתובת משלוח', 'error');
        return;
      }
    }
    if (currentStep === 3 && items.length === 0) {
      showToast('נא להוסיף לפחות מוצר אחד', 'error');
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const addItem = () => {
    const defaultProduct = products[0];
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      product: defaultProduct,
      quantity: 100
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem | 'productId', value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          return product ? { ...item, product, priceOverride: undefined } : item;
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      showToast('נא לבחור לקוח', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('נא להוסיף לפחות מוצר אחד', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const orderItems = items.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.priceOverride || item.product.base_price,
        total: (item.priceOverride || item.product.base_price) * item.quantity
      }));

      await ordersService.create({
        order_number: orderNumber,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.customer_type === 'business' 
          ? selectedCustomer.company_name || '' 
          : `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim(),
        status: 'draft',
        production_type: orderDetails.productionType,
        event_name: orderDetails.eventName || undefined,
        event_date: orderDetails.eventDate || undefined,
        subtotal: subtotal,
        tax_amount: tax,
        total_amount: total,
        payment_status: 'pending',
        shipping_type: orderDetails.shippingType,
        deadline: orderDetails.deadline || undefined,
        local_production_status: orderDetails.productionType === 'local' ? 'queued' : undefined
      }, orderItems);

      showToast('ההזמנה נוצרה בהצלחה!');
      onCancel(); // Redirect back to orders list
    } catch (error) {
      console.error('Error creating order:', error);
      showToast('שגיאה ביצירת ההזמנה', 'error');
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
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <ArrowRight size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">הזמנה חדשה</h2>
          <p className="text-slate-500 text-sm">יצירת הזמנה חדשה במערכת</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between relative overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="absolute top-1/2 right-0 left-0 h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2 hidden sm:block"></div>
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`flex flex-col items-center gap-1 sm:gap-2 bg-slate-50 px-1 sm:px-2 shrink-0 ${currentStep >= step.id ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <div 
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${currentStep > step.id ? 'bg-blue-600 border-blue-600 text-white' : 
                    currentStep === step.id ? 'bg-white border-blue-600 text-blue-600' : 
                    'bg-white border-slate-300 text-slate-300'}`}
              >
                {currentStep > step.id ? <Check size={16} className="sm:w-5 sm:h-5" /> : <step.icon size={16} className="sm:w-5 sm:h-5" />}
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center max-w-[60px] sm:max-w-none leading-tight">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 overflow-y-auto">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">פרטי לקוח</h3>
            <div className="grid gap-4">
              <div className="relative">
                <label className="block mb-2">
                  <span className="text-sm font-medium text-slate-700">חפש לקוח קיים</span>
                </label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setShowCustomerDropdown(true);
                      if (!e.target.value) {
                        setSelectedCustomer(null);
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base touch-manipulation" 
                    placeholder="הקלד שם, טלפון או אימייל..." 
                  />
                </div>
                
                {showCustomerDropdown && customerSearchTerm && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full text-right px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">
                          {customer.customer_type === 'business' ? customer.company_name : `${customer.first_name} ${customer.last_name}`}
                        </div>
                        <div className="text-sm text-slate-500">{customer.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedCustomer && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedCustomer.customer_type === 'business' ? selectedCustomer.company_name : `${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                      </div>
                      <div className="text-sm text-blue-700">{selectedCustomer.phone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearchTerm('');
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-center text-slate-400 text-sm my-2">- או -</div>
              <button 
                type="button"
                onClick={() => setIsCreateCustomerModalOpen(true)}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                + צור לקוח חדש
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">פרטי הזמנה ואירוע</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">סוג ייצור</span>
                <select 
                  value={orderDetails.productionType}
                  onChange={(e) => setOrderDetails({...orderDetails, productionType: e.target.value as 'local' | 'import'})}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-base touch-manipulation"
                >
                  <option value="local">ייצור מקומי</option>
                  <option value="import">יבוא</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">שם האירוע</span>
                <input 
                  type="text" 
                  value={orderDetails.eventName}
                  onChange={(e) => setOrderDetails({...orderDetails, eventName: e.target.value})}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base touch-manipulation" 
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">תאריך האירוע</span>
                <input 
                  type="date" 
                  value={orderDetails.eventDate}
                  onChange={(e) => setOrderDetails({...orderDetails, eventDate: e.target.value})}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base touch-manipulation" 
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">תאריך יעד למסירה *</span>
                <input 
                  type="date" 
                  value={orderDetails.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setOrderDetails({...orderDetails, deadline: e.target.value})}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base touch-manipulation" 
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">סוג משלוח</span>
                <select 
                  value={orderDetails.shippingType}
                  onChange={(e) => setOrderDetails({...orderDetails, shippingType: e.target.value as ShippingType})}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-base touch-manipulation"
                >
                  <option value="pickup">איסוף עצמי</option>
                  <option value="delivery">משלוח</option>
                  <option value="express">משלוח מהיר</option>
                </select>
              </label>
              {orderDetails.shippingType === 'delivery' && (
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">כתובת משלוח *</span>
                  <input 
                    type="text" 
                    value={orderDetails.shippingAddress}
                    onChange={(e) => setOrderDetails({...orderDetails, shippingAddress: e.target.value})}
                    className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base touch-manipulation" 
                    placeholder="הזן כתובת משלוח מלאה"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">מוצרים</h3>
            
            {items.length === 0 ? (
              <div className="border border-slate-200 rounded-lg p-8 bg-slate-50 text-center text-slate-500">
                <Package className="mx-auto mb-2 opacity-50" size={32} />
                אין מוצרים בהזמנה עדיין
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-start sm:items-end p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-slate-500 mb-1 block">מוצר</label>
                      <select 
                        value={item.product.id}
                        onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm touch-manipulation"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="text-xs text-slate-500 mb-1 block">כמות</label>
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm touch-manipulation"
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="text-xs text-slate-500 mb-1 block">מחיר יח'</label>
                      <input 
                        type="number" 
                        value={item.priceOverride ?? item.product.base_price}
                        onChange={(e) => updateItem(item.id, 'priceOverride', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm touch-manipulation"
                      />
                    </div>
                    <div className="w-full sm:w-24 text-left pb-2 font-bold text-slate-700 flex items-center justify-between sm:block">
                      <span className="sm:hidden text-xs text-slate-500">סה"כ:</span>
                      <span>₪{((item.priceOverride ?? item.product.base_price) * item.quantity).toFixed(0)}</span>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-manipulation self-end sm:self-auto"
                      aria-label="מחק מוצר"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={addItem}
              className="text-blue-600 font-medium hover:underline text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              הוסף מוצר
            </button>
            
            <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
               <div className="flex justify-between text-sm">
                 <span>סה"כ ביניים:</span>
                 <span>₪{subtotal.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span>מע"מ (17%):</span>
                 <span>₪{tax.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-dashed border-slate-300 pt-2">
                 <span>סה"כ לתשלום:</span>
                 <span>₪{total.toLocaleString()}</span>
               </div>
            </div>
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">קבצי גרפיקה</h3>
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className="mb-2" />
              <p>גרור קבצים לכאן או לחץ להעלאה</p>
              <p className="text-xs mt-1">PDF, AI, PNG, JPG (מקסימום 10MB לכל קובץ)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.ai,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">קבצים שהועלו:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map(uploadedFile => (
                    <div key={uploadedFile.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {uploadedFile.preview ? (
                        <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                          <FileText size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{uploadedFile.file.name}</div>
                        <div className="text-xs text-slate-500">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(uploadedFile.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <label className="block">
              <span className="text-sm font-medium text-slate-700">הערות לגרפיקה</span>
              <textarea 
                value={graphicsNotes}
                onChange={(e) => setGraphicsNotes(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 text-base touch-manipulation" 
                placeholder="הוסף הערות לגרפיקה..."
              />
            </label>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">סיכום הזמנה</h3>
               <p className="text-slate-500">אנא וודא שהכל תקין לפני היצירה</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                 <div>
                   <span className="block text-slate-500 text-xs">מספר הזמנה</span>
                   <span className="font-bold text-blue-600">{orderNumber}</span>
                 </div>
                 <div>
                   <span className="block text-slate-500 text-xs">לקוח</span>
                   <span className="font-medium">
                     {selectedCustomer 
                       ? (selectedCustomer.customer_type === 'business' ? selectedCustomer.company_name : `${selectedCustomer.first_name} ${selectedCustomer.last_name}`)
                       : '-'}
                   </span>
                 </div>
                 <div>
                   <span className="block text-slate-500 text-xs">אירוע</span>
                   <span className="font-medium">{orderDetails.eventName || '-'} {orderDetails.eventDate ? `(${orderDetails.eventDate})` : ''}</span>
                 </div>
                 <div>
                   <span className="block text-slate-500 text-xs">סוג ייצור</span>
                   <span className="font-medium">{orderDetails.productionType === 'local' ? 'מקומי' : 'יבוא'}</span>
                 </div>
                 <div>
                   <span className="block text-slate-500 text-xs">דדליין</span>
                   <span className="font-medium text-red-600">{orderDetails.deadline || '-'}</span>
                 </div>
                 <div>
                   <span className="block text-slate-500 text-xs">סוג משלוח</span>
                   <span className="font-medium">
                     {orderDetails.shippingType === 'pickup' ? 'איסוף עצמי' : 
                      orderDetails.shippingType === 'delivery' ? 'משלוח' : 'משלוח מהיר'}
                   </span>
                 </div>
                 {orderDetails.shippingAddress && (
                   <div className="sm:col-span-2">
                     <span className="block text-slate-500 text-xs">כתובת משלוח</span>
                     <span className="font-medium">{orderDetails.shippingAddress}</span>
                   </div>
                 )}
               </div>
               
               <div className="border-t border-slate-200 pt-4">
                 <h4 className="text-sm font-bold mb-2">מוצרים</h4>
                 {items.map(item => (
                   <div key={item.id} className="flex justify-between text-sm mb-1">
                     <span>{item.product.name} x{item.quantity}</span>
                     <span>₪{((item.priceOverride ?? item.product.base_price) * item.quantity).toFixed(0)}</span>
                   </div>
                 ))}
                 <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t border-dashed border-slate-300">
                    <span>סה"כ כולל מע"מ:</span>
                    <span>₪{total.toLocaleString()}</span>
                 </div>
               </div>
               
               {uploadedFiles.length > 0 && (
                 <div className="border-t border-slate-200 pt-4">
                   <h4 className="text-sm font-bold mb-2">קבצי גרפיקה ({uploadedFiles.length})</h4>
                   <div className="text-xs text-slate-600 space-y-1">
                     {uploadedFiles.map(f => (
                       <div key={f.id}>{f.file.name}</div>
                     ))}
                   </div>
                 </div>
               )}
               
               {(graphicsNotes || orderDetails.notes) && (
                 <div className="border-t border-slate-200 pt-4">
                   {graphicsNotes && (
                     <div className="mb-2">
                       <h4 className="text-sm font-bold mb-1">הערות גרפיקה:</h4>
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{graphicsNotes}</p>
                     </div>
                   )}
                   {orderDetails.notes && (
                     <div>
                       <h4 className="text-sm font-bold mb-1">הערות כלליות:</h4>
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{orderDetails.notes}</p>
                     </div>
                   )}
                 </div>
               )}
               
               <div className="border-t border-slate-200 pt-4">
                 <label className="block">
                   <span className="text-sm font-medium text-slate-700 mb-2 block">הערות כלליות</span>
                   <textarea 
                     value={orderDetails.notes}
                     onChange={(e) => setOrderDetails({...orderDetails, notes: e.target.value})}
                     className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" 
                     placeholder="הוסף הערות כלליות להזמנה..."
                   />
                 </label>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 sticky bottom-0 bg-slate-50 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 sm:py-0 sm:relative border-t sm:border-t-0 border-slate-200 sm:border-slate-0">
        <button 
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation
            ${currentStep === 1 ? 'text-slate-300 cursor-not-allowed bg-slate-100' : 'text-slate-600 hover:bg-slate-200 active:bg-slate-300 bg-white'}`}
        >
          <ChevronRight size={20} />
          <span>הקודם</span>
        </button>

        {currentStep < steps.length ? (
          <button 
            onClick={nextStep}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-3 rounded-lg font-medium shadow-sm transition-colors touch-manipulation w-full sm:w-auto"
          >
            <span>הבא</span>
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-300 text-white px-4 sm:px-8 py-3 rounded-lg font-bold shadow-sm transition-colors touch-manipulation w-full sm:w-auto"
          >
            {isSubmitting ? 'מעבד...' : (
              <>
                <span>צור הזמנה</span>
                <Check size={20} />
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Create Customer Modal */}
      <Modal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        title="לקוח חדש"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${customerFormData.customer_type === 'private' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input 
                type="radio" 
                name="customer_type" 
                value="private" 
                checked={customerFormData.customer_type === 'private'}
                onChange={(e) => setCustomerFormData({...customerFormData, customer_type: e.target.value as CustomerType})}
                className="w-4 h-4 text-blue-600" 
              />
              <span className="text-sm font-medium">לקוח פרטי</span>
            </label>
            <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${customerFormData.customer_type === 'business' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input 
                type="radio" 
                name="customer_type" 
                value="business" 
                checked={customerFormData.customer_type === 'business'}
                onChange={(e) => setCustomerFormData({...customerFormData, customer_type: e.target.value as CustomerType})}
                className="w-4 h-4 text-blue-600" 
              />
              <span className="text-sm font-medium">לקוח עסקי</span>
            </label>
          </div>
          
          {customerFormData.customer_type === 'business' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם חברה *</label>
              <input 
                name="company_name" 
                value={customerFormData.company_name}
                onChange={(e) => setCustomerFormData({...customerFormData, company_name: e.target.value})}
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
                value={customerFormData.first_name}
                onChange={(e) => setCustomerFormData({...customerFormData, first_name: e.target.value})}
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם משפחה</label>
              <input 
                name="last_name" 
                value={customerFormData.last_name}
                onChange={(e) => setCustomerFormData({...customerFormData, last_name: e.target.value})}
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
                value={customerFormData.phone}
                onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                type="tel" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">אימייל</label>
              <input 
                name="email" 
                value={customerFormData.email}
                onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                type="email" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">עיר / כתובת</label>
            <input 
              name="address_city" 
              value={customerFormData.address_city}
              onChange={(e) => setCustomerFormData({...customerFormData, address_city: e.target.value})}
              type="text" 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreateCustomerModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">ביטול</button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              צור ובחר
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CreateOrder;
