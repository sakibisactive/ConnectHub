import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, X, Check, Plus } from 'lucide-react';
import { setActiveModal } from '../../store/slices/uiSlice';
import { useConversation } from '../../hooks/useConversation';
import api from '../../utils/api';

export const GroupCreationModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { fetchConversations, selectConversation } = useConversation();

  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeModal !== 'groupModal') return;
    const fetchContacts = async () => {
      try {
        const res = await api.get('/users');
        if (res.data.success) {
          setAvailableUsers(res.data.users);
        }
      } catch (err) {
        console.error('Fetch users error:', err);
      }
    };
    fetchContacts();
  }, [activeModal]);

  if (activeModal !== 'groupModal') return null;

  const toggleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      setSubmitting(true);
      const res = await api.post('/conversations', {
        type: 'group',
        groupName: groupName.trim(),
        groupAvatar: groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=256',
        participants: selectedUsers
      });

      if (res.data.success) {
        await fetchConversations();
        selectConversation(res.data.conversation.conversationId);
        dispatch(setActiveModal(null));
      }
    } catch (err) {
      console.error('Create group error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Create New Group Chat</h3>
          </div>
          <button onClick={() => dispatch(setActiveModal(null))} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 🚀 ConnectHub Devs"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Avatar Image URL (Optional)</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={groupAvatar}
              onChange={(e) => setGroupAvatar(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Participants ({selectedUsers.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {availableUsers.map((u) => {
                const isSelected = selectedUsers.includes(u.userId);
                return (
                  <div
                    key={u.userId}
                    onClick={() => toggleUserSelect(u.userId)}
                    className={`p-2.5 rounded-2xl cursor-pointer border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                        alt={u.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-semibold">{u.username}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !groupName.trim() || selectedUsers.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-40"
          >
            {submitting ? 'Creating Group...' : 'Create Group Chat'}
          </button>
        </form>
      </div>
    </div>
  );
};
