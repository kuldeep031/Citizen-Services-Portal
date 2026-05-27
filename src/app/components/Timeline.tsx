import { Check, Clock } from 'lucide-react';

export interface TimelineItem {
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="space-y-0" aria-label="Status timeline">
      {items.map((item, index) => (
        <li key={index} className="relative flex gap-4">
          {/* Connector line */}
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                item.status === 'completed'
                  ? 'bg-success border-success text-success-foreground'
                  : item.status === 'current'
                  ? 'bg-info border-info text-info-foreground'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
              aria-hidden="true"
            >
              {item.status === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            {index < items.length - 1 && (
              <div className={`w-0.5 flex-1 min-h-[2rem] ${item.status === 'completed' ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-7 pt-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-card-foreground">{item.title}</h4>
              {item.status === 'current' && (
                <span className="text-[11px] font-medium text-info bg-info/10 px-2 py-0.5 rounded-full">Current</span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
            <time className="text-[11px] text-muted-foreground/70 mt-1 block">{item.date}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
