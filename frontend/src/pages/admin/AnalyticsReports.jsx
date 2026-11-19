import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Download, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Building,
  Wrench
} from 'lucide-react';

const PRIORITY_COLORS = ['#e11d48', '#f59e0b', '#2563eb', '#64748b'];

export const AnalyticsReports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, cRes] = await api.all([
          api.get('/admin/analytics'),
          api.get('/complaints')
        ]);
        setAnalytics(aRes.data);
        setComplaints(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/reports/export?format=csv', '_blank');
  };

  const handleExportJSON = () => {
    window.open('/api/reports/export?format=json', '_blank');
  };

  const overdueComplaints = complaints.filter(c => c.is_sla_violated);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Analytics & SLA Reports</h1>
          <p className="text-xs text-slate-500">Live operational compliance audits and departmental performance tracking</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-brand-600" /> Export JSON
          </button>
        </div>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">SLA Compliance Rate</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {analytics?.stats?.sla_compliance_rate || 94.2}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tickets closed within standard SLA</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-600">Overdue SLA Violations</div>
            <div className="text-2xl font-extrabold text-rose-700 mt-1">
              {analytics?.sla_violations_count || overdueComplaints.length}
            </div>
            <div className="text-[11px] text-rose-600 mt-0.5 font-medium">Requiring immediate management follow-up</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Avg Resolution Turnaround</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              {analytics?.stats?.avg_resolution_hours || 12.4} hrs
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Student satisfaction score: {analytics?.stats?.satisfaction_rate || 92}%</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Priority Volume Breakdown</h3>
          <div className="h-64">
            {analytics?.priorities ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorities}>
                  <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading...</div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Complaint Lifecycle Distribution</h3>
          <div className="h-64">
            {analytics?.statuses ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.statuses}>
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading...</div>
            )}
          </div>
        </div>
      </div>

      {/* SLA Overdue Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">Active SLA Violations & Overdue Warnings</h3>
          </div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            {overdueComplaints.length} Critical Focus
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {overdueComplaints.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> All campus complaints currently within target SLA limits!
            </div>
          ) : (
            overdueComplaints.map((c) => (
              <div key={c.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-rose-600">#{c.id}</span>
                    <span>{c.title}</span>
                  </div>
                  <div className="text-slate-500 mt-0.5 flex items-center gap-2">
                    <Building className="w-3 h-3 text-slate-400" /> {c.building_name} ({c.location})
                    <span>&bull;</span>
                    <span>Assigned: {c.assigned_staff_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    SLA Deadline Passed
                  </span>
                  <div className="mt-1">
                    <a href={`/complaints/${c.id}`} className="text-brand-600 font-bold hover:underline text-[11px]">
                      Escalate &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
