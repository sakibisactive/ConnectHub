import React from 'react';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageReaction = ({ reactions = [], onReact }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-full px-2 py-1 shadow-xl animate-fade-in z-20">
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onReact(emoji);
          }}
          className="hover:scale-125 transition-transform p-1 text-sm rounded-full hover:bg-slate-800"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
