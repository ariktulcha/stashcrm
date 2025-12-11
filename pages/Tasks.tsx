
import React, { useState, useMemo, useEffect } from 'react';
import { CheckSquare, Calendar, AlertCircle, Plus, Loader2, Edit, Trash2, Filter } from 'lucide-react';
import { TASK_PRIORITY_LABELS } from '../constants';
import { Task } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { tasksService } from '../services/tasksService';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tasks from Supabase
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await tasksService.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('שגיאה בטעינת המשימות', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    title: '',
    status: 'todo' as 'todo' | 'in_progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: new Date().toISOString().split('T')[0],
    related_order: ''
  });
  
  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // Sort by priority (urgent first) then by due date
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [tasks, statusFilter, priorityFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      showToast('נא להזין כותרת למשימה', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask) {
        // Update existing task
        await tasksService.update(editingTask.id, {
          title: formData.title,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date,
          related_order: formData.related_order || undefined
        });
        showToast('המשימה עודכנה בהצלחה');
        setIsEditModalOpen(false);
      } else {
        // Create new task
        await tasksService.create({
          title: formData.title,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date,
          related_order: formData.related_order || undefined
        });
        showToast('המשימה נוצרה בהצלחה');
        setIsAddModalOpen(false);
      }
      
      // Reload tasks
      await loadTasks();
      
      setEditingTask(null);
      setFormData({
        title: '',
        status: 'todo',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        related_order: ''
      });
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('שגיאה בשמירת המשימה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      related_order: task.related_order || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      await tasksService.delete(deletingTask.id);
      showToast('המשימה נמחקה בהצלחה');
      setIsDeleteModalOpen(false);
      setDeletingTask(null);
      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('שגיאה במחיקת המשימה', 'error');
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      await tasksService.update(taskId, {
        status: task.status === 'completed' ? 'todo' : 'completed'
      });
      
      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
      showToast('שגיאה בעדכון סטטוס המשימה', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">משימות</h2>
          <p className="text-slate-500 text-sm">ניהול משימות שוטף</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>משימה חדשה</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="todo">לעשות</option>
            <option value="in_progress">בתהליך</option>
            <option value="completed">הושלם</option>
          </select>
        </div>
        <div className="relative flex-1">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
          >
            <option value="all">כל הדחיפויות</option>
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="urgent">דחוף</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center text-slate-400 py-10">אין משימות להציג</div>
          ) : (
            filteredTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4 flex-1">
               <button 
                 onClick={() => toggleTaskStatus(task.id)}
                 className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
               >
                 {task.status === 'completed' && <CheckSquare size={14} />}
               </button>
               <div className="flex-1">
                 <h3 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                   {task.title}
                 </h3>
                 <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                   {task.related_order && (
                     <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                       הזמנה #{task.related_order}
                     </span>
                   )}
                   <span className="flex items-center gap-1">
                     <Calendar size={12} />
                     {new Date(task.due_date).toLocaleDateString('he-IL')}
                   </span>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 
                  'bg-slate-100 text-slate-600'}`}>
                {task.priority === 'urgent' && <AlertCircle size={12} />}
                {TASK_PRIORITY_LABELS[task.priority]}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditTask(task)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="ערוך"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteTask(task)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="מחק"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )))}
        </div>
      )}

      {/* Add/Edit Task Modal */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingTask(null);
          setFormData({
            title: '',
            status: 'todo',
            priority: 'medium',
            due_date: new Date().toISOString().split('T')[0],
            related_order: ''
          });
        }} 
        title={editingTask ? 'ערוך משימה' : 'משימה חדשה'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">כותרת המשימה *</label>
             <input 
               name="title"
               value={formData.title}
               onChange={handleInputChange}
               type="text" 
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">סטטוס</label>
               <select 
                 name="status"
                 value={formData.status}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
               >
                 <option value="todo">לעשות</option>
                 <option value="in_progress">בתהליך</option>
                 <option value="completed">הושלם</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">תאריך יעד</label>
               <input 
                 name="due_date"
                 value={formData.due_date}
                 onChange={handleInputChange}
                 type="date" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">דחיפות</label>
             <select 
               name="priority"
               value={formData.priority}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             >
               <option value="low">נמוכה</option>
               <option value="medium">בינונית</option>
               <option value="high">גבוהה</option>
               <option value="urgent">דחוף</option>
             </select>
           </div>

           <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">קשור להזמנה (אופציונלי)</label>
             <input 
               name="related_order"
               value={formData.related_order}
               onChange={handleInputChange}
               type="text" 
               placeholder="מס' הזמנה" 
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
             />
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">ביטול</button>
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
             >
               {isSubmitting && <Loader2 size={16} className="animate-spin" />}
               {editingTask ? 'שמור שינויים' : 'צור משימה'}
             </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTask(null);
        }}
        title="מחיקת משימה"
      >
        <div className="space-y-4">
          {deletingTask && (
            <>
              <p className="text-slate-700">
                האם אתה בטוח שברצונך למחוק את המשימה <strong>{deletingTask.title}</strong>?
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingTask(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ביטול
                </button>
                <button 
                  onClick={confirmDeleteTask}
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

export default Tasks;
