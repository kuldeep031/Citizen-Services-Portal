import { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { Filter, Inbox, Loader2, UserPlus, Users, X, Search, MapPin, Calendar, Clock, User, Building, FileText } from 'lucide-react';
import { api } from '../../lib/api';

interface ComplaintItem {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  department: string;
  departmentCode: string;
  departmentId: string;
  location: string;
  slaDeadline: string | null;
  isBreached: boolean;
  assignedOfficer: { id: string; name: string } | null;
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
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdAt: string;
  department: { name: string; code: string };
  citizen: { name: string; email: string; phone: string | null };
  documents: { id: string; fileName: string; fileSize: number }[];
  slaRecord: { deadlineDate: string; isBreached: boolean; deadlineDays: number } | null;
  assignments: { officer: { id: string; name: string; email: string; phone: string | null; department: { name: string } } }[];
  statusHistory: { fromStatus: string; toStatus: string; remarks: string | null; createdAt: string; changedBy: { name: string; role: string } }[];
}

interface DeptOfficer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'under_review' | 'resolved' | 'rejected';

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

export function AdminComplaints() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Assignment state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deptOfficers, setDeptOfficers] = useState<DeptOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Detail panel
  const [selectedDetail, setSelectedDetail] = useState<ComplaintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '15');
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ complaints: ComplaintItem[]; pagination: { total: number; totalPages: number } }>(`complaints${query}`);
      setComplaints(res.complaints);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, page]);

  const handleStartAssign = async (complaint: ComplaintItem) => {
    setAssigningId(complaint.id);
    setSelectedOfficer('');
    setLoadingOfficers(true);
    try {
      const res = await api.get<{ officers: DeptOfficer[] }>(`admin/officers-by-department/${complaint.departmentId}`);
      setDeptOfficers(res.officers);
    } catch {
      setDeptOfficers([]);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleAssign = async (complaintId: string) => {
    if (!selectedOfficer) return;
    setAssigning(true);
    try {
      await api.patch(`complaints/${complaintId}/assign`, { officerId: selectedOfficer });
      setAssigningId(null);
      setSelectedOfficer('');
      setDeptOfficers([]);
      fetchComplaints();
      if (selectedDetail?.id === complaintId) {
        handleViewDetail(complaintId);
      }
    } catch {
      // keep state
    } finally {
      setAssigning(false);
    }
  };

  const handleViewDetail = async (complaintId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get<{ complaint: ComplaintDetail }>(`complaints/${complaintId}`);
      setSelectedDetail(res.complaint);
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = searchQuery
    ? complaints.filter((c) =>
        c.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : complaints;

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Manage Complaints</h1>
        <p className="text-[15px] text-muted-foreground">View all complaints, assign officers, and manage workflow.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
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
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or title..."
            aria-label="Search complaints"
            className="w-full pl-9 pr-4 py-2.5 min-h-[40px] rounded-lg border border-input bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">{total} total complaints</p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        {/* Complaints Table */}
        <section className="xl:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden" aria-label="All complaints">
          <div className="overflow-x-auto" role="region" aria-label="Complaints table" tabIndex={0}>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-left text-[13px] font-semibold text-foreground">Ticket</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-[13px] font-semibold text-foreground">Title</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-[13px] font-semibold text-foreground hidden md:table-cell">Dept</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-[13px] font-semibold text-foreground">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-[13px] font-semibold text-foreground hidden lg:table-cell">Officer</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-[13px] font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((complaint) => {
                  const isClosed = complaint.status === 'resolved' || complaint.status === 'rejected';
                  const isAssigned = !!complaint.assignedOfficer;
                  return (
                    <tr
                      key={complaint.id}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${complaint.isBreached && !isClosed ? 'bg-destructive/3' : ''} ${selectedDetail?.id === complaint.id ? 'bg-primary/5' : ''}`}
                      onClick={() => handleViewDetail(complaint.id)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-primary whitespace-nowrap">{complaint.ticketId}</td>
                      <td className="px-4 py-3 text-sm text-card-foreground max-w-[160px] truncate">{complaint.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{complaint.departmentCode}</td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={mapDisplayStatus(complaint.status)} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">
                        {isAssigned ? (
                          <span className="text-[12px] text-card-foreground">{complaint.assignedOfficer!.name}</span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/60 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                        {isClosed ? (
                          <span className="text-[12px] text-muted-foreground/60">Closed</span>
                        ) : assigningId === complaint.id ? (
                          <div className="flex items-center gap-1.5">
                            {loadingOfficers ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <select
                                  value={selectedOfficer}
                                  onChange={(e) => setSelectedOfficer(e.target.value)}
                                  className="px-2 py-1.5 min-h-[32px] rounded-lg border border-input bg-input-background text-foreground text-[11px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent max-w-[120px]"
                                  aria-label="Select officer"
                                >
                                  <option value="">Select...</option>
                                  {deptOfficers.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssign(complaint.id)}
                                  disabled={!selectedOfficer || assigning}
                                  className="min-h-[32px] px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[11px] font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {assigning ? '...' : 'OK'}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => { setAssigningId(null); setSelectedOfficer(''); setDeptOfficers([]); }}
                              className="min-w-[28px] min-h-[28px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                              aria-label="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartAssign(complaint)}
                            className={`flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                              isAssigned
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                            aria-label={`${isAssigned ? 'Reassign' : 'Assign'} officer`}
                          >
                            <UserPlus className="w-3 h-3" aria-hidden="true" />
                            {isAssigned ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">No complaints found</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="min-h-[36px] px-3 py-1.5 bg-muted text-foreground rounded-lg text-[13px] font-medium hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="min-h-[36px] px-3 py-1.5 bg-muted text-foreground rounded-lg text-[13px] font-medium hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Detail Panel */}
        <aside aria-label="Complaint details">
          {detailLoading ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-10 text-center sticky top-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
            </div>
          ) : selectedDetail ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{selectedDetail.ticketId}</h3>
                  <StatusBadge status={mapDisplayStatus(selectedDetail.status)} size="sm" />
                </div>
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

              {/* Complaint Info */}
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Department</dt>
                  <dd className="font-medium text-card-foreground mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    {selectedDetail.department.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Priority</dt>
                  <dd className="mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      selectedDetail.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                      selectedDetail.priority === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      {selectedDetail.priority.charAt(0).toUpperCase() + selectedDetail.priority.slice(1)}
                    </span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Location</dt>
                  <dd className="text-card-foreground mt-0.5 text-[13px] flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
                    {selectedDetail.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Filed On</dt>
                  <dd className="text-card-foreground mt-0.5 text-[13px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    {formatDate(selectedDetail.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">SLA Deadline</dt>
                  <dd className={`mt-0.5 text-[13px] flex items-center gap-1.5 ${selectedDetail.slaRecord?.isBreached ? 'text-destructive font-semibold' : 'text-card-foreground'}`}>
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    {selectedDetail.slaRecord ? formatDate(selectedDetail.slaRecord.deadlineDate) : '—'}
                    {selectedDetail.slaRecord?.isBreached && ' (Overdue)'}
                  </dd>
                </div>
              </dl>

              {/* Citizen Info */}
              <div className="border-t border-border pt-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Citizen</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-card-foreground">{selectedDetail.citizen.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-muted-foreground ml-5">{selectedDetail.citizen.email}</span>
                  </div>
                  {(selectedDetail.citizen.phone || selectedDetail.contactPhone) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-muted-foreground ml-5">{selectedDetail.citizen.phone || selectedDetail.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Officer */}
              <div className="border-t border-border pt-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Assigned Officer</p>
                {selectedDetail.assignments.length > 0 ? (
                  <div className="space-y-1.5 bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-[13px] font-medium text-card-foreground">{selectedDetail.assignments[0].officer.name}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground ml-5">{selectedDetail.assignments[0].officer.email}</p>
                    {selectedDetail.assignments[0].officer.phone && (
                      <p className="text-[12px] text-muted-foreground ml-5">{selectedDetail.assignments[0].officer.phone}</p>
                    )}
                    <p className="text-[12px] text-muted-foreground ml-5">{selectedDetail.assignments[0].officer.department.name}</p>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground/60 italic">No officer assigned yet</p>
                )}
              </div>

              {/* Documents */}
              {selectedDetail.documents.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Documents ({selectedDetail.documents.length})</p>
                  <div className="space-y-1.5">
                    {selectedDetail.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        <span className="text-[12px] text-card-foreground truncate flex-1">{doc.fileName}</span>
                        <span className="text-[11px] text-muted-foreground/60">{(doc.fileSize / 1024).toFixed(0)}KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedDetail.statusHistory.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">History</p>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {selectedDetail.statusHistory.map((h, i) => (
                      <div key={i} className="p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-medium text-card-foreground">
                            {h.fromStatus === 'none' ? 'Submitted' : `${h.fromStatus.replace('_', ' ')} → ${h.toStatus.replace('_', ' ')}`}
                          </p>
                          <time className="text-[11px] text-muted-foreground/60 tabular-nums">{formatDate(h.createdAt)}</time>
                        </div>
                        {h.remarks && <p className="text-[11px] text-muted-foreground mt-0.5">{h.remarks}</p>}
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">by {h.changedBy.name} ({h.changedBy.role})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-sm border border-border p-10 text-center sticky top-20">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">Select a complaint to view details</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">Click any row in the table</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
