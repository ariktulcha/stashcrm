import React, { useState } from 'react';
import { Plus, X, ShoppingCart, UserPlus, Package } from 'lucide-react';

interface FloatingActionButtonProps {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
  }>;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) return null;

  const mainAction = actions[0];
  const otherActions = actions.slice(1);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {isOpen && otherActions.length > 0 && (
        <div className="absolute bottom-16 left-0 mb-2 space-y-2">
          {otherActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all animate-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          if (isOpen && otherActions.length === 0) {
            mainAction.onClick();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen && otherActions.length > 0
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {isOpen && otherActions.length > 0 ? (
          <X size={24} />
        ) : (
          mainAction.icon || <Plus size={24} />
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton;
