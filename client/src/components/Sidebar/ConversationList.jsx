import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, Check, CheckCheck, MessageSquarePlus } from 'lucide-react';
import { useConversation } from '../../hooks/useConversation';
import { formatDistanceToNow } from 'date-fns';

export const ConversationList = ({ filter, search }) => {
  const { conversations, activeConversationId, selectConversation, fetchConversations, loadingConversations } = useConversation();
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers } = useSelector((state) => state.socket);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((conv) => {
    if (filter !== 'all' && conv.type !== filter) return false;

    if (search) {
      const q = search.toLowerCase();
      if (conv.type === 'group') {
        return (conv.groupName || '').toLowerCase().includes(q);
      } else {
        const other = conv.participantDetails?.find(p => p.userId !== user?.userId);
        return (other?.username || '').toLowerCase().includes(q);
      }
    }
    return true;
  });

  if (loadingConversations && conversations.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl glass-card skeleton-shimmer">
            <div className="w-12 h-12 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="w-24 h-3 rounded bg-slate-800" />
              <div className="w-40 h-2 rounded bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <MessageSquarePlus className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-400" />
        <p className="text-xs font-medium">No conversations found</p>
        <p className="text-[11px] text-slate-600 mt-1">Start a new 1-on-1 or group chat to begin messaging.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {filteredConversations.map((conv) => {
        const isGroup = conv.type === 'group';
        const otherUser = isGroup ? null : conv.participantDetails?.find(p => p.userId !== user?.userId);
        const isActive = activeConversationId === conv.conversationId;

        const displayName = isGroup ? conv.groupName : (otherUser?.username || 'Chat');
        const displayAvatar = isGroup
          ? (conv.groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c')
          : (otherUser?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');

        // Check real-time online status from socket or user detail
        const userPresence = otherUser ? (onlineUsers[otherUser.userId] || { status: otherUser.status }) : null;
        const isOnline = userPresence?.status === 'online';

        const lastMsg = conv.lastMessage;
        const unread = conv.unreadCount || 0;

        return (
          <div
            key={conv.conversationId}
            onClick={() => selectConversation(conv.conversationId)}
            className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group border ${
              isActive
                ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md'
                : 'hover:bg-slate-800/60 border-transparent text-slate-300'
            }`}
          >
            {/* Avatar with presence */}
            <div className="relative flex-shrink-0">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all"
              />
              {!isGroup && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                />
              )}
              {isGroup && (
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 ring-2 ring-slate-900">
                  <Users className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            {/* Conversation Information */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {displayName}
                </h3>
                {lastMsg?.createdAt && (
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <p className="truncate pr-2">
                  {lastMsg ? (
                    <span>
                      {lastMsg.senderId === user?.userId ? <span className="text-blue-400">You: </span> : ''}
                      {lastMsg.text || (lastMsg.mediaUrl ? 'Attachment' : 'Message')}
                    </span>
                  ) : (
                    <span className="italic text-slate-500">No messages yet</span>
                  )}
                </p>

                {unread > 0 && (
                  <span className="flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
