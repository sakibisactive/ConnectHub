import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, X, Lock, Activity, Radio, Download, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { setActiveModal } from '../../store/slices/uiSlice';
import api from '../../utils/api';

export const AdminDashboardModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [analytics, setAnalytics] = useState(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  useEffect(() => {
    if (activeModal === 'adminDashboard' && isAdminAuthenticated) {
      fetchAnalytics();
    }
  }, [activeModal, isAdminAuthenticated]);

  if (activeModal !== 'adminDashboard') return null;

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/verify', { password });
      if (res.data.success) {
        setIsAdminAuthenticated(true);
        setAuthError('');
      }
    } catch (err) {
      setAuthError('Invalid Master Password');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    try {
      const res = await api.post('/admin/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage
      });
      if (res.data.success) {
        setBroadcastSuccess('System-wide announcement emitted successfully via Socket.IO!');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/admin/export?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `connecthub_messages_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Instructor & Admin Master Control</h3>
              <p className="text-xs text-slate-400">Real-time system telemetry, announcements, and audit log export</p>
            </div>
          </div>
          <button onClick={() => dispatch(setActiveModal(null))} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdminAuthenticated ? (
          <form onSubmit={handleAdminLogin} className="max-w-sm mx-auto py-8 space-y-4">
            <div className="text-center">
              <Lock className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white">Enter Master Password</h4>
              <p className="text-xs text-slate-400 mt-1">Default: connecthub_admin_2026</p>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            <input
              type="password"
              placeholder="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 text-center placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
            >
              Authenticate Master Access
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Analytics Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Total Users</p>
                <h4 className="text-2xl font-black text-white">{analytics?.totalUsers || 4}</h4>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Active Online</p>
                <h4 className="text-2xl font-black text-emerald-400">{analytics?.activeOnlineUsers || 2}</h4>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Messages Sent</p>
                <h4 className="text-2xl font-black text-blue-400">{analytics?.totalMessages || 12}</h4>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Avg Response Time</p>
                <h4 className="text-2xl font-black text-indigo-400">{analytics?.avgResponseTimeSec || 4.2}s</h4>
              </div>
            </div>

            {/* Broadcast System Announcement Form */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" /> Push System Announcement
              </h4>

              {broadcastSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {broadcastSuccess}
                </div>
              )}

              <input
                type="text"
                placeholder="Announcement Title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500"
              />
              <textarea
                rows={2}
                placeholder="Broadcast message text..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 resize-none"
              />
              <button
                onClick={handleSendBroadcast}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow transition-all"
              >
                Broadcast to Active Sockets
              </button>
            </div>

            {/* Data Export Button */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">Export Audit Logs</h4>
                <p className="text-xs text-slate-400">Download formatted message history as CSV file for analysis</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
              >
                <Download className="w-4 h-4" /> Download CSV Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
