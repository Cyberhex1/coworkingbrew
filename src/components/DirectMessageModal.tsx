import React, { useState, useEffect, useRef } from 'react';
import { RoomPeer } from '../types';
import { DirectMessage } from '../firebase';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Heart,
  Coffee,
  CheckCheck,
  Smile,
  Bot,
  User as UserIcon,
  Circle,
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPeer: RoomPeer | null;
  currentUserId: string;
  currentUserName: string;
  messages: DirectMessage[];
  onSendMessage: (targetUserId: string, targetUserName: string, text: string) => Promise<void>;
  friendsList: { id: string; name: string; avatarUrl?: string }[];
  onSelectFriendChat: (peerId: string) => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  targetPeer,
  currentUserId,
  currentUserName,
  messages,
  onSendMessage,
  friendsList,
  onSelectFriendChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(
    (m) =>
      targetPeer &&
      ((m.senderId === currentUserId && m.recipientId === targetPeer.id) ||
        (m.senderId === targetPeer.id && m.recipientId === currentUserId))
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length, isOpen]);

  if (!isOpen || !targetPeer) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);
    soundEngine.playChime('chime');

    try {
      await onSendMessage(targetPeer.id, targetPeer.name, textToSend);
    } catch (err) {
      console.error('Failed to send DM:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl h-[560px] bg-[#141024] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Top Header Bar */}
        <div className="bg-[#1b1532] border-b border-purple-800/40 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-900/70 border border-pink-400/50 flex items-center justify-center text-xl shadow relative">
              {targetPeer.avatar?.mouthStyle === 'tea' ? '🍵' : '💬'}
              <Circle className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400 absolute -bottom-0.5 -right-0.5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{targetPeer.name}</h3>
                {!targetPeer.isUser && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-[9px] font-mono text-purple-300">
                    BOT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-purple-300/80 flex items-center gap-2">
                <span>Desk #{targetPeer.deskIndex}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">Active Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-purple-900/50 hover:bg-rose-900/50 text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#0e0b1c]/80">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-2xl text-pink-300">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">Direct Message with {targetPeer.name}</h4>
              <p className="text-xs text-purple-300/80 max-w-xs">
                Say hello, discuss study tasks, or share motivational vibes together!
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setInputText('Hey! How is your study session going? ☕');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-xs text-purple-200 border border-purple-700/50 transition-colors"
                >
                  "Hey! How is study session going? ☕"
                </button>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="text-[10px] text-purple-400/80 mb-1 px-1 font-mono">
                    {isMine ? 'You' : msg.senderName} • {timeStr}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed ${
                      isMine
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-xs'
                        : 'bg-[#1f1938] border border-purple-700/40 text-purple-100 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Box */}
        <form onSubmit={handleSend} className="p-3 bg-[#17122b] border-t border-purple-800/40 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Private message to ${targetPeer.name}...`}
            className="flex-1 bg-[#0f0c1b] border border-purple-700/50 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-purple-400/60 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition-transform active:scale-95 disabled:opacity-40 flex items-center gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
