import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  MapPin, 
  Wrench, 
  CheckSquare, 
  Users, 
  Building2, 
  BarChart3, 
  Layers, 
  Settings, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const studentLinks = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/create-complaint', label: 'Report New Issue', icon: PlusCircle, highlight: true },
    { to: '/my-complaints', label: 'My Complaints', icon: ListOrdered },
    { to: '/map', label: 'Campus Map', icon: MapPin },
  ];

  const staffLinks = [
    { to: '/department', label: 'Staff Dashboard', icon: LayoutDashboard },
    { to: '/department/complaints', label: 'Assigned Work Orders', icon: CheckSquare },
    { to: '/map', label: 'Campus Map', icon: MapPin },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Command Center', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'All Complaints', icon: ListOrdered },
    { to: '/admin/map', label: 'Campus Map & Clusters', icon: MapPin },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Wrench },
    { to: '/admin/buildings', label: 'Campus Buildings', icon: Building2 },
    { to: '/admin/analytics', label: 'Analytics & SLA Reports', icon: BarChart3 },
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'STAFF' ? staffLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-6">
        {/* Role Identity Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Role</div>
            <div className="text-xs font-extrabold text-slate-900">{role} PORTAL</div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            role === 'ADMIN' 
              ? 'bg-purple-100 text-purple-700' 
              : role === 'STAFF' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-brand-100 text-brand-700'
          }`}>
            Active
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/department'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                  ${isActive 
                    ? 'bg-brand-50 text-brand-700 shadow-xs border border-brand-200' 
                    : item.highlight
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xs hover:opacity-95'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-white' : ''}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* AI Engine Status badge at bottom */}
      <div className="p-3 bg-gradient-to-br from-ai-50/80 to-brand-50/50 rounded-xl border border-ai-200">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-ai-600 animate-spin-slow" />
          <span className="text-xs font-bold text-ai-900">Gemini AI Active</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Multi-modal triage & automated priority detection operational.
        </p>
      </div>
    </aside>
  );
};
