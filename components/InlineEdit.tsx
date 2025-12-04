import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => void;
  onCancel?: () => void;
  type?: 'text' | 'number' | 'email' | 'tel';
  className?: string;
  placeholder?: string;
}

const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  onCancel,
  type = 'text',
  className = '',
  placeholder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const finalValue = type === 'number' ? Number(editValue) : editValue;
    onSave(finalValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          placeholder={placeholder}
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
          title="שמור"
        >
          <Check size={16} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="ביטול"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors ${className}`}
      title="לחץ לעריכה"
    >
      {value}
    </span>
  );
};

export default InlineEdit;
