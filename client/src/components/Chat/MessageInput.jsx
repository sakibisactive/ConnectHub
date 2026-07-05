import React, { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTyping } from '../../hooks/useTyping';

export const MessageInput = ({ conversationId, onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const { sendTyping, stopTyping } = useTyping(conversationId);

  const handleTextChange = (e) => {
    setText(e.target.value);
    sendTyping();
  };

  const handleSend = () => {
    if (!text.trim()) return;

    stopTyping();
    const msgText = text.trim();
    setText('');
    setShowEmoji(false);
    onSendMessage(msgText, 'text', '', '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    sendTyping();
  };

  return (
    <div className="p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md relative">

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-40 shadow-2xl rounded-2xl overflow-hidden border border-slate-800">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={320} height={380} />
        </div>
      )}

      {/* Main Clean Input Controls */}
      <div className="flex items-end gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all">
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 text-slate-400 hover:text-amber-400 transition-colors rounded-xl hover:bg-slate-900"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          rows={1}
          placeholder="Type your message..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none py-2 px-1 max-h-32"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
