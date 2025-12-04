import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, trendUp, color = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-between hover:shadow-md transition-all hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue} dark:opacity-80`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{label}</h3>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
