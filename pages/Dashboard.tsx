
import React, { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, Users, Factory, Wallet, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../constants';
import { ordersService } from '../services/ordersService';
import { leadsService } from '../services/leadsService';
import { tasksService } from '../services/tasksService';
import { Order, Lead, Task } from '../types';

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, leadsData, tasksData] = await Promise.all([
        ordersService.getAll(),
        leadsService.getAll(),
        tasksService.getAll()
      ]);
      setOrders(ordersData);
      setLeads(leadsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Open orders (not completed/cancelled)
    const openOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
    
    // New leads (last 7 days)
    const newLeads = leads.filter(l => {
      const leadDate = new Date(l.created_at);
      return leadDate >= sevenDaysAgo;
    });
    
    // Orders in production
    const inProduction = orders.filter(o => o.status === 'in_production');
    
    // Monthly revenue (current month)
    const monthlyRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear &&
               ['paid', 'completed'].includes(o.payment_status);
      })
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    // Previous month revenue for comparison
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === prevMonth && 
               orderDate.getFullYear() === prevYear &&
               ['paid', 'completed'].includes(o.payment_status);
      })
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    const revenueGrowth = prevMonthRevenue > 0 
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(0)
      : '0';
    
    return {
      openOrders: openOrders.length,
      newLeads: newLeads.length,
      inProduction: inProduction.length,
      monthlyRevenue,
      revenueGrowth: parseFloat(revenueGrowth)
    };
  }, [orders, leads]);

  // Calculate monthly revenue data for chart
  const monthlyData = useMemo(() => {
    const months = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    return months.map((monthName, index) => {
      const revenue = orders
        .filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.getMonth() === index && 
                 orderDate.getFullYear() === currentYear &&
                 ['paid', 'completed'].includes(o.payment_status);
        })
        .reduce((sum, o) => sum + o.total_amount, 0);
      
      return { name: monthName, amount: revenue };
    }).slice(0, 6); // Last 6 months
  }, [orders]);

  // Orders by status for pie chart
  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS],
      value: count,
      color: ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS].split(' ')[0].replace('bg-', '')
    }));
  }, [orders]);

  // Alerts
  const alerts = useMemo(() => {
    const alertList: Array<{ type: 'deadline' | 'stock' | 'task'; message: string; link?: string }> = [];
    
    // Deadline alerts (orders with deadline in next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const urgentDeadlines = orders.filter(o => {
      if (!o.deadline) return false;
      const deadline = new Date(o.deadline);
      return deadline <= threeDaysFromNow && deadline >= new Date() && !['completed', 'cancelled'].includes(o.status);
    });
    urgentDeadlines.forEach(o => {
      alertList.push({
        type: 'deadline',
        message: `דדליין קרוב: הזמנה ${o.order_number}`,
        link: o.id
      });
    });
    
    // Urgent tasks
    const urgentTasks = tasks.filter(t => 
      t.priority === 'urgent' && t.status !== 'completed'
    );
    urgentTasks.forEach(t => {
      alertList.push({
        type: 'task',
        message: `משימה דחופה: ${t.title}`
      });
    });
    
    return alertList.slice(0, 5); // Show max 5 alerts
  }, [orders, tasks]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">דשבורד</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard 
          label="הזמנות פתוחות" 
          value={stats.openOrders.toString()} 
          icon={ShoppingCart} 
          color="blue"
          trend={stats.openOrders > 0 ? undefined : undefined}
        />
        <StatCard 
          label="לידים חדשים (7 ימים)" 
          value={stats.newLeads.toString()} 
          icon={Users} 
          color="orange"
        />
        <StatCard 
          label="בייצור כרגע" 
          value={stats.inProduction.toString()} 
          icon={Factory} 
          color="purple"
        />
        <StatCard 
          label="הכנסות החודש" 
          value={`₪${stats.monthlyRevenue.toLocaleString()}`} 
          icon={Wallet} 
          trend={`${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`}
          trendUp={stats.revenueGrowth > 0}
          color="green"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
            <h3 className="font-bold text-yellow-900 dark:text-yellow-200">התראות</h3>
            <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full text-xs font-medium">
              {alerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400"></div>
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4">הכנסות לפי חודש</h3>
          <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={monthlyData} layout="horizontal">
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

        {/* Orders by Status Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4">הזמנות לפי סטטוס</h3>
          <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">הזמנות אחרונות</h3>
            <button className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1 touch-manipulation">
              <span className="hidden sm:inline">לכל ההזמנות</span>
              <span className="sm:hidden">הכל</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {orders.slice(0, 4).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm sm:text-base">{order.customer_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">#{order.order_number}</div>
                </div>
                <div className="text-left shrink-0">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <div className="text-xs sm:text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">₪{order.total_amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
