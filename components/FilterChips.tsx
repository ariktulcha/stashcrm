import React from 'react';
import { X } from 'lucide-react';

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ chips, onRemove, onClearAll }) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
        >
          {chip.label}: {chip.value}
          <button
            onClick={() => onRemove(chip.id)}
            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
        >
          נקה הכל
        </button>
      )}
    </div>
  );
};

export default FilterChips;
