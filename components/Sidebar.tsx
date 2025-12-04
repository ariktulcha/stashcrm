
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  ShoppingCart, 
  Package, 
  Factory, 
  Truck, 
  Warehouse, 
  Wallet, 
  CheckSquare, 
  Settings,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { id: 'customers', label: 'לקוחות', icon: Users },
    { id: 'leads', label: 'לידים', icon: Target },
    { id: 'orders', label: 'הזמנות', icon: ShoppingCart },
    { id: 'products', label: 'מוצרים', icon: Package },
    { id: 'production', label: 'ייצור', icon: Factory },
    { id: 'suppliers', label: 'ספקים', icon: Truck },
    { id: 'inventory', label: 'מלאי', icon: Warehouse },
    { id: 'finances', label: 'כספים', icon: Wallet },
    { id: 'tasks', label: 'משימות', icon: CheckSquare },
    { id: 'settings', label: 'הגדרות', icon: Settings },
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 text-white h-full flex flex-col shadow-xl transition-transform duration-300 ease-in-out transform 
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-800 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-accent">STASH</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">מערכת ניהול עסק</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-colors duration-200
                    ${currentPage === item.id 
                      ? 'bg-blue-600 dark:bg-blue-700 text-white border-r-4 border-white' 
                      : 'text-slate-300 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white dark:hover:text-slate-100'
                    }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 dark:border-slate-800">
          <button className="flex items-center gap-3 px-4 py-2 text-slate-400 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-400 w-full transition-colors">
            <LogOut size={18} />
            <span>התנתק</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
