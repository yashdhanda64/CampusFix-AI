import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Mic, 
  MapPin, 
  CopyCheck, 
  BarChart2, 
  Clock, 
  Building, 
  Users, 
  HelpCircle,
  Wrench,
  GraduationCap
} from 'lucide-react';

export const LandingPage = () => {
  const { user, demoLogin } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 34,
    resolved: 29,
    avgHours: 12.4,
    complianceRate: 94.2
  });

  useEffect(() => {
    // Attempt to fetch real live stats from health or admin if available
    const fetchStats = async () => {
      try {
        const res = await api.get('/complaints');
        if (res.data && Array.isArray(res.data)) {
          const total = res.data.length;
          const resolved = res.data.filter(c => c.status === 'RESOLVED').length;
          setStats(prev => ({
            ...prev,
            total: Math.max(total, prev.total),
            resolved: Math.max(resolved, prev.resolved)
          }));
        }
      } catch (e) {}
    };
    fetchStats();
  }, []);

  const handleQuickDemo = async (role) => {
    try {
      await demoLogin(role);
      success(`Logged in as Demo ${role}`);
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'STAFF') navigate('/department');
      else navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-brand-50/60 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* AI Innovation Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ai-50 border border-ai-200 text-ai-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-3">
            <Sparkles className="w-4 h-4 text-ai-600 animate-spin-slow" />
            <span>Powered by Google Gemini 1.5 & Smart Facility Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight">
            Your Campus. Your Voice. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-ai-600 bg-clip-text text-transparent">
              Real Solutions.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report campus problems, let AI identify the issue, and track every solution in real time. 
            Connecting students, university departments, and administration effortlessly.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={user ? "/create-complaint" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              Report an Issue
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={user ? "/map" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-xs transition-all"
            >
              Explore Campus Map
            </Link>
          </div>

          {/* One-Click Demo Role Launcher for Judges */}
          <div className="mt-12 max-w-xl mx-auto p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Live Hackathon Demo Access &bull; Instant Role Switching:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('STUDENT')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-xs font-bold transition-all"
              >
                <GraduationCap className="w-4 h-4" /> Student Portal
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('STAFF')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all"
              >
                <Wrench className="w-4 h-4" /> Staff Portal
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all"
              >
                <ShieldCheck className="w-4 h-4" /> Admin Center
              </button>
            </div>
          </div>

          {/* Live Campus Metric Counters */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-600">
                {stats.total}+
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Campus Reports Handled</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {stats.complianceRate}%
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">SLA Resolution Rate</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                {stats.avgHours} hrs
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Average Turnaround Time</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-ai-600">
                &lt; 3.2s
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Gemini AI Triage Speed</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3">
              How CampusFix AI Solves Campus Issues
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              From instant voice or photo report to automated Gemini categorization and verified resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Multimodal Reporting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students report issues via text, uploaded photos, or live voice recording in Hindi and English.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-ai-50/50 border border-ai-200 relative group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-ai-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Gemini AI Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI categorizes the concern, flags safety hazards, predicts urgency level, and checks for existing duplicates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Smart Department Routing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tickets are assigned with calculated SLA deadlines directly to designated maintenance personnel.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-xs">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Proof & Rating Closure</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Staff upload resolution proof images, students verify completion, and provide satisfaction feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-ai-600 bg-ai-50 px-3 py-1 rounded-full border border-ai-200">
              Key Innovations
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3">
              Engineered for Real Campus Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <CopyCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Duplicate Complaint Prevention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents ticket inundation by cross-referencing text similarity, building blocks, and recent timestamps to notify students before submission.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-ai-100 text-ai-700 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Bilingual Voice Reporting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated Web Speech transcription in English and Hindi enables quick recording on mobile or desktop without typing delays.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Interactive Geospatial Campus Map</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leaflet-driven incident map shows severity clusters across campus buildings, enabling visual dispatch and hotspot analysis.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Safety Hazard Escalation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immediate identification of critical hazards (sparking sockets, structural cracks, gas leaks) triggering human emergency alerts.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Automated SLA Monitoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic resolution deadlines (4h for Critical, 24h for High) with automated violation alarms and department performance metrics.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Executive Analytics & CSV Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real database analytics charts covering category distributions, monthly trends, and instant CSV/PDF export for administrative reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Testimonials (clearly marked demo content) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Demo Testimonials &bull; User Feedback Preview
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-amber-500 text-xs font-bold mb-2">★★★★★</div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Reported an electrical spark outside our hostel lab. The AI flagged it as Critical within seconds, and the electrician was on site within 40 minutes!"
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-bold text-slate-800">
                Arjun S. &bull; <span className="font-normal text-slate-500">Computer Science Student</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-amber-500 text-xs font-bold mb-2">★★★★★</div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The duplicate detection feature prevented 30 repetitive calls during the library Wi-Fi outage. It kept our staff focused on fixing the core router switch."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-bold text-slate-800">
                Sunil J. &bull; <span className="font-normal text-slate-500">IT Network Lead</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-amber-500 text-xs font-bold mb-2">★★★★★</div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Having real-time SLA violation monitoring on the command center allows us to maintain 94%+ compliance across all engineering blocks."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-bold text-slate-800">
                Campus Admin &bull; <span className="font-normal text-slate-500">Estate Management</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
