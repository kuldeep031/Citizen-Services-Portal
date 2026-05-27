interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected' | 'approved' | 'submitted' | 'under-review';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' },
    'in-progress': { bg: 'bg-info/10', text: 'text-info', label: 'In Progress' },
    'under-review': { bg: 'bg-accent/10', text: 'text-accent', label: 'Under Review' },
    resolved: { bg: 'bg-success/10', text: 'text-success', label: 'Resolved' },
    rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected' },
    approved: { bg: 'bg-success/10', text: 'text-success', label: 'Approved' },
    submitted: { bg: 'bg-secondary/10', text: 'text-secondary', label: 'Submitted' },
  };

  const config = statusConfig[status] ?? statusConfig['pending'];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${config.bg} ${config.text} ${sizeClasses[size]}`}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')} mr-1.5`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
