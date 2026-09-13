import React, { useState } from 'react';
import { CoWorkingRoom } from '../types';
import { Users, Plus, Hash, Copy, Check, Sparkles, X, DoorOpen, Lock } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

interface RoomLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: CoWorkingRoom;
  onSelectRoom: (room: CoWorkingRoom) => void;
  onCreateRoom: (newRoom: CoWorkingRoom) => void;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onSelectRoom,
  onCreateRoom,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [roomTheme, setRoomTheme] = useState<CoWorkingRoom['theme']>('office');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const publicRooms: CoWorkingRoom[] = [
    {
      id: 'room-office-1',
      name: '🏢 Open-Plan Studio Office',
      code: 'OFFICE-1042',
      theme: 'office',
      topic: 'Sprint Deep Work & Collaborative Flow',
      timeOfDay: 'day',
      isPrivate: false,
      creatorName: 'Alex',
      maxCapacity: 6,
    },
    {
      id: 'room-office-2',
      name: '💼 Sunset Tech Hub Office',
      code: 'TECH-4091',
      theme: 'loft_office',
      topic: 'System Architecture & Pair Programming',
      timeOfDay: 'sunset',
      isPrivate: false,
      creatorName: 'Ren',
      maxCapacity: 6,
    },
    {
      id: 'room-office-3',
      name: '☕ Corner Office & Coffee Bar',
      code: 'COFFEE-8821',
      theme: 'tech_hub',
      topic: 'Quiet Deep Work & Research',
      timeOfDay: 'day',
      isPrivate: false,
      creatorName: 'Mei',
      maxCapacity: 6,
    },
    {
      id: 'room-tea-1',
      name: '🍵 Kyoto Tea Loft',
      code: 'TEA-8821',
      theme: 'tea_loft',
      topic: 'Quiet Study & Mindful Reading',
      timeOfDay: 'day',
      isPrivate: false,
      creatorName: 'Aoi',
      maxCapacity: 6,
    },
    {
      id: 'room-treehouse-1',
      name: '🌲 Forest Canopy Treehouse',
      code: 'FOREST-4029',
      theme: 'treehouse',
      topic: 'Deep Work, Coding & Building',
      timeOfDay: 'sunset',
      isPrivate: false,
      creatorName: 'Kaito',
      maxCapacity: 6,
    },
    {
      id: 'room-arcade-1',
      name: '👾 Retro Pixel Study Den',
      code: 'SYNTH-7734',
      theme: 'arcade',
      topic: 'Tech Projects & Side Hustles',
      timeOfDay: 'night',
      isPrivate: false,
      creatorName: 'Neo',
      maxCapacity: 6,
    },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    const newRoom: CoWorkingRoom = {
      id: `custom-room-${Date.now()}`,
      name: roomName.trim(),
      code: `ROOM-${Math.floor(1000 + Math.random() * 9000)}`,
      theme: roomTheme,
      topic: roomTopic.trim() || 'Co-working together with friends',
      timeOfDay: 'day',
      isPrivate: true,
      creatorName: 'You',
      maxCapacity: 6,
    };
    onCreateRoom(newRoom);
    soundEngine.playCoin();
    setIsCreating(false);
    onClose();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundEngine.playCoin();
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-2xl bg-[#1e1a2f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in text-purple-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl text-purple-300">
              🚪
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white">Co-Working Lounges</h2>
              <p className="text-xs text-purple-300">Join a shared atmosphere or host a private study room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Current Room Banner with Share Code */}
        <div className="bg-purple-950/70 border border-purple-700/50 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-cozy text-purple-300">Current Room:</span>
              <span className="text-sm font-cozy font-bold text-white">{currentRoom.name}</span>
            </div>
            <p className="text-xs text-purple-300/80 font-cozy mt-0.5">{currentRoom.topic}</p>
          </div>

          <button
            onClick={() => handleCopy(currentRoom.code)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-cozy font-medium border border-purple-700/40 transition-all"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>#{currentRoom.code}</span>
          </button>
        </div>

        {/* Create Room Toggle */}
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-cozy font-bold text-purple-200">Public Community Spaces</h4>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-cozy font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Private Room</span>
          </button>
        </div>

        {/* Create Room Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="bg-purple-950/90 p-4 rounded-2xl border border-purple-600/50 mb-4 space-y-3 animate-fade-in text-xs font-cozy">
            <div>
              <label className="block text-purple-200 font-medium mb-1">Room Name:</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. 🍵 Late Night Study Club"
                required
                className="w-full bg-purple-900/50 border border-purple-700/50 rounded-xl px-3 py-1.5 text-white placeholder-purple-400/50 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-purple-200 font-medium mb-1">Study Goal / Focus Topic:</label>
              <input
                type="text"
                value={roomTopic}
                onChange={(e) => setRoomTopic(e.target.value)}
                placeholder="e.g. Preparing for exams, thesis draft, silent coding..."
                className="w-full bg-purple-900/50 border border-purple-700/50 rounded-xl px-3 py-1.5 text-white placeholder-purple-400/50 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-purple-200 font-medium mb-1">Room Environment Theme:</label>
              <select
                value={roomTheme}
                onChange={(e) => setRoomTheme(e.target.value as CoWorkingRoom['theme'])}
                className="w-full bg-purple-900/50 border border-purple-700/50 rounded-xl px-3 py-1.5 text-purple-200 focus:outline-hidden"
              >
                <option value="tea_loft">🍵 Kyoto Tea Loft (Tatami, Lanterns, Shoji)</option>
                <option value="treehouse">🌲 Canopy Treehouse (Fairy lights, Forest foliage)</option>
                <option value="lilypad">🌌 Starlight Lotus Pond (Midnight water, Fireflies)</option>
                <option value="cafe">☕ Rainy Window Espresso Café (Books, Raindrops)</option>
                <option value="greenhouse">🌿 Botanical Conservatory (Sunlight, Plants)</option>
                <option value="arcade">👾 Retro Pixel Lounge (Neon synth, Arcade)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-xl text-purple-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white shadow-md"
              >
                Host Room
              </button>
            </div>
          </form>
        )}

        {/* Public Rooms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
          {publicRooms.map((r) => {
            const isCurrent = currentRoom.id === r.id;
            return (
              <div
                key={r.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-400/30 shadow-lg'
                    : 'bg-purple-950/60 border-purple-800/40 hover:border-purple-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-cozy font-bold text-sm text-white">{r.name}</h5>
                    <span className="text-[10px] bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-700/40 text-purple-300 font-mono-timer">
                      #{r.code}
                    </span>
                  </div>
                  <p className="text-xs text-purple-300 font-cozy line-clamp-1">{r.topic}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-900/50 text-xs font-cozy">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Co-Workers</span>
                  </span>

                  {isCurrent ? (
                    <span className="text-purple-300 font-bold text-[11px]">Joined</span>
                  ) : (
                    <button
                      onClick={() => {
                        soundEngine.playChime('bell');
                        onSelectRoom(r);
                        onClose();
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                    >
                      Join Space
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
