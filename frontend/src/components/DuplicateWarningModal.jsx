import React from 'react';
import { AlertTriangle, ExternalLink, ArrowRight, X } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './StatusBadge';

export const DuplicateWarningModal = ({ matches, isOpen, onClose, onProceed }) => {
  if (!isOpen || !matches || matches.length === 0) return null;

  const topMatch = matches[0];
  const simPct = Math.round(topMatch.similarity_score * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-200/60 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-amber-950">
                Similar Issue Already Reported!
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {simPct}% Match
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Our AI engine detected existing reports matching your campus location and issue description.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matches List */}
        <div className="p-5 max-h-[350px] overflow-y-auto space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Matching Existing Tickets:
          </div>

          {matches.map((m) => (
            <div
              key={m.complaint_id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 line-clamp-1">
                  #{m.complaint_id}: {m.title}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                  {Math.round(m.similarity_score * 100)}% match
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={m.status} />
                <PriorityBadge priority={m.priority} />
              </div>

              <p className="text-xs text-slate-500 italic">
                Reason: {m.reason}
              </p>

              <div className="pt-1">
                <a
                  href={`/complaints/${m.complaint_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  View this ticket <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Edit
          </button>

          <button
            type="button"
            onClick={onProceed}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
          >
            Submit as New Ticket Anyway
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
