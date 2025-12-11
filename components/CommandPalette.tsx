import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, ArrowRight, ShoppingCart, Users, Package } from 'lucide-react';
import { ordersService } from '../services/ordersService';
import { customersService } from '../services/customersService';
import { productsService } from '../services/productsService';
import { Order, Customer, Product } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, id?: string) => void;
}

interface SearchResult {
  id: string;
  type: 'order' | 'customer' | 'product';
  title: string;
  subtitle?: string;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Load data when palette opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        ordersService.getAll(),
        customersService.getAll(),
        productsService.getAll()
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading command palette data:', error);
    }
  };

  const results = useMemo<SearchResult[]>(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search orders
    orders
      .filter(order => 
        order.order_number.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term)
      )
      .slice(0, 5)
      .forEach(order => {
        searchResults.push({
          id: order.id,
          type: 'order',
          title: `הזמנה #${order.order_number}`,
          subtitle: order.customer_name,
          action: () => {
            onNavigate('order-detail', order.id);
            onClose();
          }
        });
      });

    // Search customers
    mockCustomers
      .filter(customer => 
        customer.first_name?.toLowerCase().includes(term) ||
        customer.last_name?.toLowerCase().includes(term) ||
        customer.company_name?.toLowerCase().includes(term) ||
        customer.phone.includes(term)
      )
      .slice(0, 5)
      .forEach(customer => {
        searchResults.push({
          id: customer.id,
          type: 'customer',
          title: customer.customer_type === 'business' 
            ? customer.company_name || ''
            : `${customer.first_name} ${customer.last_name}`,
          subtitle: customer.phone,
          action: () => {
            onNavigate('customer-detail', customer.id);
            onClose();
          }
        });
      });

    // Search products
    products
      .filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      )
      .slice(0, 5)
      .forEach(product => {
        searchResults.push({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: `SKU: ${product.sku}`,
          action: () => {
            onNavigate('products');
            onClose();
          }
        });
      });

    return searchResults;
  }, [searchTerm, orders, customers, products, onNavigate, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart size={18} />;
      case 'customer':
        return <Users size={18} />;
      case 'product':
        return <Package size={18} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש הזמנות, לקוחות, מוצרים..."
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={result.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="text-blue-600 dark:text-blue-400">{getIcon(result.type)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">{result.subtitle}</div>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              לא נמצאו תוצאות
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              התחל להקליד כדי לחפש...
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>↑↓ לניווט • Enter לבחירה • Esc לסגירה</span>
            <span>Cmd+K לפתיחה</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
