
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white sm:rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 pr-2">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors touch-manipulation"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar min-h-0">
          {children}
        </div>

        {footer && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 sm:rounded-b-xl flex flex-col sm:flex-row justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
