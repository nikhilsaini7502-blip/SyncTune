import React from 'react';
import { ReactionEvent } from '../types';

interface ReactionsOverlayProps {
  reactions: ReactionEvent[];
  onSendReaction: (emoji: string) => void;
}

const PARTY_EMOJIS = ['🔥', '❤️', '🎵', '🕺', '👏', '🎉', '⚡', '💃'];

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({
  reactions,
  onSendReaction,
}) => {
  return (
    <>
      {/* Floating Reactions in 3D Space */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-20 flex flex-col items-center animate-[floatUp_3s_ease-out_forwards]"
            style={{ left: `${r.x}%` }}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none transform hover:scale-125 transition">
              {r.emoji}
            </span>
            <span className="text-[10px] bg-black/60 backdrop-blur-sm text-zinc-300 px-1.5 py-0.5 rounded-full mt-0.5 border border-white/10 select-none">
              {r.userName}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Reaction Bar at bottom right/center */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-full shadow-2xl">
        <span className="text-[10px] uppercase font-bold text-zinc-500 pl-2 pr-1 hidden sm:inline select-none">
          React
        </span>
        {PARTY_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-zinc-800 flex items-center justify-center text-lg sm:text-xl transition active:scale-125"
            aria-label={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
