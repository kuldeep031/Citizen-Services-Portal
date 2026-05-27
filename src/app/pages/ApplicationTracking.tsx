import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, Download, Clock, Calendar, User, MapPin, Building, Inbox, Loader2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline, TimelineItem } from '../components/Timeline';
import { api, ApiError } from '../../lib/api';

interface ApplicationData {
  ticketId: string;
  title: string;
  department: string;
  category: string;
  status: string;
  priority: string;
  location: string;
  description: string;
  submittedDate: string;
  slaDeadline: string | null;
  daysRemaining: number | null;
  isBreached: boolean;
  officer: { name: string; department?: string } | null;
  timeline: { title: string; description: string; date: string; changedBy: string }[];
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function mapTimelineStatus(index: number, total: number, appStatus: string): 'completed' | 'current' | 'upcoming' {
  if (appStatus === 'resolved' || appStatus === 'rejected') return 'completed';
  if (index === total - 1) return 'current';
  return 'completed';
}

export function ApplicationTracking() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [searchId, setSearchId] = useState(initialId);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    const trimmed = searchId.trim().toUpperCase();
    if (!trimmed) return;
    setIsSearching(true);
    setNotFound(false);

    try {
      const res = await api.get<{ application: ApplicationData }>(`tracking/${trimmed}`);
      setApplication(res.application);
    } catch (err) {
      setApplication(null);
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setNotFound(true);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDownloadReceipt = async () => {
    if (!application) return;
    try {
      const res = await api.get<{ receipt: { ticketId: string; title: string; category: string; department: string; priority: string; location: string; citizen: { name: string; email: string; phone: string | null }; contactName: string | null; contactPhone: string | null; submittedAt: string; receiptGeneratedAt: string } }>(`tracking/${application.ticketId}/receipt`);
      const r = res.receipt;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt - ${r.ticketId}</title><style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1e293b; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
        .section { margin-bottom: 16px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
        .value { font-size: 14px; margin-top: 2px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .divider { border-top: 1px solid #e2e8f0; margin: 20px 0; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 32px; }
        @media print { body { margin: 20px; } }
      </style></head><body>
        <h1>Complaint Receipt</h1>
        <p class="subtitle">Unified Citizen Services Portal — Government of India</p>
        <div class="divider"></div>
        <div class="grid">
          <div class="section"><p class="label">Ticket ID</p><p class="value"><strong>${r.ticketId}</strong></p></div>
          <div class="section"><p class="label">Date Submitted</p><p class="value">${new Date(r.submittedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          <div class="section"><p class="label">Department</p><p class="value">${r.department}</p></div>
          <div class="section"><p class="label">Category</p><p class="value">${r.category}</p></div>
          <div class="section"><p class="label">Priority</p><p class="value">${r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}</p></div>
          <div class="section"><p class="label">Citizen</p><p class="value">${r.citizen.name}</p></div>
        </div>
        <div class="divider"></div>
        <div class="section"><p class="label">Subject</p><p class="value">${r.title}</p></div>
        <div class="section"><p class="label">Location</p><p class="value">${r.location}</p></div>
        <div class="divider"></div>
        <p class="footer">This is a system-generated receipt. No signature required.<br/>Generated on ${new Date(r.receiptGeneratedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </body></html>`);
      printWindow.document.close();
      printWindow.print();
    } catch {
      // silently fail if receipt not available
    }
  };

  // Auto-search if ID was in URL
  useState(() => {
    if (initialId) {
      handleSearch();
    }
  });

  const timelineItems: TimelineItem[] = application?.timeline.map((t, i, arr) => ({
    title: t.title,
    description: t.description || `Updated by ${t.changedBy}`,
    date: formatDate(t.date),
    status: mapTimelineStatus(i, arr.length, application.status),
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Track Application</h1>
        <p className="text-[15px] text-muted-foreground">Enter your ticket ID to view the current status and timeline of your application.</p>
      </div>

      {/* Search Box */}
      <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Search application">
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Ticket ID (e.g., REQ-2025-001)"
              aria-label="Ticket ID"
              className="w-full pl-11 pr-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchId.trim()}
            className="min-h-[44px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Search'}
          </button>
        </div>
        {notFound && (
          <p className="text-sm text-destructive mt-3" role="alert">No application found with that ticket ID. Please check and try again.</p>
        )}
      </section>

      {/* Empty State */}
      {!application && !notFound && !isSearching && (
        <div className="bg-card rounded-xl p-10 sm:p-14 shadow-sm border border-border text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">Enter a ticket ID above to view application details</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">You can find your ticket ID in the confirmation email or SMS</p>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Application Details */}
      {application && !isSearching && (
        <>
          <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Application summary">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <h2 className="font-bold text-lg">{application.ticketId}</h2>
                  <StatusBadge status={mapStatus(application.status)} />
                </div>
                <p className="text-[15px] text-card-foreground font-medium">{application.title}</p>
              </div>
              <button onClick={handleDownloadReceipt} className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors self-start flex-shrink-0" aria-label="Download receipt">
                <Download className="w-4 h-4" aria-hidden="true" />
                Download Receipt
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{application.description}</p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              {/* SLA Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <article className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Submitted</p>
                  </div>
                  <p className="text-sm font-semibold text-card-foreground tabular-nums">{formatDate(application.submittedDate)}</p>
                </article>
                <article className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">SLA Deadline</p>
                  </div>
                  <p className="text-sm font-semibold text-card-foreground tabular-nums">
                    {application.slaDeadline ? formatDate(application.slaDeadline) : 'N/A'}
                  </p>
                </article>
                <article className={`bg-card rounded-xl p-4 sm:p-5 shadow-sm border ${application.daysRemaining !== null && application.daysRemaining <= 3 && application.daysRemaining > 0 ? 'border-warning/50' : 'border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Days Remaining</p>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${
                    application.status === 'resolved' ? 'text-success' :
                    application.isBreached ? 'text-destructive' :
                    (application.daysRemaining !== null && application.daysRemaining <= 3) ? 'text-warning' : 'text-card-foreground'
                  }`}>
                    {application.status === 'resolved' ? 'Completed' : application.isBreached ? 'Overdue' : `${application.daysRemaining ?? 'N/A'} days`}
                  </p>
                </article>
              </div>

              {/* Timeline */}
              <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Status timeline">
                <h3 className="font-semibold mb-5">Status Timeline</h3>
                {timelineItems.length > 0 ? (
                  <Timeline items={timelineItems} />
                ) : (
                  <p className="text-sm text-muted-foreground">No status updates yet.</p>
                )}
              </section>
            </div>

            <div className="space-y-5 sm:space-y-6">
              {/* Officer Update */}
              <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Officer update">
                <h3 className="font-semibold mb-4">Assigned Officer</h3>
                {application.officer ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-card-foreground">{application.officer.name}</p>
                    </div>
                    {application.officer.department && (
                      <div className="flex items-center gap-2.5">
                        <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        <p className="text-[13px] text-muted-foreground">{application.officer.department}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">Not yet assigned</p>
                )}
              </section>

              {/* Details */}
              <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Application details">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{application.location}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border space-y-2.5">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Department</p>
                      <p className="text-sm font-medium text-card-foreground">{application.department} — {application.category}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Priority</p>
                      <p className="text-sm font-medium text-card-foreground capitalize">{application.priority}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
