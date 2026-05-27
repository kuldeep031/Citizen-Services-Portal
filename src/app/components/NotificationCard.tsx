import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface NotificationCardProps {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
}

export function NotificationCard({ title, message, type, time }: NotificationCardProps) {
  const typeConfig = {
    info: { icon: Info, bg: 'bg-info/5', border: 'border-info/15', text: 'text-info', iconBg: 'bg-info' },
    success: { icon: CheckCircle, bg: 'bg-success/5', border: 'border-success/15', text: 'text-success', iconBg: 'bg-success' },
    warning: { icon: AlertCircle, bg: 'bg-warning/5', border: 'border-warning/15', text: 'text-warning', iconBg: 'bg-warning' },
    error: { icon: AlertCircle, bg: 'bg-destructive/5', border: 'border-destructive/15', text: 'text-destructive', iconBg: 'bg-destructive' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <article
      className={`rounded-xl p-4 ${config.bg} border ${config.border}`}
      role="article"
      aria-label={`${type} notification: ${title}`}
    >
      <div className="flex gap-3">
        <div className={`w-9 h-9 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-[13px] font-semibold ${config.text} mb-0.5`}>{title}</h4>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{message}</p>
          <time className="text-[11px] text-muted-foreground/70 mt-1.5 block">{time}</time>
        </div>
      </div>
    </article>
  );
}
