import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageSquare,
  Users,
  Plus,
  Search,
  Settings,
  LogOut,
  Shield,
  Volume2,
  VolumeX,
  UserPlus,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { setActiveModal, toggleSound, setMobileSidebarOpen } from '../../store/slices/uiSlice';
import { ConversationList } from './ConversationList';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const { user, logoutUser } = useAuth();
  const { isConnected } = useSelector((state) => state.socket);
  const { soundEnabled, mobileSidebarOpen } = useSelector((state) => state.ui);
  const { activeConversationId } = useSelector((state) => state.conversation);
  
  const [filter, setFilter] = useState('all'); // 'all' | 'individual' | 'group'
  const [search, setSearch] = useState('');

  // On Mobile: Hide sidebar when a conversation is active unless mobileSidebarOpen drawer is toggled
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  const showSidebarOnMobile = !activeConversationId || mobileSidebarOpen;

  return (
    <>
      {/* Mobile Backdrop Overlay when Drawer is Open */}
      {mobileSidebarOpen && (
        <div
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none w-full max-w-full md:w-80 lg:w-96 flex-shrink-0 z-40 transition-all duration-300 ${
          showSidebarOnMobile ? 'block' : 'hidden md:flex'
        } ${
          mobileSidebarOpen ? 'mobile-sidebar open' : 'mobile-sidebar md:static'
        }`}
      >
        {/* Sidebar Header / Profile */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                    isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  title={isConnected ? 'Connected to Socket.IO' : 'Reconnecting...'}
                />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">{user?.username}</h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                  <span>{isConnected ? 'Online' : 'Connecting...'}</span>
                </div>
              </div>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => dispatch(toggleSound())}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { dispatch(setActiveModal('adminDashboard')); dispatch(setMobileSidebarOpen(false)); }}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
                title="Admin & Instructor Portal"
              >
                <Shield className="w-4 h-4" />
              </button>
              <button
                onClick={() => { dispatch(setActiveModal('profileSettings')); dispatch(setMobileSidebarOpen(false)); }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                title="Profile Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logoutUser}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Drawer Close Button */}
              {mobileSidebarOpen && (
                <button
                  onClick={() => dispatch(setMobileSidebarOpen(false))}
                  className="p-2 rounded-xl text-slate-400 hover:text-white md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs & Quick Action Buttons */}
        <div className="px-4 py-2 border-b border-slate-800/60 flex items-center justify-between gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('individual')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'individual' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setFilter('group')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'group' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Groups
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { dispatch(setActiveModal('userSearch')); dispatch(setMobileSidebarOpen(false)); }}
              className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl transition-all shadow"
              title="Start 1-on-1 Chat"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => { dispatch(setActiveModal('groupModal')); dispatch(setMobileSidebarOpen(false)); }}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow shadow-blue-600/20"
              title="New Group Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation List Scroll Region */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ConversationList filter={filter} search={search} />
        </div>
      </aside>
    </>
  );
};
