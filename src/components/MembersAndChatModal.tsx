import React, { useState } from 'react';
import { UserInfo, ChatMessage } from '../types';
import { X, Send, Crown, CheckCircle2, AlertCircle, MessageSquare, Users } from 'lucide-react';

interface MembersAndChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserInfo[];
  hostId: string;
  currentUserId: string;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const MembersAndChatModal: React.FC<MembersAndChatModalProps> = ({
  isOpen,
  onClose,
  users,
  hostId,
  currentUserId,
  chatMessages,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'chat'>('members');
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Top bar with tabs */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'members'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Friends in Room ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'chat'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Party Chat
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {activeTab === 'members' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Connected Devices
            </div>
            {users.map((u) => {
              const isHost = u.role === 'host' || u.id === hostId;
              const isMe = u.id === currentUserId;

              return (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isMe
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-zinc-950/60 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base">
                      {u.avatar || '🎧'}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {u.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        {isHost ? (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <Crown className="w-3 h-3" /> Host DJ
                          </span>
                        ) : (
                          <span className="text-zinc-500">Listener</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Sync status */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-medium">Synced</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-zinc-500">
                  No shoutouts yet. Say hi to everyone listening!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-zinc-800 text-xs flex items-center justify-center shrink-0">
                      {msg.avatar || '🎵'}
                    </span>
                    <div className="bg-zinc-800/70 border border-zinc-700/60 rounded-xl px-3 py-1.5 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-zinc-200">
                          {msg.userName}
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 break-words">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2">
              <input
                type="text"
                placeholder="Say something to the jam..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={120}
                className="flex-1 bg-zinc-900 border border-zinc-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-zinc-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
