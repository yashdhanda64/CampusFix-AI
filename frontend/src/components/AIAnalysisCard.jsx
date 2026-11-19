import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle, Brain, ArrowRight, Zap } from 'lucide-react';
import { PriorityBadge, CategoryIcon } from './StatusBadge';

export const AIAnalysisCard = ({ analysis, compact = false }) => {
  if (!analysis) return null;

  const confidencePct = Math.round((analysis.confidence || 0.92) * 100);
  const isCritical = analysis.predicted_priority === 'Critical';

  if (compact) {
    return (
      <div className="p-3 bg-gradient-to-br from-ai-50 via-white to-brand-50 border border-ai-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ai-700">
            <Sparkles className="w-3.5 h-3.5 text-ai-600 animate-spin-slow" />
            AI Assessment
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            {confidencePct}% Confidence
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={analysis.predicted_priority} />
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            <CategoryIcon category={analysis.predicted_category} />
            {analysis.predicted_category}
          </span>
        </div>
        {analysis.summary && (
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {analysis.summary}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ai-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-ai-600 via-indigo-600 to-brand-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm tracking-wide">Gemini AI Analysis & Diagnostic</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {analysis.model_version || 'Gemini 1.5'}
                </span>
              </div>
              <p className="text-xs text-ai-100">Automated multi-modal triage and routing engine</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-medium text-ai-100">Confidence</div>
            <div className="text-base font-bold text-white">{confidencePct}%</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Safety Alert Banner if critical */}
        {analysis.safety_concerns && (
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isCritical 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block mb-0.5">Safety & Hazard Review:</span>
              {analysis.safety_concerns}
            </div>
          </div>
        )}

        {/* Prediction Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Assigned Category & Routing
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                <CategoryIcon category={analysis.predicted_category} className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{analysis.predicted_category}</div>
                <div className="text-xs text-slate-500">{analysis.suggested_department || 'Facilities'}</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Predicted Priority Level
            </div>
            <div className="flex items-center gap-2 mt-1">
              <PriorityBadge priority={analysis.predicted_priority} />
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {analysis.summary && (
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Issue Summary:</div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {analysis.summary}
            </p>
          </div>
        )}

        {/* Recommended Actions */}
        {analysis.recommended_actions && (
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Recommended Resolution Protocol:
            </div>
            <div className="text-xs text-slate-600 bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl leading-relaxed">
              {analysis.recommended_actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
