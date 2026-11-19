import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AppLayout = () => {
  const { user } = useAuth();
  const { info, warning } = useToast();
  const location = useLocation();

  const isPublicLanding = location.pathname === '/' && !user;

  // Real-time WebSocket connection for live campus updates
  useEffect(() => {
    if (!user) return;

    let ws = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?user_id=${user.id}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'NEW_COMPLAINT') {
            if (data.priority === 'Critical') {
              warning(`CRITICAL ALERT: New incident #${data.complaint_id} reported at ${data.building}!`);
            } else {
              info(`New issue reported: "${data.title}" (${data.category})`);
            }
          } else if (data.event === 'STATUS_UPDATED') {
            info(`Ticket #${data.complaint_id} status updated to ${data.status}`);
          }
        } catch (e) {}
      };
    } catch (err) {
      console.warn("WebSocket connection skipped or unhandled:", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex w-full">
        {user && <Sidebar />}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full ${isPublicLanding ? 'p-0 sm:p-0 lg:p-0' : ''}`}>
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};
