import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, Mic, X, RotateCcw } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTyping } from '../../hooks/useTyping';
import { soundManager } from '../../utils/sound';

export const MessageInput = ({ conversationId, onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [undoMessage, setUndoMessage] = useState(null);
  const undoTimerRef = useRef(null);

  const { sendTyping, stopTyping } = useTyping(conversationId);

  const handleTextChange = (e) => {
    setText(e.target.value);
    sendTyping();
  };

  const handleSend = () => {
    if (!text.trim() && !mediaUrl) return;

    stopTyping();
    const msgData = {
      text: text.trim(),
      mediaUrl,
      fileName,
      messageType: mediaUrl ? (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file') : 'text'
    };

    // 5-second Undo Send feature setup
    setUndoMessage(msgData);
    setText('');
    setMediaUrl('');
    setFileName('');
    setShowEmoji(false);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    undoTimerRef.current = setTimeout(() => {
      onSendMessage(msgData.text, msgData.messageType, msgData.mediaUrl, msgData.fileName);
      setUndoMessage(null);
    }, 4000); // 4 seconds window to undo send
  };

  const cancelUndoAndSendNow = () => {
    if (undoMessage) {
      clearTimeout(undoTimerRef.current);
      onSendMessage(undoMessage.text, undoMessage.messageType, undoMessage.mediaUrl, undoMessage.fileName);
      setUndoMessage(null);
    }
  };

  const handleUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoMessage) {
      setText(undoMessage.text);
      setMediaUrl(undoMessage.mediaUrl);
      setFileName(undoMessage.fileName);
      setUndoMessage(null);
    }
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      // Simulate object URL preview
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      soundManager.playNotificationSound();
      setTimeout(() => {
        setIsRecording(false);
        setText('🎙️ [Voice Note: 0:04]');
      }, 3000);
    }
  };

  return (
    <div className="p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md relative">
      {/* Undo Send Banner */}
      {undoMessage && (
        <div className="absolute -top-14 left-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between z-30 animate-slide-up">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            <span>Sending in 4s...</span>
            <span className="opacity-80 italic max-w-xs truncate">"{undoMessage.text || 'Attachment'}"</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="px-3 py-1 bg-slate-900/60 hover:bg-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              onClick={cancelUndoAndSendNow}
              className="px-3 py-1 bg-white text-blue-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all"
            >
              Send Now
            </button>
          </div>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {mediaUrl && (
        <div className="mb-3 p-2 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between max-w-sm">
          <div className="flex items-center gap-2 truncate">
            {fileName.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={mediaUrl} alt="preview" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <Paperclip className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-xs text-slate-200 truncate">{fileName || 'Attached Media'}</span>
          </div>
          <button onClick={() => { setMediaUrl(''); setFileName(''); }} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-40 shadow-2xl rounded-2xl overflow-hidden border border-slate-800">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={320} height={380} />
        </div>
      )}

      {/* Main Input Controls */}
      <div className="flex items-end gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all">
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 text-slate-400 hover:text-amber-400 transition-colors rounded-xl hover:bg-slate-900"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <label className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-xl hover:bg-slate-900 cursor-pointer" title="Attach File/Image">
          <Paperclip className="w-5 h-5" />
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>

        <button
          type="button"
          onClick={toggleVoiceRecording}
          className={`p-2 transition-colors rounded-xl hover:bg-slate-900 ${
            isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-rose-400'
          }`}
          title="Voice Note"
        >
          <Mic className="w-5 h-5" />
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
          disabled={!text.trim() && !mediaUrl}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
