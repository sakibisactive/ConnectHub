import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, X, Shield, Crown, LogOut } from 'lucide-react';
import { setActiveModal } from '../../store/slices/uiSlice';

export const GroupInfoPanel = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { conversations, activeConversationId } = useSelector((state) => state.conversation);
  const { user } = useSelector((state) => state.auth);

  if (activeModal !== 'groupInfo') return null;

  const currentConv = conversations.find(c => c.conversationId === activeConversationId);
  if (!currentConv || currentConv.type !== 'group') return null;

  const isAdmin = currentConv.groupAdmin === user?.userId;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl animate-slide-up">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Group Information
            </h3>
            <button onClick={() => dispatch(setActiveModal(null))} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Group Header info */}
          <div className="text-center mb-6">
            <img
              src={currentConv.groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c'}
              alt={currentConv.groupName}
              className="w-20 h-20 rounded-3xl object-cover mx-auto mb-3 ring-4 ring-indigo-500/20"
            />
            <h4 className="text-lg font-bold text-white">{currentConv.groupName}</h4>
            <p className="text-xs text-slate-400 mt-1">{currentConv.participants?.length || 0} Participants</p>
          </div>

          {/* Members List */}
          <div>
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Group Members</h5>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {currentConv.participantDetails?.map((m) => (
                <div key={m.userId} className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                      alt={m.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-200">{m.username}</span>
                      {m.userId === currentConv.groupAdmin && (
                        <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded flex-inline items-center gap-1">
                          <Crown className="w-3 h-3 inline" /> Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Group Action */}
        <button
          onClick={() => dispatch(setActiveModal(null))}
          className="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold rounded-2xl border border-rose-500/30 flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" /> Leave Group
        </button>
      </div>
    </div>
  );
};
