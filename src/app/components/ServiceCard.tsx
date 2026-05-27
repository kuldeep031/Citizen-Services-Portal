import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color?: 'primary' | 'secondary' | 'accent';
}

export function ServiceCard({ title, description, icon: Icon, href, color = 'primary' }: ServiceCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary/15',
    secondary: 'bg-secondary/10 text-secondary group-hover:bg-secondary/15',
    accent: 'bg-accent/10 text-accent group-hover:bg-accent/15',
  };

  return (
    <Link
      to={href}
      className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all group block min-h-[44px]"
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[color]} transition-colors`} aria-hidden="true">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-[15px] font-semibold mb-1.5 text-card-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
