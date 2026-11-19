import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  XCircle,
  Zap,
  Wrench,
  Sparkles,
  Wifi,
  Building,
  Armchair,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || 'Medium').toLowerCase();

  if (p === 'critical') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
        </span>
        Critical Priority
      </span>
    );
  }

  if (p === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        High Priority
      </span>
    );
  }

  if (p === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        Medium Priority
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
      Low Priority
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const s = (status || 'PENDING').toUpperCase();

  switch (s) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Pending Review
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Resolved
        </span>
      );
    case 'REOPENED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
          Reopened
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Closed / Duplicate
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {s}
        </span>
      );
  }
};

export const CategoryIcon = ({ category, className = "w-4 h-4" }) => {
  const c = (category || '').toLowerCase();
  if (c.includes('electric')) return <Zap className={`${className} text-amber-500`} />;
  if (c.includes('plumb')) return <Wrench className={`${className} text-sky-500`} />;
  if (c.includes('housekeep') || c.includes('clean')) return <Sparkles className={`${className} text-teal-500`} />;
  if (c.includes('internet') || c.includes('it')) return <Wifi className={`${className} text-indigo-500`} />;
  if (c.includes('civil')) return <Building className={`${className} text-orange-500`} />;
  if (c.includes('furnitur')) return <Armchair className={`${className} text-amber-600`} />;
  if (c.includes('secur')) return <ShieldAlert className={`${className} text-rose-500`} />;
  return <HelpCircle className={`${className} text-slate-500`} />;
};
