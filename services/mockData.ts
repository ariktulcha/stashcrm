
import { Customer, Lead, Order, Product, Supplier, StockItem, Expense, Task, ImportOrder } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    customer_type: 'business',
    company_name: 'אירועי השרון בע"מ',
    first_name: 'יוסי',
    last_name: 'כהן',
    phone: '050-1234567',
    email: 'yossi@sharon-events.co.il',
    address_city: 'רעננה',
    orders_count: 5,
    total_purchases: 12500,
    is_active: true,
    created_at: '2024-01-15'
  },
  {
    id: '2',
    customer_type: 'private',
    first_name: 'מיכל',
    last_name: 'לוי',
    phone: '052-9876543',
    email: 'michal.levi@gmail.com',
    address_city: 'תל אביב',
    orders_count: 1,
    total_purchases: 450,
    is_active: true,
    created_at: '2024-02-10'
  },
  {
    id: '3',
    customer_type: 'business',
    company_name: 'מועדון הבלוק',
    first_name: 'דני',
    phone: '054-5555555',
    address_city: 'תל אביב',
    orders_count: 12,
    total_purchases: 45000,
    is_active: true,
    created_at: '2023-11-01'
  }
];

export const mockLeads: Lead[] = [
  {
    id: '101',
    contact_name: 'רון שחר',
    company_name: 'פסטיבל הבירה',
    phone: '050-9999999',
    source: 'instagram',
    status: 'new',
    event_type: 'פסטיבל',
    event_date: '2024-06-15',
    estimated_quantity: 2000,
    created_at: '2024-03-01'
  },
  {
    id: '102',
    contact_name: 'שרה נתניהו',
    phone: '052-2222222',
    source: 'website',
    status: 'contacted',
    event_type: 'יום הולדת',
    estimated_quantity: 50,
    created_at: '2024-03-02'
  },
  {
    id: '103',
    contact_name: 'משה זוכמיר',
    company_name: 'כנסים בע"מ',
    phone: '053-3333333',
    source: 'referral',
    status: 'quoted',
    event_type: 'כנס מקצועי',
    estimated_quantity: 500,
    created_at: '2024-02-28'
  },
  {
    id: '104',
    contact_name: 'אבי כהן',
    phone: '054-4444444',
    source: 'facebook',
    status: 'in_negotiation',
    created_at: '2024-03-03'
  }
];

export const mockOrders: Order[] = [
  {
    id: '201',
    order_number: '24-00150',
    customer_id: '1',
    customer_name: 'אירועי השרון בע"מ',
    status: 'in_production',
    production_type: 'local',
    local_production_status: 'printing',
    event_name: 'חתונה דני וגלית',
    event_date: '2024-04-01',
    subtotal: 2500,
    tax_amount: 425,
    total_amount: 2925,
    payment_status: 'paid',
    shipping_type: 'delivery',
    deadline: '2024-03-28',
    created_at: '2024-03-01',
    items: [
      { id: 'i1', product_name: 'צמיד סיליקון', quantity: 500, unit_price: 5, total: 2500 }
    ]
  },
  {
    id: '202',
    order_number: '24-00151',
    customer_id: '2',
    customer_name: 'מיכל לוי',
    status: 'pending_approval',
    production_type: 'import',
    event_name: 'בת מצווה נועה',
    event_date: '2024-05-15',
    subtotal: 450,
    tax_amount: 76,
    total_amount: 526,
    payment_status: 'pending',
    shipping_type: 'pickup',
    deadline: '2024-05-10',
    created_at: '2024-03-02',
    items: [
      { id: 'i2', product_name: 'צמיד בד', quantity: 100, unit_price: 4.5, total: 450 }
    ]
  },
  {
    id: '203',
    order_number: '24-00152',
    customer_id: '3',
    customer_name: 'מועדון הבלוק',
    status: 'draft',
    production_type: 'local',
    subtotal: 1200,
    tax_amount: 204,
    total_amount: 1404,
    payment_status: 'pending',
    shipping_type: 'express',
    created_at: '2024-03-03',
    local_production_status: 'queued',
    items: [
      { id: 'i3', product_name: 'צמיד טייבק', quantity: 2000, unit_price: 0.6, total: 1200 }
    ]
  },
  {
    id: '204',
    order_number: '24-00153',
    customer_id: '1',
    customer_name: 'אירועי השרון בע"מ',
    status: 'ready',
    production_type: 'local',
    local_production_status: 'packed',
    event_name: 'כנס הייטק',
    event_date: '2024-03-20',
    subtotal: 5000,
    tax_amount: 850,
    total_amount: 5850,
    payment_status: 'paid',
    shipping_type: 'express',
    created_at: '2024-02-25',
    items: [
      { id: 'i4', product_name: 'שרוך לצוואר', quantity: 1000, unit_price: 5, total: 5000 }
    ]
  }
];

export const mockProducts: Product[] = [
  {
    id: 'P1',
    sku: 'WB-SIL-01',
    name: 'צמיד סיליקון 12 מ"מ',
    production_type: 'import',
    base_price: 2.5,
    base_cost: 0.8,
    current_stock: 5000,
    min_stock_alert: 1000
  },
  {
    id: 'P2',
    sku: 'WB-TYV-01',
    name: 'צמיד טייבק (נייר)',
    production_type: 'local',
    base_price: 0.5,
    base_cost: 0.1,
    current_stock: 15000,
    min_stock_alert: 5000
  },
  {
    id: 'P3',
    sku: 'WB-FAB-01',
    name: 'צמיד בד ארוג',
    production_type: 'import',
    base_price: 3.5,
    base_cost: 1.2,
    current_stock: 200,
    min_stock_alert: 500
  },
  {
    id: 'P4',
    sku: 'LN-POLY-20',
    name: 'שרוך פוליאסטר 20 מ"מ',
    production_type: 'local',
    base_price: 4.0,
    base_cost: 1.5,
    current_stock: 800,
    min_stock_alert: 200
  }
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'S1',
    name: 'Alibaba Wristband Factory',
    country: 'סין',
    contact_name: 'Jack Chen',
    email: 'sales@alibaba-wb.com',
    phone: '+86-13900000000',
    lead_time_days: 21
  },
  {
    id: 'S2',
    name: 'דפוס ישראלי בע"מ',
    country: 'ישראל',
    contact_name: 'משה דפוס',
    email: 'moshe@print.co.il',
    phone: '03-9999999',
    lead_time_days: 3
  }
];

export const mockStockItems: StockItem[] = [
  {
    id: 'ST1',
    sku: 'RAW-SIL-BLK',
    name: 'גליל סיליקון שחור',
    type: 'raw_material',
    current_quantity: 50,
    min_quantity: 10,
    unit: 'kg',
    unit_cost: 120
  },
  {
    id: 'ST2',
    sku: 'INK-WHT',
    name: 'דיו לבן להדפסה',
    type: 'consumable',
    current_quantity: 3,
    min_quantity: 5,
    unit: 'units',
    unit_cost: 250
  },
  {
    id: 'ST3',
    sku: 'PKG-BOX-S',
    name: 'קרטון אריזה קטן',
    type: 'packaging',
    current_quantity: 500,
    min_quantity: 100,
    unit: 'units',
    unit_cost: 2.5
  }
];

export const mockExpenses: Expense[] = [
  {
    id: 'E1',
    category: 'rent',
    description: 'שכירות מרץ',
    amount: 4500,
    date: '2024-03-01',
    supplier_name: 'בעל הבית'
  },
  {
    id: 'E2',
    category: 'supplies',
    description: 'רכישת דיו',
    amount: 750,
    date: '2024-03-05',
    supplier_name: 'עולם הדיו'
  },
  {
    id: 'E3',
    category: 'marketing',
    description: 'קידום פייסבוק',
    amount: 1200,
    date: '2024-03-02',
    supplier_name: 'Facebook'
  }
];

export const mockTasks: Task[] = [
  {
    id: 'T1',
    title: 'לאשר גרפיקה להזמנה 24-00151',
    status: 'todo',
    priority: 'high',
    due_date: '2024-03-10',
    related_order: '24-00151'
  },
  {
    id: 'T2',
    title: 'להזמין מלאי דיו',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2024-03-12'
  },
  {
    id: 'T3',
    title: 'לשלוח הצעת מחיר לכנס הייטק',
    status: 'completed',
    priority: 'urgent',
    due_date: '2024-03-01'
  }
];

export const mockImportOrders: ImportOrder[] = [
  {
    id: 'IMP-001',
    supplier_name: 'Alibaba Wristband Factory',
    status: 'in_transit',
    order_numbers: ['24-00140', '24-00142'],
    total_cost: 3500,
    estimated_arrival: '2024-03-25',
    tracking_number: 'DHL123456789'
  },
  {
    id: 'IMP-002',
    supplier_name: 'Guangzhou Gifts',
    status: 'production',
    order_numbers: ['24-00151'],
    total_cost: 1200,
    estimated_arrival: '2024-04-10'
  }
] as unknown as ImportOrder[]; // Type assertion for slight mismatch in mock implementation simplicity
