import { useState, useEffect } from 'react';
import { StatsCard } from '../components/StatsCard';
import { ServiceCard } from '../components/ServiceCard';
import { NotificationCard } from '../components/NotificationCard';
import { StatusBadge } from '../components/StatusBadge';
import { Zap, Droplet, Flame, Trash2, FileText, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { api } from '../../lib/api';
import { useAuth } from '../../auth';

interface ComplaintItem {
  id: string;
  ticketId: string;
  title: string;
  department: string;
  status: string;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function mapStatus(status: string): 'pending' | 'in-progress' | 'resolved' | 'rejected' | 'submitted' | 'under-review' {
  const map: Record<string, 'pending' | 'in-progress' | 'resolved' | 'rejected' | 'submitted' | 'under-review'> = {
    submitted: 'submitted',
    under_review: 'under-review',
    in_progress: 'in-progress',
    resolved: 'resolved',
    rejected: 'rejected',
  };
  return map[status] || 'pending';
}

export function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, resolved: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [complaintsRes, allRes, notifRes] = await Promise.all([
          api.get<{ complaints: ComplaintItem[]; pagination: { total: number } }>('complaints?limit=5'),
          api.get<{ complaints: ComplaintItem[]; pagination: { total: number } }>('complaints?limit=100'),
          api.get<{ notifications: NotificationItem[]; unreadCount: number }>('notifications'),
        ]);

        setComplaints(complaintsRes.complaints);
        setNotifications(notifRes.notifications.slice(0, 4));

        const all = allRes.complaints;
        const resolved = all.filter((c) => c.status === 'resolved').length;
        const rejected = all.filter((c) => c.status === 'rejected').length;
        const pending = all.filter((c) => c.status === 'submitted').length;
        const active = all.length - resolved - rejected;

        setStats({ active, pending, resolved, urgent: 0 });
      } catch {
        // Fallback to empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/85 rounded-xl p-6 sm:p-8 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-primary-foreground/85 text-[15px] sm:text-base max-w-2xl leading-relaxed">
          Access all government services in one place. Submit complaints, track applications, and stay updated.
        </p>
      </section>

      {/* Overview Stats */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatsCard title="Active Requests" value={stats.active} icon={FileText} color="primary" />
          <StatsCard title="Pending Approvals" value={stats.pending} icon={Clock} color="warning" />
          <StatsCard title="Resolved Issues" value={stats.resolved} icon={CheckCircle} color="success" />
          <StatsCard title="Urgent Alerts" value={stats.urgent} icon={AlertCircle} color="info" />
        </div>
      </section>

      {/* Quick Access Services */}
      <section aria-labelledby="services-heading">
        <h2 id="services-heading" className="mb-4">Quick Access Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <ServiceCard title="Electricity" description="New connections, bill payments, and complaints" icon={Zap} href="/citizen/submit-complaint?dept=electricity" color="primary" />
          <ServiceCard title="Water Supply" description="Water connections and quality complaints" icon={Droplet} href="/citizen/submit-complaint?dept=water" color="secondary" />
          <ServiceCard title="Gas Services" description="Gas connections and safety issues" icon={Flame} href="/citizen/submit-complaint?dept=gas" color="accent" />
          <ServiceCard title="Waste Management" description="Collection schedules and complaints" icon={Trash2} href="/citizen/submit-complaint?dept=waste" color="primary" />
        </div>
      </section>

      {/* Recent Requests + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2" aria-labelledby="requests-heading">
          <h2 id="requests-heading" className="mb-4">Recent Requests</h2>
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            {complaints.length > 0 ? (
              <div className="overflow-x-auto" role="region" aria-label="Recent requests table" tabIndex={0}>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">Request ID</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">Title</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground hidden sm:table-cell">Department</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {complaints.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 text-sm">
                          <Link to={`/citizen/track-application?id=${request.ticketId}`} className="text-primary hover:underline font-medium">
                            {request.ticketId}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-card-foreground">{request.title}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{request.department}</td>
                        <td className="px-5 py-3.5 text-sm">
                          <StatusBadge status={mapStatus(request.status)} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">No requests yet</p>
                <p className="text-[13px] text-muted-foreground/60 mt-1">Submit your first complaint to get started</p>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="notifications-heading">
          <h2 id="notifications-heading" className="mb-4">Notifications</h2>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <NotificationCard key={n.id} type={n.type} title={n.title} message={n.message} time={timeAgo(n.createdAt)} />
              ))
            ) : (
              <div className="bg-card rounded-xl p-8 border border-border text-center">
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
