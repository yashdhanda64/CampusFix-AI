import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PriorityBadge, StatusBadge, CategoryIcon } from '../../components/StatusBadge';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Building, 
  Calendar,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStaffData = async () => {
    try {
      const [compRes, perfRes] = await api.all([
        api.get('/department/complaints'),
        api.get('/department/performance')
      ]);
      setComplaints(compRes.data);
      setPerformance(perfRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleQuickStatus = async (complaintId, targetStatus) => {
    try {
      await api.patch(`/complaints/${complaintId}/status`, {
        status: targetStatus,
        note: `Status updated to ${targetStatus} by ${user.name}`
      });
      success(`Ticket #${complaintId} marked as ${targetStatus}`);
      fetchStaffData();
    } catch (err) {
      error("Could not update status");
    }
  };

  const pendingTickets = complaints.filter(c => c.status === 'PENDING');
  const inProgressTickets = complaints.filter(c => c.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-navy-800 via-indigo-950 to-navy-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-2">
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            <span>{user?.department_name || 'Department Staff'} Workstation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Technician Dashboard: {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage open work orders, meet SLA deadlines, and submit resolution proofs.
          </p>
        </div>

        <Link
          to="/department/complaints"
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          View Full Work Queue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Department Queue</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{performance?.total_assigned || complaints.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600">Pending Acceptance</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{pendingTickets.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-600">Active Work Orders</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{inProgressTickets.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-600">SLA Violations</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{performance?.sla_violations || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Work Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Priority Work Order Queue</h2>
            <p className="text-xs text-slate-500">Unresolved complaints requiring inspection and repair</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {complaints.filter(c => c.status !== 'RESOLVED').length} Active
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading work orders...</div>
          ) : complaints.filter(c => c.status !== 'RESOLVED').length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No pending work orders in your department queue! Great work!
            </div>
          ) : (
            complaints.filter(c => c.status !== 'RESOLVED').slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">#{c.id}</span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {c.building_name} ({c.location})
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 hover:text-brand-600">
                    <Link to={`/complaints/${c.id}`}>{c.title}</Link>
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-1">{c.description}</p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(c.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors"
                    >
                      Accept & Start
                    </button>
                  )}

                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    Manage & Resolve
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
