import React from 'react';
import { ChevronLeft, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <Home size={16} />
        <span>דשבורד</span>
      </button>
      {items.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronLeft size={16} className="text-slate-400" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-900 dark:text-slate-200 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
