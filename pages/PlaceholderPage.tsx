import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 min-h-[60vh]">
      <div className="bg-slate-100 p-6 rounded-full">
        <Construction size={48} className="text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-600">העמוד "{title}" בבנייה</h2>
      <p>בקרוב תוכל לנהל כאן את {title}</p>
    </div>
  );
};

export default PlaceholderPage;
