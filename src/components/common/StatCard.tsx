import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = 'bg-brand-50',
  iconColor = 'text-brand-600',
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${iconBgColor} ${iconColor} shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <div
              className={`flex items-center gap-1 font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
