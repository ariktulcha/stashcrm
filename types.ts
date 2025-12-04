
// Lead Types
export type LeadStatus = 'new' | 'contacted' | 'in_negotiation' | 'quoted' | 'converted' | 'lost';
export type LeadSource = 'website' | 'instagram' | 'facebook' | 'referral' | 'returning' | 'phone' | 'whatsapp' | 'other';

// Customer Types
export type CustomerType = 'private' | 'business';

// Order Types
export type OrderStatus = 'draft' | 'pending_approval' | 'approved' | 'pending_payment' | 'paid' | 'in_production' | 'ready' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type ProductionType = 'local' | 'import';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'bit' | 'paypal';
export type ShippingType = 'pickup' | 'delivery' | 'express';

// Production Types
export type LocalProductionStatus = 'queued' | 'printing' | 'quality_check' | 'ready_pack' | 'packed' | 'ready_ship';
export type ImportStatus = 'quote_requested' | 'quote_received' | 'order_placed' | 'graphics_sent' | 'graphics_approved' | 'payment_sent' | 'in_production' | 'samples_received' | 'samples_approved' | 'shipped' | 'in_transit' | 'customs' | 'customs_released' | 'received' | 'quality_check' | 'repackaging' | 'ready_ship';

// Interfaces
export interface Customer {
  id: string;
  customer_type: CustomerType;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone: string;
  address_city?: string;
  address_street?: string;
  tax_id?: string;
  orders_count: number;
  total_purchases: number;
  is_active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  contact_name: string;
  company_name?: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  event_type?: string;
  event_date?: string;
  estimated_quantity?: number;
  notes?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  status: OrderStatus;
  production_type: ProductionType;
  event_name?: string;
  event_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  shipping_type: ShippingType;
  deadline?: string;
  created_at: string;
  items?: OrderItem[];
  // For Local Production view
  local_production_status?: LocalProductionStatus;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  production_type: ProductionType;
  base_price: number;
  base_cost: number;
  current_stock: number;
  min_stock_alert: number;
  image_url?: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  contact_name: string;
  email: string;
  phone: string;
  lead_time_days: number;
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  type: 'raw_material' | 'packaging' | 'consumable';
  current_quantity: number;
  min_quantity: number;
  unit: string;
  unit_cost: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier_name?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  related_order?: string;
}

export interface ImportOrder {
  id: string;
  supplier_name: string;
  status: ImportStatus;
  order_numbers: string[];
  total_cost: number;
  estimated_arrival: string;
  tracking_number?: string;
}