import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon: Icon, colorClass, trend }) => {
  return (
    <div className="bg-surface rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
          <div className="flex items-baseline mt-2">
            <span className={`text-3xl font-bold text-white`}>{value}</span>
            <span className="ml-1 text-slate-400 text-sm">{unit}</span>
          </div>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      {trend && (
        <div className="text-sm text-slate-400">
          {trend}
        </div>
      )}
    </div>
  );
};