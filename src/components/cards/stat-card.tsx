import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card dark:bg-card rounded-xl p-6 border border-border dark:border-neutral-800 hover:border-accent/30 dark:hover:border-blue-700/50 transition-all duration-300 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-blue-900/10',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">{title}</p>
          <p className="text-3xl font-light tracking-tight text-foreground dark:text-neutral-100">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : '-'}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground dark:text-neutral-500">vs last month</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-accent/10 dark:bg-blue-950/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-accent dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
}
