
import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Edit, Mail, Phone, MapPin, ShoppingCart, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Customer, Order } from '../types';
import { CUSTOMER_TYPE_LABELS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { customersService } from '../services/customersService';
import { ordersService } from '../services/ordersService';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
  onEdit?: (customerId: string) => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId, onBack, onEdit }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [customerData, ordersData] = await Promise.all([
        customersService.getById(customerId),
        ordersService.getAll()
      ]);
      setCustomer(customerData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading customer detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">לקוח לא נמצא</h2>
          <button onClick={onBack} className="text-blue-600 hover:underline">חזור לרשימת לקוחות</button>
        </div>
      </div>
    );
  }

  // Get customer orders
  const customerOrders = orders.filter(o => o.customer_id === customerId);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOrders = customerOrders.length;
    const totalPurchases = customerOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalPurchases / totalOrders : 0;
    const lastOrderDate = customerOrders.length > 0 
      ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    return {
      totalOrders,
      totalPurchases,
      averageOrderValue,
      lastOrderDate
    };
  }, [customerOrders]);

  // Prepare chart data (purchases by month)
  const chartData = useMemo(() => {
    const months = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    return months.map((monthName, index) => {
      const revenue = customerOrders
        .filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.getMonth() === index && 
                 orderDate.getFullYear() === currentYear &&
                 ['paid', 'completed'].includes(o.payment_status);
        })
        .reduce((sum, o) => sum + o.total_amount, 0);
      
      return { name: monthName, amount: revenue };
    }).slice(0, 6); // Last 6 months
  }, [customerOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowRight size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {customer.customer_type === 'business' ? customer.company_name : `${customer.first_name} ${customer.last_name}`}
            </h2>
            <p className="text-slate-500 text-sm">
              {CUSTOMER_TYPE_LABELS[customer.customer_type]} • נוצר ב-{new Date(customer.created_at).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>
        {onEdit && (
          <button 
            onClick={() => onEdit(customer.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Edit size={18} />
            ערוך
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs sm:text-sm text-slate-500 mb-1">סה"כ הזמנות</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalOrders}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs sm:text-sm text-slate-500 mb-1">סה"כ רכישות</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">₪{stats.totalPurchases.toLocaleString()}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs sm:text-sm text-slate-500 mb-1">ממוצע להזמנה</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">₪{stats.averageOrderValue.toFixed(0)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs sm:text-sm text-slate-500 mb-1">הזמנה אחרונה</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">
            {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">פרטי קשר</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={18} className="text-slate-400" />
                <span dir="ltr">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={18} className="text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address_city && (
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={18} className="text-slate-400" />
                  <span>{customer.address_city}</span>
                </div>
              )}
            </div>
          </div>

          {customer.customer_type === 'business' && customer.company_name && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">פרטי חברה</h3>
              <div className="space-y-2 text-slate-600">
                <div>
                  <span className="text-sm text-slate-500">שם חברה:</span>
                  <div className="font-medium">{customer.company_name}</div>
                </div>
                {customer.first_name && (
                  <div>
                    <span className="text-sm text-slate-500">איש קשר:</span>
                    <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Orders List & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">רכישות לפי חודש</h3>
            <div className="h-64 min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <BarChart data={chartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => `₪${value.toLocaleString()}`}
                  />
                  <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">הזמנות ({customerOrders.length})</h3>
            </div>
            <div className="overflow-y-auto max-h-96 custom-scrollbar">
              {customerOrders.length > 0 ? (
                <>
                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-3 p-4">
                    {customerOrders
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(order => (
                        <div 
                          key={order.id} 
                          onClick={() => window.location.hash = `/order-detail/${order.id}`}
                          className="bg-slate-50 p-3 rounded-lg border border-slate-200 active:bg-slate-100 transition-colors touch-manipulation"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-blue-600">#{order.order_number}</div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_production' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div className="text-slate-600">{new Date(order.created_at).toLocaleDateString('he-IL')}</div>
                            <div className="font-bold text-slate-900">₪{order.total_amount.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {/* Desktop Table View */}
                  <table className="hidden lg:table w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                      <tr>
                        <th className="px-6 py-3">מס' הזמנה</th>
                        <th className="px-6 py-3">תאריך</th>
                        <th className="px-6 py-3">סטטוס</th>
                        <th className="px-6 py-3">סכום</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerOrders
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(order => (
                          <tr key={order.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.location.hash = `/order-detail/${order.id}`}>
                            <td className="px-6 py-4 font-medium text-blue-600">#{order.order_number}</td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                              {new Date(order.created_at).toLocaleDateString('he-IL')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'in_production' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium">₪{order.total_amount.toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="mx-auto mb-2 opacity-50" size={32} />
                  <p>אין הזמנות ללקוח זה</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;

