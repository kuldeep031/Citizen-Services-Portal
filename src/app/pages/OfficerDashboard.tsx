import { useState, useEffect } from 'react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Clock, CheckCircle, AlertCircle, AlertTriangle, Filter, X, Send, Inbox, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

interface ComplaintListItem {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  department: string;
  location: string;
  slaDeadline: string | null;
  isBreached: boolean;
  createdAt: string;
}

interface ComplaintDetail {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  createdAt: string;
  contactPhone: string | null;
  contactEmail: string | null;
  department: { name: string };
  citizen: { name: string; email: string; phone: string | null };
  documents: { id: string; fileName: string }[];
  slaRecord: { deadlineDate: string; isBreached: boolean } | null;
  assignments: { officer: { name: string } }[];
  statusHistory: { fromStatus: string; toStatus: string; remarks: string | null; createdAt: string; changedBy: { name: string; role: string } }[];
}

interface OfficerStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  breached: number;
}

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'under_review' | 'resolved' | 'rejected';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

function mapDisplayStatus(status: string): 'pending' | 'in-progress' | 'under-review' | 'resolved' | 'rejected' | 'submitted' {
  const map: Record<string, 'pending' | 'in-progress' | 'under-review' | 'resolved' | 'rejected' | 'submitted'> = {
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

export function OfficerDashboard() {
  const { t } = useTranslation('officer');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<ComplaintDetail | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState<OfficerStats>({ total: 0, pending: 0, inProgress: 0, resolved: 0, breached: 0 });

  const fetchComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ complaints: ComplaintListItem[]; pagination: { total: number } }>(`complaints${query}`);
      setComplaints(res.complaints);
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<{ stats: OfficerStats }>('complaints/stats');
      setStats(res.stats);
    } catch {
      // keep defaults
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [statusFilter, priorityFilter]);

  const handleSelectComplaint = async (complaint: ComplaintListItem) => {
    setDetailLoading(true);
    try {
      const res = await api.get<{ complaint: ComplaintDetail }>(`complaints/${complaint.id}`);
      setSelectedDetail(res.complaint);
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!selectedDetail || !updateStatus) return;
    setUpdating(true);
    try {
      await api.patch(`complaints/${selectedDetail.id}/status`, { status: updateStatus, remarks });
      setUpdateStatus('');
      setRemarks('');
      setSelectedDetail(null);
      fetchComplaints();
      fetchStats();
    } catch {
      // keep form state on error
    } finally {
      setUpdating(false);
    }
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('table.all', { defaultValue: 'All' }) },
    { value: 'under_review', label: t('update.underReview') },
    { value: 'in_progress', label: t('update.inProgress') },
    { value: 'resolved', label: t('update.resolved') },
  ];

  const priorityFilters: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: t('table.allPriorities', { defaultValue: 'All Priorities' }) },
    { value: 'high', label: t('table.high', { defaultValue: 'High' }) },
    { value: 'medium', label: t('table.medium', { defaultValue: 'Medium' }) },
    { value: 'low', label: t('table.low', { defaultValue: 'Low' }) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">{t('dashboard.title')}</h1>
        <p className="text-[15px] text-muted-foreground">{t('dashboard.description')}</p>
      </div>

      {/* Stats */}
      <section aria-label="Overview statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          <StatsCard title={t('dashboard.totalAssigned')} value={stats.total} icon={FileText} color="primary" />
          <StatsCard title={t('dashboard.pendingAction')} value={stats.pending} icon={Clock} color="warning" />
          <StatsCard title={t('dashboard.inProgress')} value={stats.inProgress} icon={AlertCircle} color="info" />
          <StatsCard title={t('dashboard.resolved')} value={stats.resolved} icon={CheckCircle} color="success" />
          <StatsCard title={t('dashboard.slaBreached')} value={stats.breached} icon={AlertTriangle} color="primary" />
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3" role="toolbar" aria-label="Filter complaints">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              aria-pressed={statusFilter === f.value}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {priorityFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setPriorityFilter(f.value)}
              aria-pressed={priorityFilter === f.value}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                priorityFilter === f.value
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Complaints Table */}
        <section className="lg:col-span-2" aria-label="Complaints list">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto" role="region" aria-label="Complaints table" tabIndex={0}>
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 sm:px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">{t('table.id')}</th>
                    <th scope="col" className="px-4 sm:px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">{t('table.title')}</th>
                    <th scope="col" className="px-4 sm:px-5 py-3.5 text-left text-[13px] font-semibold text-foreground hidden sm:table-cell">{t('table.priority')}</th>
                    <th scope="col" className="px-4 sm:px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">{t('table.status')}</th>
                    <th scope="col" className="px-4 sm:px-5 py-3.5 text-left text-[13px] font-semibold text-foreground hidden md:table-cell">{t('table.deadline')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      onClick={() => handleSelectComplaint(complaint)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${complaint.ticketId}: ${complaint.title}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectComplaint(complaint); } }}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                        selectedDetail?.id === complaint.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 sm:px-5 py-3.5 text-sm font-medium text-primary whitespace-nowrap">{complaint.ticketId}</td>
                      <td className="px-4 sm:px-5 py-3.5 text-sm text-card-foreground">{complaint.title}</td>
                      <td className="px-4 sm:px-5 py-3.5 text-sm hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          complaint.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                          complaint.priority === 'medium' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        }`}>
                          {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-sm">
                        <StatusBadge status={mapDisplayStatus(complaint.status)} size="sm" />
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell tabular-nums">
                        {complaint.slaDeadline ? formatDate(complaint.slaDeadline) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {complaints.length === 0 && (
              <div className="p-10 text-center">
                <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">{t('table.noComplaints')}</p>
                <p className="text-[13px] text-muted-foreground/60 mt-1">{t('table.tryDifferent')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Detail Panel */}
        <aside aria-label="Complaint details">
          {detailLoading ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-10 text-center sticky top-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
            </div>
          ) : selectedDetail ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 sm:p-6 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">{selectedDetail.ticketId}</h3>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                  aria-label="Close detail panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-card-foreground mb-1">{selectedDetail.title}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{selectedDetail.description}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.citizen')}</dt>
                  <dd className="font-medium text-card-foreground mt-0.5">{selectedDetail.citizen.name}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.department')}</dt>
                  <dd className="font-medium text-card-foreground mt-0.5">{selectedDetail.department.name}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.phone')}</dt>
                  <dd className="text-card-foreground mt-0.5 text-[13px]">{selectedDetail.citizen.phone || selectedDetail.contactPhone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.email')}</dt>
                  <dd className="text-card-foreground mt-0.5 text-[13px] truncate">{selectedDetail.citizen.email || selectedDetail.contactEmail || '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.location')}</dt>
                  <dd className="text-card-foreground mt-0.5 text-[13px]">{selectedDetail.location}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.filedOn')}</dt>
                  <dd className="text-card-foreground mt-0.5 tabular-nums">{formatDate(selectedDetail.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{t('detail.deadline')}</dt>
                  <dd className={`mt-0.5 tabular-nums ${selectedDetail.slaRecord?.isBreached ? 'text-destructive font-semibold' : 'text-card-foreground'}`}>
                    {selectedDetail.slaRecord ? formatDate(selectedDetail.slaRecord.deadlineDate) : '—'}
                    {selectedDetail.slaRecord?.isBreached && ` ${t('detail.overdue')}`}
                  </dd>
                </div>
              </dl>

              {/* Status History */}
              {selectedDetail.statusHistory && selectedDetail.statusHistory.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">{t('detail.history')}</p>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {selectedDetail.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-card-foreground">
                            {h.fromStatus} → {h.toStatus}
                          </p>
                          {h.remarks && <p className="text-[11px] text-muted-foreground truncate">{h.remarks}</p>}
                        </div>
                        <time className="text-[11px] text-muted-foreground/70 flex-shrink-0 tabular-nums">{formatDate(h.createdAt)}</time>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedDetail.documents.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">{t('detail.documents')}</p>
                  <div className="space-y-1.5">
                    {selectedDetail.documents.map((doc) => (
                      <a key={doc.id} href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/uploads/${doc.id}/download`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
                        <span className="text-[13px] text-primary truncate underline">{doc.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              {selectedDetail.status !== 'resolved' && selectedDetail.status !== 'rejected' && (
                <form
                  className="border-t border-border pt-4 space-y-3"
                  onSubmit={(e) => { e.preventDefault(); handleSubmitUpdate(); }}
                  aria-label="Update complaint status"
                >
                  <p className="text-sm font-semibold text-card-foreground">{t('update.title')}</p>
                  <div>
                    <label htmlFor="status-select" className="sr-only">New status</label>
                    <select
                      id="status-select"
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="">{t('update.selectStatus')}</option>
                      <option value="in_progress">{t('update.inProgress')}</option>
                      <option value="under_review">{t('update.underReview')}</option>
                      <option value="resolved">{t('update.resolved')}</option>
                      <option value="rejected">{t('update.rejected')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="remarks-input" className="sr-only">Remarks</label>
                    <textarea
                      id="remarks-input"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={t('update.remarksPlaceholder')}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!updateStatus || updating}
                    className="flex items-center gap-2 w-full justify-center min-h-[44px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                    {t('update.submit')}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-sm border border-border p-10 text-center sticky top-20">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">{t('detail.selectComplaint')}</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">{t('detail.selectHint')}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
