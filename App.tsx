
import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, Search } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';
import EditOrder from './pages/EditOrder';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Products from './pages/Products';
import ProductionLocal from './pages/ProductionLocal';
import ProductionImport from './pages/ProductionImport';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import Finances from './pages/Finances';
import Tasks from './pages/Tasks';
import PlaceholderPage from './pages/PlaceholderPage';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import CommandPalette from './components/CommandPalette';
import NotificationsCenter, { Notification } from './components/NotificationsCenter';
import FloatingActionButton from './components/FloatingActionButton';
import Breadcrumbs from './components/Breadcrumbs';

type ViewState = 
  | { name: 'dashboard' }
  | { name: 'orders' }
  | { name: 'create-order' }
  | { name: 'order-detail', id: string }
  | { name: 'edit-order', id: string }
  | { name: 'leads' }
  | { name: 'customers' }
  | { name: 'customer-detail', id: string }
  | { name: 'products' }
  | { name: 'production' }
  | { name: 'suppliers' }
  | { name: 'inventory' }
  | { name: 'finances' }
  | { name: 'tasks' }
  | { name: 'settings' };

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>({ name: 'dashboard' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'ברוכים הבאים!',
      message: 'המערכת מוכנה לשימוש',
      timestamp: new Date(),
      read: false
    }
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Navigation handlers
  const navigateTo = (page: string, id?: string) => {
    if (page === 'production') {
      setCurrentView({ name: 'production' });
    } else if (id && (page === 'order-detail' || page === 'customer-detail' || page === 'edit-order')) {
      setCurrentView({ name: page as any, id });
    } else {
      setCurrentView({ name: page as any });
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setCurrentView({ name: 'order-detail', id: orderId });
  };

  // Notifications handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Get breadcrumbs based on current view
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'דשבורד', onClick: () => navigateTo('dashboard') }];
    
    if (currentView.name === 'orders' || currentView.name === 'order-detail' || currentView.name === 'create-order' || currentView.name === 'edit-order') {
      crumbs.push({ label: 'הזמנות', onClick: () => navigateTo('orders') });
      if (currentView.name === 'order-detail' && 'id' in currentView) {
        crumbs.push({ label: `הזמנה #${currentView.id.substring(0, 8)}` });
      } else if (currentView.name === 'create-order') {
        crumbs.push({ label: 'הזמנה חדשה' });
      } else if (currentView.name === 'edit-order' && 'id' in currentView) {
        crumbs.push({ label: 'עריכת הזמנה' });
      }
    } else if (currentView.name === 'customers' || currentView.name === 'customer-detail') {
      crumbs.push({ label: 'לקוחות', onClick: () => navigateTo('customers') });
      if (currentView.name === 'customer-detail' && 'id' in currentView) {
        crumbs.push({ label: 'פרטי לקוח' });
      }
    } else if (currentView.name !== 'dashboard') {
      const pageLabels: Record<string, string> = {
        'leads': 'לידים',
        'products': 'מוצרים',
        'production': 'ייצור',
        'suppliers': 'ספקים',
        'inventory': 'מלאי',
        'finances': 'כספים',
        'tasks': 'משימות',
        'settings': 'הגדרות'
      };
      crumbs.push({ label: pageLabels[currentView.name] || currentView.name });
    }
    
    return crumbs;
  };

  // Get FAB actions based on current page
  const getFABActions = () => {
    const actions = [];
    
    if (currentView.name === 'orders') {
      actions.push({
        label: 'הזמנה חדשה',
        icon: <Search size={20} />,
        onClick: () => navigateTo('create-order')
      });
    } else if (currentView.name === 'customers') {
      actions.push({
        label: 'לקוח חדש',
        icon: <Search size={20} />,
        onClick: () => {/* TODO: Open create customer modal */}
      });
    } else {
      actions.push({
        label: 'חיפוש',
        icon: <Search size={20} />,
        onClick: () => setIsCommandPaletteOpen(true)
      });
    }
    
    return actions;
  };

  const renderPage = () => {
    switch (currentView.name) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return (
          <Orders 
            onOrderClick={handleOrderSelect} 
            onCreateOrder={() => setCurrentView({ name: 'create-order' })} 
          />
        );
      case 'create-order':
        return <CreateOrder onCancel={() => setCurrentView({ name: 'orders' })} />;
      case 'order-detail':
        return <OrderDetail 
          orderId={currentView.id} 
          onBack={() => setCurrentView({ name: 'orders' })} 
          onEdit={(id) => setCurrentView({ name: 'edit-order', id })} 
          onViewCustomer={(customerId) => setCurrentView({ name: 'customer-detail', id: customerId })}
        />;
      case 'edit-order':
        return <EditOrder orderId={currentView.id} onCancel={() => setCurrentView({ name: 'order-detail', id: currentView.id })} onSave={() => setCurrentView({ name: 'order-detail', id: currentView.id })} />;
      case 'leads':
        return <Leads />;
      case 'customers':
        return <Customers onViewCustomer={(id) => setCurrentView({ name: 'customer-detail', id })} />;
      case 'customer-detail':
        return <CustomerDetail customerId={currentView.id} onBack={() => setCurrentView({ name: 'customers' })} onEdit={(id) => {/* TODO: Edit customer */}} />;
      case 'products':
        return <Products />;
      case 'production':
        return (
          <div className="space-y-8">
            <ProductionLocal />
            <div className="border-t border-slate-200 my-8"></div>
            <ProductionImport />
          </div>
        );
      case 'suppliers':
        return <Suppliers />;
      case 'inventory':
        return <Inventory />;
      case 'finances':
        return <Finances />;
      case 'tasks':
        return <Tasks />;
      case 'settings':
        return <PlaceholderPage title="הגדרות" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar 
        currentPage={['order-detail', 'create-order', 'edit-order'].includes(currentView.name) ? 'orders' : 
                     ['customer-detail'].includes(currentView.name) ? 'customers' : currentView.name} 
        onNavigate={navigateTo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white dark:bg-slate-900 h-14 sm:h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 sm:px-4 lg:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 rounded-lg touch-manipulation transition-colors"
              aria-label="תפריט"
            >
              <Menu size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm hidden sm:block truncate">
              מערכת ניהול / <span className="text-slate-800 dark:text-slate-200 font-medium">Stash</span>
            </div>
            {/* Breadcrumbs for detail pages */}
            {['order-detail', 'customer-detail', 'create-order', 'edit-order'].includes(currentView.name) && (
              <div className="hidden md:block">
                <Breadcrumbs items={getBreadcrumbs()} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="חיפוש (Cmd+K)"
            >
              <Search size={18} />
              <span className="hidden lg:inline">חיפוש</span>
              <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                ⌘K
              </kbd>
            </button>
            <NotificationsCenter
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onRemove={handleRemoveNotification}
            />
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={theme === 'light' ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-slate-200 dark:border-slate-700">
              <div className="hidden sm:block text-right">
                <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">דני מנהל</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">אדמין</div>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs sm:text-sm">
                ד
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto pb-6 sm:pb-10">
            {/* Breadcrumbs for mobile */}
            {['order-detail', 'customer-detail', 'create-order', 'edit-order'].includes(currentView.name) && (
              <div className="md:hidden mb-4">
                <Breadcrumbs items={getBreadcrumbs()} />
              </div>
            )}
            {renderPage()}
          </div>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton actions={getFABActions()} />

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={navigateTo}
        />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
