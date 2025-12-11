
import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Edit, Trash2, Loader2, Download, FileText, Calendar, Filter } from 'lucide-react';
import { EXPENSE_CATEGORY_LABELS } from '../constants';
import StatCard from '../components/StatCard';
import { Expense, Order } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { expensesService } from '../services/expensesService';
import { ordersService } from '../services/ordersService';

const Finances: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expensesData, ordersData] = await Promise.all([
        expensesService.getAll(),
        ordersService.getAll()
      ]);
      setExpenses(expensesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading finances data:', error);
      showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    category: 'other',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    supplier_name: ''
  });

  // Filter expenses and orders by date
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (dateFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (dateFilter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = customDateFrom ? new Date(customDateFrom) : new Date(now.getFullYear(), 0, 1);
      endDate = customDateTo ? new Date(customDateTo) : new Date(now);
    }

    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= startDate && orderDate <= endDate && ['paid', 'completed'].includes(o.payment_status);
    });

    return { filteredExpenses, filteredOrders, startDate, endDate };
  }, [expenses, dateFilter, customDateFrom, customDateTo]);

  // Calculate statistics
  const stats = useMemo(() => {
    const { filteredExpenses, filteredOrders } = filteredData;
    
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit
    };
  }, [filteredData]);

  // Chart data - Revenue vs Expenses by month
  const revenueExpensesChartData = useMemo(() => {
    const { filteredOrders, filteredExpenses, startDate, endDate } = filteredData;
    const months: { name: string; revenue: number; expenses: number }[] = [];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthName = current.toLocaleDateString('he-IL', { month: 'short' });
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      const monthRevenue = filteredOrders
        .filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        })
        .reduce((sum, o) => sum + o.total_amount, 0);
      
      const monthExpenses = filteredExpenses
        .filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      months.push({ name: monthName, revenue: monthRevenue, expenses: monthExpenses });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, [filteredData]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const { filteredExpenses } = filteredData;
    const breakdown: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    });
    
    return Object.entries(breakdown).map(([category, amount]) => ({
      name: EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS] || category,
      value: amount
    }));
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      showToast('נא למלא שדות חובה', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await expensesService.update(editingExpense.id, {
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
          supplier_name: formData.supplier_name || undefined
        });
        showToast('ההוצאה עודכנה בהצלחה');
        setIsEditModalOpen(false);
      } else {
        await expensesService.create({
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
          supplier_name: formData.supplier_name || undefined
        });
        showToast('ההוצאה נוספה בהצלחה');
        setIsAddModalOpen(false);
      }
      
      // Reload data
      await loadData();
      
      setEditingExpense(null);
      setFormData({
        category: 'other',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        supplier_name: ''
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('שגיאה בשמירת ההוצאה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      supplier_name: expense.supplier_name || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setDeletingExpense(expense);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      await expensesService.delete(deletingExpense.id);
      showToast('ההוצאה נמחקה בהצלחה');
      setIsDeleteModalOpen(false);
      setDeletingExpense(null);
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('שגיאה במחיקת ההוצאה', 'error');
    }
  };

  const handleExportExcel = () => {
    const { filteredExpenses, filteredOrders } = filteredData;
    
    const csv = [
      ['תאריך', 'סוג', 'תיאור', 'סכום'].join(','),
      ...filteredExpenses.map(e => [
        e.date,
        EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] || e.category,
        e.description,
        e.amount.toString()
      ].join(',')),
      [''],
      ['סה"כ הוצאות', '', '', filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toString()],
      [''],
      ['תאריך הזמנה', 'מספר הזמנה', 'לקוח', 'סכום'],
      ...filteredOrders.map(o => [
        o.created_at.split('T')[0],
        o.order_number,
        o.customer_name,
        o.total_amount.toString()
      ].join(',')),
      [''],
      ['סה"כ הכנסות', '', '', filteredOrders.reduce((sum, o) => sum + o.total_amount, 0).toString()],
      [''],
      ['רווח נקי', '', '', stats.netProfit.toString()]
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finances_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('הדוח יוצא בהצלחה');
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export - would need a library like jsPDF
    showToast('ייצוא PDF יוזמן בקרוב', 'info');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">כספים</h2>
          <p className="text-slate-500 text-sm">מעקב הכנסות והוצאות</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">ייצא Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">ייצא PDF</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>הוצאה חדשה</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">סינון לפי:</span>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="month">חודש נוכחי</option>
          <option value="quarter">רבעון נוכחי</option>
          <option value="year">שנה נוכחית</option>
          <option value="custom">מותאם אישית</option>
        </select>
        {dateFilter === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              placeholder="מ-תאריך"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              placeholder="עד תאריך"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="הכנסות" value={`₪${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="green" />
        <StatCard label="הוצאות" value={`₪${stats.totalExpenses.toLocaleString()}`} icon={TrendingDown} color="red" />
        <StatCard label="רווח נקי" value={`₪${stats.netProfit.toLocaleString()}`} icon={Wallet} color={stats.netProfit >= 0 ? 'blue' : 'red'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">הכנסות vs הוצאות</h3>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={revenueExpensesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `₪${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="הכנסות" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="הוצאות" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">הוצאות לפי קטגוריה</h3>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₪${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">הוצאות</div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">תאריך</th>
                <th className="px-6 py-4">קטגוריה</th>
                <th className="px-6 py-4">תיאור</th>
                <th className="px-6 py-4">ספק</th>
                <th className="px-6 py-4">סכום</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.filteredExpenses.length > 0 ? (
                filteredData.filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 text-slate-600">{new Date(expense.date).toLocaleDateString('he-IL')}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                        {EXPENSE_CATEGORY_LABELS[expense.category as keyof typeof EXPENSE_CATEGORY_LABELS] || expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{expense.description}</td>
                    <td className="px-6 py-4 text-slate-600">{expense.supplier_name || '-'}</td>
                    <td className="px-6 py-4 font-medium text-red-600">-₪{expense.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditExpense(expense)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="ערוך"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="מחק"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    אין הוצאות בתקופה שנבחרה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingExpense(null);
          setFormData({
            category: 'other',
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            supplier_name: ''
          });
        }}
        title={editingExpense ? 'ערוך הוצאה' : 'הוצאה חדשה'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">קטגוריה *</label>
            <select
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">תיאור *</label>
            <input
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">סכום (₪) *</label>
              <input
                name="amount"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">תאריך *</label>
              <input
                name="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">ספק (אופציונלי)</label>
            <input
              name="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingExpense(null);
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
              {editingExpense ? 'שמור שינויים' : 'שמור הוצאה'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingExpense(null);
        }}
        title="מחיקת הוצאה"
      >
        <div className="space-y-4">
          {deletingExpense && (
            <>
              <p className="text-slate-700">
                האם אתה בטוח שברצונך למחוק את ההוצאה <strong>{deletingExpense.description}</strong>?
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingExpense(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmDeleteExpense}
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

export default Finances;
