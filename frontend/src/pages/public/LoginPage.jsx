import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, Wrench, GraduationCap, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const userData = await login(email, password);
      success(`Welcome back, ${userData.name}!`);
      if (userData.role === 'ADMIN') navigate('/admin');
      else if (userData.role === 'STAFF') navigate('/department');
      else navigate('/dashboard');
    } catch (err) {
      error(err.response?.data?.detail || "Invalid login credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setIsLoading(true);
    try {
      const userData = await demoLogin(role);
      success(`Logged in as ${role}: ${userData.name}`);
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'STAFF') navigate('/department');
      else navigate('/dashboard');
    } catch (err) {
      error("Demo login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-ai-600 text-white shadow-md shadow-brand-500/20 mb-2">
            <Sparkles className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to CampusFix AI</h2>
          <p className="text-xs text-slate-500">Access campus facility management & ticket resolution</p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campusfix.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* One-Click Demo Fast Track for Judges */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Judge Demo Login
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('STUDENT')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-brand-200 bg-brand-50/70 hover:bg-brand-100 text-brand-800 transition-all text-center group"
              >
                <GraduationCap className="w-4 h-4 mb-1 text-brand-600 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('STAFF')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 transition-all text-center group"
              >
                <Wrench className="w-4 h-4 mb-1 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Staff Lead</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('ADMIN')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 transition-all text-center group"
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-500">
          New to CampusFix AI?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
            Register Student Account
          </Link>
        </p>
      </div>
    </div>
  );
};
