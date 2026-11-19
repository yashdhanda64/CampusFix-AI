import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { PriorityBadge, StatusBadge, CategoryIcon } from '../../components/StatusBadge';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ListOrdered, 
  ArrowRight, 
  Sparkles,
  MapPin,
  Building,
  RotateCcw
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints?my_only=true');
        setComplaints(res.data);
      } catch (err) {
        console.error("Failed to load complaints:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'PENDING').length;
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-ai-300" />
              <span>Campus Facility Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-brand-100 mt-1 max-w-xl">
              Track your campus maintenance tickets or report a new issue. AI will analyze and route it automatically.
            </p>
          </div>

          <Link
            to="/create-complaint"
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-900 font-bold text-xs shadow-lg hover:bg-brand-50 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            Report New Problem
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Filed</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{total}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
            <ListOrdered className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600">Pending Review</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{pending}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-600">In Progress</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{inProgress}</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <RotateCcw className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600">Resolved</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{resolved}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Your Recent Complaints</h2>
            <p className="text-xs text-slate-500">Live timeline & tracking of issues you have submitted</p>
          </div>
          <Link
            to="/my-complaints"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
          >
            View All ({total}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading your tickets...</div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No issues reported yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Everything is smooth! If you spot an electrical, plumbing, or internet fault, report it using the button above.
              </p>
            </div>
          ) : (
            complaints.slice(0, 5).map((c) => (
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

                  <h3 className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors">
                    <Link to={`/complaints/${c.id}`}>{c.title}</Link>
                  </h3>

                  {c.ai_summary && (
                    <p className="text-xs text-slate-500 bg-ai-50/60 border border-ai-100 p-2 rounded-xl italic">
                      <span className="font-semibold text-ai-800 not-italic">AI Triage: </span>
                      {c.ai_summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white hover:border-brand-300 hover:text-brand-700 transition-all shadow-2xs"
                  >
                    View Status
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
