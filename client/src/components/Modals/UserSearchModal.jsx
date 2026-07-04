import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, UserPlus, MessageSquare, Mail } from 'lucide-react';
import { setActiveModal } from '../../store/slices/uiSlice';
import { useConversation } from '../../hooks/useConversation';
import api from '../../utils/api';

export const UserSearchModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { selectConversation, fetchConversations } = useConversation();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeModal !== 'userSearch') return;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users?search=${encodeURIComponent(search)}`);
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error('User search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, activeModal]);

  if (activeModal !== 'userSearch') return null;

  const handleStartChat = async (targetUserId) => {
    try {
      const res = await api.post('/conversations', {
        participants: [targetUserId],
        type: 'individual'
      });
      if (res.data.success) {
        await fetchConversations();
        selectConversation(res.data.conversation.conversationId);
        dispatch(setActiveModal(null));
      }
    } catch (err) {
      console.error('Start chat error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Find People</h3>
          </div>
          <button onClick={() => dispatch(setActiveModal(null))} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email address or username (e.g. sarah@connecthub.com)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Searching contacts...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No users found</div>
          ) : (
            users.map((u) => (
              <div
                key={u.userId}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-2xl border border-slate-800/60 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">@{u.username}</h4>
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {u.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartChat(u.userId)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
