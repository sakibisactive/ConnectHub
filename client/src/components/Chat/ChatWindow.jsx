import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Users,
  Info,
  Check,
  CheckCheck,
  Smile,
  X,
  MessageSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useConversation } from '../../hooks/useConversation';
import { setActiveModal } from '../../store/slices/uiSlice';
import { toggleSearchInChat, setSearchInChatQuery } from '../../store/slices/conversationSlice';
import { MessageInput } from './MessageInput';
import { MessageReaction } from './MessageReaction';
import api from '../../utils/api';
import { format } from 'date-fns';

export const ChatWindow = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversationId, messages, sendMessage, markMessageAsRead } = useConversation();
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers, typingUsers } = useSelector((state) => state.socket);
  const { searchInChatQuery, showSearchInChat } = useSelector((state) => state.conversation);

  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const messagesEndRef = useRef(null);

  const currentConv = conversations.find((c) => c.conversationId === activeConversationId);
  const convMessages = messages[activeConversationId] || [];

  const isGroup = currentConv?.type === 'group';
  const otherUser = isGroup ? null : currentConv?.participantDetails?.find((p) => p.userId !== user?.userId);

  const displayName = isGroup ? currentConv?.groupName : (otherUser?.username || 'Conversation');
  const displayAvatar = isGroup
    ? (currentConv?.groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c')
    : (otherUser?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');

  const userPresence = otherUser ? (onlineUsers[otherUser.userId] || { status: otherUser.status }) : null;
  const isOnline = userPresence?.status === 'online';

  const currentTypingUsers = typingUsers[activeConversationId] || [];
  const isOthersTyping = currentTypingUsers.filter((id) => id !== user?.userId).length > 0;

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages, isOthersTyping]);

  // Mark latest unread messages as read
  useEffect(() => {
    if (activeConversationId && convMessages.length > 0) {
      const unreadMsgs = convMessages.filter(
        (m) => m.senderId !== user?.userId && m.status !== 'read'
      );
      unreadMsgs.forEach((m) => {
        markMessageAsRead(m.messageId, activeConversationId);
      });
    }
  }, [activeConversationId, convMessages.length, markMessageAsRead, user?.userId]);

  const handleReact = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/react`, { emoji });
    } catch (e) {
      console.error('React error:', e);
    }
  };

  if (!activeConversationId || !currentConv) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-2xl">
          <MessageSquare className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Welcome to ConnectHub</h3>
        <p className="text-slate-400 text-sm max-w-sm">
          Select a contact or group from the sidebar to launch real-time WebSocket messaging.
        </p>
      </div>
    );
  }

  // Filter messages if search in chat query is present
  const filteredMessages = convMessages.filter((m) => {
    if (!searchInChatQuery) return true;
    return (m.text || '').toLowerCase().includes(searchInChatQuery.toLowerCase());
  });

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            {!isGroup && (
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{displayName}</span>
              {isGroup && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {currentConv.participants?.length || 0} Members
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              {isOthersTyping ? (
                <span className="text-blue-400 font-medium animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> User is typing...
                </span>
              ) : isGroup ? (
                <span>Group Chat</span>
              ) : (
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch(toggleSearchInChat())}
            className={`p-2 rounded-xl transition-all ${
              showSearchInChat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Find in Chat"
          >
            <Search className="w-4 h-4" />
          </button>
          {isGroup && (
            <button
              onClick={() => dispatch(setActiveModal('groupInfo'))}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              title="Group Information"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Find in Chat Banner */}
      {showSearchInChat && (
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 animate-slide-up z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search terms in this conversation..."
              value={searchInChatQuery}
              onChange={(e) => dispatch(setSearchInChatQuery(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => dispatch(toggleSearchInChat(false))}
            className="p-2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No messages found. Send a message to start the conversation!
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMe = msg.senderId === user?.userId;
            const senderDetail = isGroup ? currentConv.participantDetails?.find((p) => p.userId === msg.senderId) : null;
            const isHovered = hoveredMsgId === msg.messageId;

            return (
              <div
                key={msg.messageId || idx}
                onMouseEnter={() => setHoveredMsgId(msg.messageId)}
                onMouseLeave={() => setHoveredMsgId(null)}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
              >
                {/* Sender Name in Group */}
                {isGroup && !isMe && (
                  <span className="text-[10px] text-slate-400 mb-1 font-medium ml-1">
                    {senderDetail?.username || 'Member'}
                  </span>
                )}

                <div className="flex items-end gap-2 max-w-[80%] md:max-w-[70%]">
                  {!isMe && isGroup && (
                    <img
                      src={senderDetail?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover mb-1 ring-1 ring-slate-700"
                    />
                  )}

                  {/* Reaction Popover Trigger */}
                  {isHovered && (
                    <div className={`absolute -top-7 ${isMe ? 'right-2' : 'left-2'}`}>
                      <MessageReaction
                        reactions={msg.reactions}
                        onReact={(emoji) => handleReact(msg.messageId, emoji)}
                      />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl shadow-md text-sm relative ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {/* Media attachments */}
                    {msg.mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden">
                        {msg.messageType === 'image' || msg.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={msg.mediaUrl} alt="Attachment" className="max-h-60 rounded-xl object-cover" />
                        ) : (
                          <a
                            href={msg.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-300 underline font-medium block p-2 bg-slate-800/60 rounded-xl"
                          >
                            📎 {msg.fileName || 'Download Attachment'}
                          </a>
                        )}
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Reactions Display Badges */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
                        {msg.reactions.map((r, i) => (
                          <span
                            key={i}
                            className="bg-slate-950/60 text-[11px] px-2 py-0.5 rounded-full border border-white/10"
                          >
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Timestamp & Status Icon */}
                    <div className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                      <span>{format(new Date(msg.createdAt || Date.now()), 'HH:mm')}</span>
                      {isMe && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300" title="Read (Blue Double Check)" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-200" title="Delivered" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-blue-200" title="Sent" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Control Component */}
      <MessageInput
        conversationId={activeConversationId}
        onSendMessage={(t, type, url, file) => sendMessage(activeConversationId, t, type, url, file)}
      />
    </div>
  );
};
