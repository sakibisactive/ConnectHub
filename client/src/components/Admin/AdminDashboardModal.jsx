import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, X, Radio, Download, CheckCircle2, AlertOctagon, Trash2, MessageSquare, Users, Eye } from 'lucide-react';
import { setActiveModal } from '../../store/slices/uiSlice';
import api from '../../utils/api';
import { format } from 'date-fns';

export const AdminDashboardModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const [analytics, setAnalytics] = useState(null);
  const [userList, setUserList] = useState([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Pairwise Inspection Drawer state
  const [activePair, setActivePair] = useState(null); // { u1, u2 }
  const [pairMessages, setPairMessages] = useState([]);
  const [loadingPairMessages, setLoadingPairMessages] = useState(false);

  const isAdmin = user && (user.role === 'admin' || user.userId === 'usr_admin' || user.email === 'admin@connecthub.com');

  useEffect(() => {
    if (activeModal === 'adminDashboard' && isAdmin) {
      fetchAnalyticsAndUsers();
    }
  }, [activeModal, isAdmin]);

  if (activeModal !== 'adminDashboard') return null;

  const fetchAnalyticsAndUsers = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
        setUserList(res.data.users || []);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      setDeletingUserId(userId);
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        setUserList((prev) => prev.filter((u) => u.userId !== userId));
      }
    } catch (err) {
      console.error('Delete user error:', err);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleInspectPair = async (u1, u2) => {
    try {
      setActivePair({ u1, u2 });
      setLoadingPairMessages(true);
      const res = await api.get(`/admin/conversations/pair?user1Id=${u1.userId}&user2Id=${u2.userId}`);
      if (res.data.success) {
        setPairMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Inspect pair error:', err);
    } finally {
      setLoadingPairMessages(false);
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
        setBroadcastSuccess('System-wide announcement emitted successfully!');
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

  // Generate all 2-user combinations (X, Y) from userList
  const generatePairBlocks = () => {
    const pairs = [];
    for (let i = 0; i < userList.length; i++) {
      for (let j = i + 1; j < userList.length; j++) {
        pairs.push({
          u1: userList[i],
          u2: userList[j]
        });
      }
    }
    return pairs;
  };

  const userPairs = generatePairBlocks();

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>ConnectHub System Admin Dashboard</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                  MASTER ROLE
                </span>
              </h3>
              <p className="text-xs text-slate-400">Manage all registered users and inspect pairwise message blocks</p>
            </div>
          </div>
          <button onClick={() => dispatch(setActiveModal(null))} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdmin ? (
          <div className="py-12 text-center space-y-3">
            <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
            <h4 className="text-base font-bold text-white">Access Denied</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Only system administrators logged in with dedicated admin credentials can access this panel.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analytics Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Total Users</p>
                <h4 className="text-2xl font-black text-white">{analytics?.totalUsers || userList.length}</h4>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Active Online</p>
                <h4 className="text-2xl font-black text-emerald-400">{analytics?.activeOnlineUsers || 0}</h4>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Total Pair Blocks</p>
                <h4 className="text-2xl font-black text-indigo-400">{userPairs.length}</h4>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Messages Sent</p>
                <h4 className="text-2xl font-black text-blue-400">{analytics?.totalMessages || 0}</h4>
              </div>
            </div>

            {/* 1. User Management List Table */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> User Directory ({userList.length})
                </h4>
                <span className="text-[11px] text-slate-400">Admin can delete any user</span>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
                {userList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No registered users found.</div>
                ) : (
                  userList.map((u) => (
                    <div key={u.userId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                            alt={u.username}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                          />
                          <div
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                              u.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">@{u.username}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteUser(u.userId, u.username)}
                        disabled={deletingUserId === u.userId}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 text-[11px] font-semibold flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete User
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Pairwise Conversation Blocks Grid (X,Y Pairwise Chat Inspector) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> User Pair Chat Blocks ({userPairs.length})
                </h4>
                <span className="text-[11px] text-slate-400">Click any pair block to inspect chat history</span>
              </div>

              {userPairs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Requires at least 2 registered users to form pairwise chat inspection blocks.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
                  {userPairs.map((pair, idx) => {
                    const isSelected = activePair?.u1.userId === pair.u1.userId && activePair?.u2.userId === pair.u2.userId;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleInspectPair(pair.u1, pair.u2)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                            : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            Pair ({idx + 1})
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Inspect
                          </span>
                        </div>

                        {/* Pair Avatars & User Names */}
                        <div className="flex items-center justify-center gap-2 py-1">
                          <div className="flex flex-col items-center">
                            <img
                              src={pair.u1.profilePicture}
                              alt={pair.u1.username}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700 mb-1"
                            />
                            <span className="text-xs font-semibold text-slate-200 truncate max-w-[80px]">
                              @{pair.u1.username}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-slate-500">↔</span>

                          <div className="flex flex-col items-center">
                            <img
                              src={pair.u2.profilePicture}
                              alt={pair.u2.username}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700 mb-1"
                            />
                            <span className="text-xs font-semibold text-slate-200 truncate max-w-[80px]">
                              @{pair.u2.username}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-center font-medium text-indigo-300 pt-1 border-t border-slate-800">
                          Click to View Chat History
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pair Chat Inspector Modal Overlay */}
            {activePair && (
              <div className="p-4 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-3 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-indigo-300">
                      Chat Audit Log: @{activePair.u1.username} ↔ @{activePair.u2.username}
                    </h4>
                  </div>
                  <button onClick={() => setActivePair(null)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {loadingPairMessages ? (
                    <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Loading pair messages...</div>
                  ) : pairMessages.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No chat messages exchanged between @{activePair.u1.username} and @{activePair.u2.username} yet.
                    </div>
                  ) : (
                    pairMessages.map((m, i) => {
                      const sender = m.senderId === activePair.u1.userId ? activePair.u1 : activePair.u2;

                      return (
                        <div key={i} className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-blue-400">@{sender.username}</span>
                            <span>{format(new Date(m.createdAt || Date.now()), 'HH:mm dd MMM')}</span>
                          </div>
                          <p className="text-slate-200">{m.text}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

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
