import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings, X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { setActiveModal } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';

export const ProfileSettingsModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { user, updateProfileData, deleteAccount } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [status, setStatus] = useState(user?.status || 'online');
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (activeModal !== 'profileSettings') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfileData({ username, profilePicture, status });
    setSaving(false);
    if (success) {
      dispatch(setActiveModal(null));
    }
  };

  const handleDeleteProfile = async () => {
    const success = await deleteAccount();
    if (success) {
      dispatch(setActiveModal(null));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Profile Settings</h3>
          </div>
          <button onClick={() => dispatch(setActiveModal(null))} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/30 mx-auto"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Picture URL</label>
            <input
              type="text"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Presence Status Preference</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="online">🟢 Online</option>
              <option value="away">🟡 Away</option>
              <option value="offline">⚪ Offline (Invisible)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </form>

        {/* Delete Profile Section */}
        <div className="pt-4 border-t border-slate-800">
          {!showConfirmDelete ? (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Account Permanently</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Delete Account? This cannot be undone!</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Yes, Delete & Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
