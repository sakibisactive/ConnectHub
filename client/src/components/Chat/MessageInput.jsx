import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, MicOff, X, RotateCcw, Volume2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTyping } from '../../hooks/useTyping';
import { soundManager } from '../../utils/sound';

export const MessageInput = ({ conversationId, onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [messageType, setMessageType] = useState('text');
  
  // Real Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Undo Send state
  const [undoMessage, setUndoMessage] = useState(null);
  const undoTimerRef = useRef(null);

  const { sendTyping, stopTyping } = useTyping(conversationId);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);
    sendTyping();
  };

  const handleSend = () => {
    if (!text.trim() && !mediaUrl) return;

    stopTyping();
    const msgData = {
      text: text.trim() || (messageType === 'audio' ? '🎙️ Voice Note' : ''),
      mediaUrl,
      fileName,
      messageType: messageType !== 'text' ? messageType : (mediaUrl ? (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file') : 'text')
    };

    // 4-second Undo Send window
    setUndoMessage(msgData);
    setText('');
    setMediaUrl('');
    setFileName('');
    setMessageType('text');
    setShowEmoji(false);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    undoTimerRef.current = setTimeout(() => {
      onSendMessage(msgData.text, msgData.messageType, msgData.mediaUrl, msgData.fileName);
      setUndoMessage(null);
    }, 4000);
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
      setMessageType(undoMessage.messageType);
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
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaUrl(event.target.result);
        if (file.type.startsWith('audio/')) {
          setMessageType('audio');
        } else if (file.type.startsWith('image/')) {
          setMessageType('image');
        } else {
          setMessageType('file');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Real Microphone Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          setMediaUrl(base64Audio);
          setFileName(`voice_note_${Date.now()}.webm`);
          setMessageType('audio');
          setText(`🎙️ Voice Note (${recordingSeconds}s)`);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      soundManager.playNotificationSound();

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Microphone access is required to record voice notes. Please grant microphone permission in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
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

      {/* Voice Note Recording Overlay Banner */}
      {isRecording && (
        <div className="mb-3 p-3 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-300">Recording Voice Note...</span>
            <span className="text-xs font-mono text-rose-200 bg-rose-900/60 px-2 py-0.5 rounded-md">
              00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow"
          >
            <MicOff className="w-3.5 h-3.5" /> Stop Recording
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {mediaUrl && !isRecording && (
        <div className="mb-3 p-2 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between max-w-sm">
          <div className="flex items-center gap-2 truncate">
            {messageType === 'audio' ? (
              <div className="flex items-center gap-2 text-amber-400">
                <Volume2 className="w-5 h-5" />
                <span className="text-xs font-semibold text-amber-300">Voice Note Ready</span>
              </div>
            ) : fileName.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={mediaUrl} alt="preview" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <Paperclip className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-xs text-slate-200 truncate">{fileName || 'Attached Media'}</span>
          </div>
          <button onClick={() => { setMediaUrl(''); setFileName(''); setMessageType('text'); }} className="p-1 text-slate-400 hover:text-slate-200">
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

        <label className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-xl hover:bg-slate-900 cursor-pointer" title="Attach File/Image/Audio">
          <Paperclip className="w-5 h-5" />
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 transition-colors rounded-xl hover:bg-slate-900 ${
            isRecording ? 'text-rose-500 animate-pulse bg-rose-500/10' : 'text-slate-400 hover:text-rose-400'
          }`}
          title={isRecording ? "Stop Recording" : "Record Voice Note"}
        >
          {isRecording ? <MicOff className="w-5 h-5 text-rose-500" /> : <Mic className="w-5 h-5" />}
        </button>

        <textarea
          rows={1}
          placeholder={isRecording ? "Recording voice note..." : "Type your message..."}
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
