import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <article className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-muted-foreground font-medium leading-tight">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-card-foreground mt-2 tabular-nums">{value}</p>
          {trend && (
            <p className={`text-[13px] mt-2 font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              <span aria-hidden="true">{trend.isPositive ? '↑' : '↓'}</span>
              <span className="sr-only">{trend.isPositive ? 'Increased by' : 'Decreased by'}</span>
              {' '}{trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`} aria-hidden="true">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </article>
  );
}
