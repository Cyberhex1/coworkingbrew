import React from 'react';
import { RoomPeer, AvatarConfig } from '../types';
import {
  UserPlus,
  UserCheck,
  MessageSquare,
  Sparkles,
  X,
  Clock,
  Flame,
  Award,
  Laptop,
  Check,
  Coffee,
  Heart,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

interface UserNametagModalProps {
  peer: RoomPeer | null;
  isOpen: boolean;
  onClose: () => void;
  isFriend: boolean;
  onToggleFriend: (peer: RoomPeer) => void;
  onOpenPm: (peer: RoomPeer) => void;
  onSendReactionToPeer?: (peer: RoomPeer, emoji: string) => void;
}

export const UserNametagModal: React.FC<UserNametagModalProps> = ({
  peer,
  isOpen,
  onClose,
  isFriend,
  onToggleFriend,
  onOpenPm,
  onSendReactionToPeer,
}) => {
  if (!isOpen || !peer) return null;

  const handleCheer = (emoji: string) => {
    soundEngine.playCoin();
    confetti({ particleCount: 25, spread: 45 });
    if (onSendReactionToPeer) {
      onSendReactionToPeer(peer, emoji);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#161226] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-indigo-900/80 p-5 pb-6 relative border-b border-purple-800/40">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar Badge Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#0f0c1b] border-2 border-pink-400/60 flex items-center justify-center text-3xl shadow-lg relative shrink-0">
              {peer.avatar?.mouthStyle === 'tea' ? '🍵' : peer.avatar?.activity === 'coding' ? '💻' : '✨'}
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-purple-950 border border-purple-400/60 text-[9px] font-bold text-pink-300 font-mono">
                D#{peer.deskIndex}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{peer.name}</span>
                </h3>
                {peer.isUser ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center gap-1">
                    <UserIcon className="w-2.5 h-2.5" />
                    <span>COWORKER</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-[9px] font-bold text-purple-300 flex items-center gap-1">
                    <Bot className="w-2.5 h-2.5" />
                    <span>AI BUDDY</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-purple-200/90">
                <span className="font-medium text-pink-300">{peer.avatar?.role || 'Co-Worker'}</span>
                {peer.avatar?.vibeBadge && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-900/50 border border-purple-700/40 text-[10px] text-purple-200 font-mono">
                    {peer.avatar.vibeBadge}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Current Focus Task */}
          <div className="bg-[#100d1e] border border-purple-900/60 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-400 font-mono tracking-wider flex items-center gap-1">
              <Laptop className="w-3 h-3 text-pink-400" />
              <span>Current Focus Task</span>
            </span>
            <p className="text-xs font-semibold text-white leading-relaxed">
              {peer.currentTask || 'Focusing deeply on study goals 🎯'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-[#120e21] border border-purple-900/40 rounded-xl p-2.5">
              <div className="text-[10px] text-purple-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-pink-400" />
                <span>Today</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">{peer.focusMinutesToday || 45}m</div>
            </div>

            <div className="bg-[#120e21] border border-purple-900/40 rounded-xl p-2.5">
              <div className="text-[10px] text-purple-400 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Streak</span>
              </div>
              <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">{peer.streakDays || 5} days</div>
            </div>

            <div className="bg-[#120e21] border border-purple-900/40 rounded-xl p-2.5">
              <div className="text-[10px] text-purple-400 flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-yellow-400" />
                <span>Credits</span>
              </div>
              <div className="text-xs font-bold text-yellow-300 font-mono mt-0.5">🎟️ {peer.tickets || 120}</div>
            </div>
          </div>

          {/* Quick Cheering Reactions */}
          <div className="pt-1 flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-purple-400 font-mono">Send Cheer:</span>
            <div className="flex items-center gap-1.5">
              {['☕', '🌸', '✨', '🔥', '👏'].map((em) => (
                <button
                  key={em}
                  onClick={() => handleCheer(em)}
                  className="w-8 h-8 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800/50 hover:border-pink-400 flex items-center justify-center text-sm transition-transform active:scale-90"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 border-t border-purple-900/60 flex items-center gap-2.5">
            {/* Add/Remove Friend Button */}
            <button
              onClick={() => {
                onToggleFriend(peer);
                soundEngine.playCoin();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                isFriend
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-600/50'
                  : 'bg-purple-800 hover:bg-purple-700 text-white border border-purple-600/40'
              }`}
            >
              {isFriend ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Friends ✓</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Add Friend</span>
                </>
              )}
            </button>

            {/* PM (Private Message) Button */}
            <button
              onClick={() => {
                onOpenPm(peer);
                onClose();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send PM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
