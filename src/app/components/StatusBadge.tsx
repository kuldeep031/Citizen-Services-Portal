import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected' | 'approved' | 'submitted' | 'under-review';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const statusConfig: Record<string, { bg: string; text: string; labelKey: string }> = {
    pending: { bg: 'bg-warning/10', text: 'text-warning', labelKey: 'status.submitted' },
    'in-progress': { bg: 'bg-info/10', text: 'text-info', labelKey: 'status.in_progress' },
    'under-review': { bg: 'bg-accent/10', text: 'text-accent', labelKey: 'status.under_review' },
    resolved: { bg: 'bg-success/10', text: 'text-success', labelKey: 'status.resolved' },
    rejected: { bg: 'bg-destructive/10', text: 'text-destructive', labelKey: 'status.rejected' },
    approved: { bg: 'bg-success/10', text: 'text-success', labelKey: 'status.resolved' },
    submitted: { bg: 'bg-secondary/10', text: 'text-secondary', labelKey: 'status.submitted' },
  };

  const config = statusConfig[status] ?? statusConfig['pending'];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${config.bg} ${config.text} ${sizeClasses[size]}`}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')} mr-1.5`} aria-hidden="true" />
      {t(config.labelKey)}
    </span>
  );
}
