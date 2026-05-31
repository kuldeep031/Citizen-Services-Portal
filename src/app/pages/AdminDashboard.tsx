import { useState, useEffect } from 'react';
import { StatsCard } from '../components/StatsCard';
import { FileText, Users, Clock, CheckCircle, AlertTriangle, TrendingUp, Loader2, UserPlus, X, UserMinus, UserCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../../lib/api';
import { EmailOTPInput } from '../components/EmailOTPInput';

interface AdminStats {
  totalComplaints: number;
  resolved: number;
  pending: number;
  inProgress: number;
  activeOfficers: number;
  breachedSla: number;
  slaCompliance: number;
}

interface DepartmentStat {
  id: string;
  name: string;
  code: string;
  totalComplaints: number;
  resolved: number;
  breached: number;
  slaCompliance: number;
}

interface OfficerStat {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  departmentId: string;
  isActive: boolean;
  totalAssigned: number;
  resolved: number;
  active: number;
  createdAt: string;
}

interface MonthlyTrendItem {
  month: string;
  submitted: number;
  resolved: number;
}

interface DepartmentOption {
  id: string;
  name: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [officers, setOfficers] = useState<OfficerStat[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateOfficer, setShowCreateOfficer] = useState(false);
  const [showAlumni, setShowAlumni] = useState(false);
  const [alumniOfficers, setAlumniOfficers] = useState<OfficerStat[]>([]);
  const [deptOptions, setDeptOptions] = useState<DepartmentOption[]>([]);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', phone: '', departmentId: '' });
  const [creating, setCreating] = useState(false);
  const [emailToken, setEmailToken] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [overviewRes, deptRes, officerRes, trendRes] = await Promise.all([
        api.get<{ stats: AdminStats }>('admin/overview'),
        api.get<{ departments: DepartmentStat[] }>('admin/departments'),
        api.get<{ officers: OfficerStat[] }>('admin/officers'),
        api.get<{ trend: MonthlyTrendItem[] }>('admin/monthly-trend'),
      ]);
      setStats(overviewRes.stats);
      setDepartments(deptRes.departments);
      setOfficers(officerRes.officers);
      setMonthlyTrend(trendRes.trend);
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumni = async () => {
    try {
      const res = await api.get<{ officers: OfficerStat[] }>('admin/officers?status=alumni');
      setAlumniOfficers(res.officers);
    } catch {}
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (showAlumni) fetchAlumni();
  }, [showAlumni]);

  useEffect(() => {
    if (showCreateOfficer && deptOptions.length === 0) {
      api.get<{ departments: DepartmentOption[] }>('departments')
        .then((res) => setDeptOptions(res.departments))
        .catch(() => {});
    }
  }, [showCreateOfficer]);

  const handleDeactivate = async (officerId: string) => {
    setDeactivatingId(officerId);
    try {
      await api.patch(`admin/officers/${officerId}/deactivate`, {});
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
      if (showAlumni) fetchAlumni();
      fetchAll();
    } catch {} finally {
      setDeactivatingId(null);
    }
  };

  const handleReactivate = async (officerId: string) => {
    setDeactivatingId(officerId);
    try {
      await api.patch(`admin/officers/${officerId}/reactivate`, {});
      setAlumniOfficers((prev) => prev.filter((o) => o.id !== officerId));
      fetchAll();
    } catch {} finally {
      setDeactivatingId(null);
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToken) {
      setCreateError('Please verify the officer email first');
      return;
    }
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const res = await api.post<{ officer: { name: string; email: string } }>('admin/officers', { ...officerForm, emailVerificationToken: emailToken });
      setCreateSuccess(`Officer "${res.officer.name}" created successfully. Temporary password sent to their email.`);
      setOfficerForm({ name: '', email: '', phone: '', departmentId: '' });
      setEmailToken('');
      fetchAll();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create officer');
    } finally {
      setCreating(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const departmentChartData = departments.map((d) => ({
    name: d.name,
    complaints: d.totalComplaints,
    resolved: d.resolved,
  }));

  const statusDistribution = [
    { name: 'Resolved', value: stats.resolved, color: '#10b981' },
    { name: 'In Progress', value: stats.inProgress, color: '#0ea5e9' },
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
  ].filter((s) => s.value > 0);

  const slaPerformance = departments.map((d) => ({
    department: d.name,
    withinSla: d.slaCompliance,
    breached: 100 - d.slaCompliance,
  }));
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-[15px] text-muted-foreground">System-wide analytics and performance monitoring.</p>
      </div>

      {/* Overview Stats */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatsCard title="Total Complaints" value={stats.totalComplaints} icon={FileText} color="primary" />
          <StatsCard title="Active Officers" value={stats.activeOfficers} icon={Users} color="secondary" />
          <StatsCard title="SLA Breached" value={stats.breachedSla} icon={Clock} color="info" />
          <StatsCard title="SLA Compliance" value={`${stats.slaCompliance}%`} icon={CheckCircle} color="success" />
        </div>
      </section>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Department-wise Complaints */}
        <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Complaints by department chart">
          <h3 className="font-semibold mb-5">Complaints by Department</h3>
          <div className="h-[260px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                />
                <Bar dataKey="complaints" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="resolved" fill="var(--success)" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Monthly Trend */}
        <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Monthly trend chart">
          <h3 className="font-semibold mb-5">Monthly Trend</h3>
          <div className="h-[260px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                />
                <Line type="monotone" dataKey="submitted" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3.5 }} name="Submitted" />
                <Line type="monotone" dataKey="resolved" stroke="var(--success)" strokeWidth={2} dot={{ r: 3.5 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Status Distribution */}
        <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border" aria-label="Status distribution chart">
          <h3 className="font-semibold mb-5">Status Distribution</h3>
          <div className="h-[240px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* SLA Performance */}
        <section className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border lg:col-span-2" aria-label="SLA performance by department">
          <h3 className="font-semibold mb-5">SLA Performance by Department</h3>
          <div className="space-y-4">
            {slaPerformance.map((dept) => (
              <div key={dept.department}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-card-foreground font-medium">{dept.department}</span>
                  <span className={`text-[13px] font-semibold tabular-nums ${
                    dept.withinSla >= 85 ? 'text-success' : dept.withinSla >= 75 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {dept.withinSla}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={dept.withinSla} aria-valuemin={0} aria-valuemax={100} aria-label={`${dept.department} SLA compliance: ${dept.withinSla}%`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      dept.withinSla >= 85 ? 'bg-success' : dept.withinSla >= 75 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${dept.withinSla}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Insights Row */}
      <section aria-label="Quick insights">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <article className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Overdue</p>
                <p className="text-xl font-bold text-card-foreground tabular-nums">{stats.breachedSla}</p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">Complaints past SLA deadline</p>
          </article>
          <article className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Pending</p>
                <p className="text-xl font-bold text-card-foreground tabular-nums">{stats.pending}</p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">Awaiting review or assignment</p>
          </article>
          <article className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Resolved</p>
                <p className="text-xl font-bold text-card-foreground tabular-nums">{stats.resolved}</p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">Total complaints resolved</p>
          </article>
        </div>
      </section>

      {/* Officers Table */}
      <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden" aria-label="Officers performance">
        <div className="px-5 sm:px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Officers</h3>
            <div className="flex rounded-lg border border-border overflow-hidden" role="tablist">
              <button
                role="tab"
                aria-selected={!showAlumni}
                onClick={() => setShowAlumni(false)}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${!showAlumni ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                Active
              </button>
              <button
                role="tab"
                aria-selected={showAlumni}
                onClick={() => setShowAlumni(true)}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${showAlumni ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                Alumni
              </button>
            </div>
          </div>
          {!showAlumni && (
            <button
              onClick={() => { setShowCreateOfficer(!showCreateOfficer); setCreateError(''); setCreateSuccess(''); }}
              className="flex items-center gap-2 min-h-[36px] px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {showCreateOfficer ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {showCreateOfficer ? 'Cancel' : 'Add Officer'}
            </button>
          )}
        </div>

        {/* Create Officer Form */}
        {showCreateOfficer && !showAlumni && (
          <div className="px-5 sm:px-6 py-5 border-b border-border bg-muted/30">
            <form onSubmit={handleCreateOfficer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              <div>
                <label htmlFor="officer-name" className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
                <input
                  id="officer-name"
                  type="text"
                  required
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="officer-email" className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
                <input
                  id="officer-email"
                  type="email"
                  required
                  value={officerForm.email}
                  onChange={(e) => { setOfficerForm({ ...officerForm, email: e.target.value }); setEmailToken(''); }}
                  disabled={!!emailToken}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-60"
                  placeholder="officer@email.com"
                />
              </div>
              <div>
                <label htmlFor="officer-phone" className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  id="officer-phone"
                  type="tel"
                  required
                  value={officerForm.phone}
                  onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label htmlFor="officer-dept" className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Department</label>
                <select
                  id="officer-dept"
                  required
                  value={officerForm.departmentId}
                  onChange={(e) => setOfficerForm({ ...officerForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Select department...</option>
                  {deptOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Verify Email</label>
                <EmailOTPInput
                  email={officerForm.email}
                  onVerified={setEmailToken}
                  disabled={!officerForm.name || !officerForm.email || !officerForm.phone || !officerForm.departmentId}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating || !emailToken}
                  className="flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Create Officer
                </button>
              </div>
            </form>
            {createError && <p className="text-sm text-destructive mt-3" role="alert">{createError}</p>}
            {createSuccess && <p className="text-sm text-success mt-3" role="alert">{createSuccess}</p>}
          </div>
        )}

        <div className="overflow-x-auto" role="region" aria-label="Officers table" tabIndex={0}>
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">Officer</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground hidden sm:table-cell">Department</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground hidden md:table-cell">Contact</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">Assigned</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground">Resolved</th>
                {!showAlumni && <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-semibold text-foreground hidden lg:table-cell">Active Cases</th>}
                <th scope="col" className="px-5 py-3.5 text-right text-[13px] font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(showAlumni ? alumniOfficers : officers).map((officer) => (
                <tr key={officer.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-card-foreground">{officer.name}</p>
                    <p className="text-[11px] text-muted-foreground">{officer.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{officer.department}</td>
                  <td className="px-5 py-3.5 text-[12px] text-muted-foreground hidden md:table-cell">{officer.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-card-foreground tabular-nums">{officer.totalAssigned}</td>
                  <td className="px-5 py-3.5 text-sm text-card-foreground tabular-nums">{officer.resolved}</td>
                  {!showAlumni && (
                    <td className="px-5 py-3.5 text-sm hidden lg:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                        {officer.active}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-right">
                    {showAlumni ? (
                      <button
                        onClick={() => handleReactivate(officer.id)}
                        disabled={deactivatingId === officer.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg text-[12px] font-medium bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-40"
                      >
                        {deactivatingId === officer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(officer.id)}
                        disabled={deactivatingId === officer.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg text-[12px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-40"
                      >
                        {deactivatingId === officer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                        Mark Alumni
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(showAlumni ? alumniOfficers : officers).length === 0 && (
                <tr>
                  <td colSpan={showAlumni ? 6 : 7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {showAlumni ? 'No alumni officers' : 'No active officers'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
