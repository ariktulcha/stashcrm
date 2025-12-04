
import { 
  OrderStatus, 
  LeadStatus, 
  LeadSource, 
  PaymentStatus, 
  ProductionType, 
  ShippingType,
  CustomerType,
  LocalProductionStatus,
  ImportStatus
} from './types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'טיוטה',
  pending_approval: 'ממתין לאישור',
  approved: 'אושר',
  pending_payment: 'ממתין לתשלום',
  paid: 'שולם',
  in_production: 'בייצור',
  ready: 'מוכן',
  shipped: 'נשלח',
  delivered: 'נמסר',
  completed: 'הושלם',
  cancelled: 'בוטל'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  pending_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  in_production: 'bg-purple-100 text-purple-800',
  ready: 'bg-teal-100 text-teal-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800'
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  in_negotiation: 'במשא ומתן',
  quoted: 'נשלחה הצעה',
  converted: 'הפך ללקוח',
  lost: 'אבד'
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'אתר',
  instagram: 'אינסטגרם',
  facebook: 'פייסבוק',
  referral: 'הפניה',
  returning: 'לקוח חוזר',
  phone: 'טלפון',
  whatsapp: 'וואטסאפ',
  other: 'אחר'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'ממתין',
  partial: 'חלקי',
  paid: 'שולם',
  refunded: 'הוחזר'
};

export const PRODUCTION_TYPE_LABELS: Record<ProductionType, string> = {
  local: 'ייצור עצמי',
  import: 'יבוא'
};

export const SHIPPING_TYPE_LABELS: Record<ShippingType, string> = {
  pickup: 'איסוף עצמי',
  delivery: 'משלוח',
  express: 'משלוח מהיר'
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  private: 'פרטי',
  business: 'עסקי'
};

export const LOCAL_PRODUCTION_STATUS_LABELS: Record<LocalProductionStatus, string> = {
  queued: 'בתור להדפסה',
  printing: 'בהדפסה',
  quality_check: 'בבדיקת איכות',
  ready_pack: 'מוכן לאריזה',
  packed: 'ארוז',
  ready_ship: 'מוכן למשלוח'
};

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  quote_requested: 'בקשת הצעת מחיר',
  quote_received: 'התקבלה הצעת מחיר',
  order_placed: 'הזמנה נשלחה לספק',
  graphics_sent: 'גרפיקה נשלחה',
  graphics_approved: 'גרפיקה אושרה',
  payment_sent: 'תשלום נשלח',
  in_production: 'בייצור',
  samples_received: 'דוגמיות התקבלו',
  samples_approved: 'דוגמיות אושרו',
  shipped: 'נשלח מהספק',
  in_transit: 'בדרך',
  customs: 'במכס',
  customs_released: 'שוחרר מהמכס',
  received: 'הגיע למחסן',
  quality_check: 'בבדיקת איכות',
  repackaging: 'באריזה מחדש',
  ready_ship: 'מוכן למשלוח'
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: 'שכירות',
  utilities: 'חשמל/מים',
  salaries: 'משכורות',
  marketing: 'שיווק',
  equipment: 'ציוד',
  supplies: 'חומרים',
  shipping: 'משלוחים',
  customs: 'מכס',
  other: 'אחר'
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחוף'
};

export const STOCK_TYPE_LABELS: Record<string, string> = {
  raw_material: 'חומר גלם',
  packaging: 'אריזה',
  consumable: 'מתכלה'
};
