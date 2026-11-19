import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PriorityBadge, StatusBadge, CategoryIcon } from '../../components/StatusBadge';
import { CampusMap } from '../../components/CampusMap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  ShieldCheck, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Download, 
  ArrowRight,
  Building,
  Wrench,
  Users
} from 'lucide-react';

const PRIORITY_COLORS = {
  Critical: '#e11d48',
  High: '#f59e0b',
  Medium: '#2563eb',
  Low: '#64748b'
};

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1', '#eab308', '#64748b'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, analyticsRes, compRes, bldRes] = await api.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics'),
          api.get('/complaints'),
          api.get('/buildings')
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
        setRecentComplaints(compRes.data);
        setBuildings(bldRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/reports/export?format=csv', '_blank');
  };

  const openComplaints = (stats?.pending_complaints || 0) + (stats?.in_progress_complaints || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Command Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Central Administration Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Operations & AI Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time monitoring of campus infrastructure, automated AI categorization, SLA compliance, and cross-department workloads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Manage All Tickets
          </Link>
        </div>
      </div>

      {/* KPI Command Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Incidents</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_complaints || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged campus-wide</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-600">Active / Open</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{openComplaints}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">{stats?.pending_complaints || 0} awaiting triage</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 flex items-center justify-between">
            Critical Severity
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{stats?.critical_complaints || 0}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">Immediate hazard check</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600">Resolved Rate</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.resolved_complaints || 0}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">{stats?.sla_compliance_rate || 94.2}% within SLA</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-indigo-600">Avg Resolution Turnaround</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.avg_resolution_hours || 12.4} hrs</div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">{stats?.satisfaction_rate || 92}% student rating</div>
        </div>
      </div>

      {/* Interactive Campus Map Component */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Campus Facility Incident Heatmap</h2>
          <span className="text-xs text-slate-500 font-medium">Real-time geospatial marker distribution</span>
        </div>
        <CampusMap complaints={recentComplaints} buildings={buildings} height="420px" />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Complaints by Category</h3>
              <p className="text-xs text-slate-500">Facility distribution across university departments</p>
            </div>
          </div>

          <div className="h-64">
            {analytics?.categories && analytics.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categories}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Incident & Resolution Trends</h3>
              <p className="text-xs text-slate-500">Volume tracking across academic sessions</p>
            </div>
          </div>

          <div className="h-64">
            {analytics?.monthly_trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthly_trends}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="complaints" stroke="#6366f1" fill="#ede9fe" name="Logged" />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#d1fae5" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>
      </div>

      {/* Department SLA & Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department SLA & Resolution Performance</h3>
            <p className="text-xs text-slate-500">Response efficiency and compliance breakdown</p>
          </div>
          <Link to="/admin/analytics" className="text-xs font-bold text-brand-600 hover:underline">
            Detailed SLA Audit &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Assigned Work</th>
                <th className="px-5 py-3">Resolved</th>
                <th className="px-5 py-3">Pending</th>
                <th className="px-5 py-3">Avg Turnaround</th>
                <th className="px-5 py-3">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {analytics?.department_performance?.map((dp) => (
                <tr key={dp.department_id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    {dp.department_name}
                  </td>
                  <td className="px-5 py-3.5">{dp.total_assigned}</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-bold">{dp.resolved}</td>
                  <td className="px-5 py-3.5 text-amber-600">{dp.pending}</td>
                  <td className="px-5 py-3.5">{dp.avg_hours} hrs</td>
                  <td className="px-5 py-3.5">
                    {dp.sla_violations > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                        <AlertTriangle className="w-3 h-3" /> {dp.sla_violations} Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        <CheckCircle2 className="w-3 h-3" /> 100% Compliant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
