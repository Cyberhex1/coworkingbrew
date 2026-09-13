import React, { useState } from 'react';
import { CoWorkingRoom } from '../types';
import { ALL_ROOM_SERVERS, ROOM_THEMES_INFO, RoomServerInfo } from '../data/roomServers';
import {
  Users,
  Plus,
  Hash,
  Copy,
  Check,
  Sparkles,
  X,
  DoorOpen,
  Lock,
  Compass,
  Footprints,
  Wind,
  Coffee,
  Trees,
  Monitor,
  Sparkle,
  Server,
  Wifi,
  Activity,
} from 'lucide-react';
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
  const [filterCategory, setFilterCategory] = useState<'all' | 'office' | 'cafe' | 'nature' | 'night'>('all');
  const [selectedThemeForServers, setSelectedThemeForServers] = useState<CoWorkingRoom['theme'] | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const filteredThemes = ROOM_THEMES_INFO.filter((r) => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

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
    soundEngine.playChime('bell');
    setIsCreating(false);
    onClose();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundEngine.playCoin();
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleEnterServer = (srv: RoomServerInfo) => {
    soundEngine.playChime('bell');
    onSelectRoom(srv);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      {/* Hallway Corridor Outer Frame with Warm Wood Wall & Blackboard Texture */}
      <div className="w-full max-w-4xl bg-[#14101e] border-2 border-amber-600/40 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-purple-100 flex flex-col max-h-[92vh] overflow-hidden relative">
        {/* Hallway Warm Ambient Sconce Glow */}
        <div className="absolute top-0 left-1/4 w-48 h-24 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-0 right-1/4 w-48 h-24 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* 1. Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4 mb-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600/30 to-purple-800/30 border border-amber-500/50 flex items-center justify-center text-2xl shadow-inner text-amber-300">
              🚪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cozy font-bold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                  <span>The Study Hallway</span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-sans font-normal">
                    3 Servers per Room
                  </span>
                </h2>
              </div>
              <p className="text-xs text-amber-200/80 font-cozy mt-0.5">
                Each room features 1 AI study bot and auto-assigns open desks for incoming coworkers across 3 regional servers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-purple-300 hover:text-white transition-all text-sm font-bold active:scale-95"
            title="Step Back Inside"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Current Room Plaque with Share Code */}
        <div className="bg-gradient-to-r from-[#1c162b] via-[#241c38] to-[#1c162b] border border-amber-500/30 rounded-2xl p-3.5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden shadow-inner">
          <div className="flex items-center gap-3">
            <div className="text-xl">📍</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-cozy text-amber-300/80 uppercase tracking-wider">Your Current Room & Server:</span>
                <span className="text-sm font-cozy font-bold text-white">{currentRoom.name}</span>
              </div>
              <p className="text-xs text-purple-300/90 font-cozy mt-0.5">{currentRoom.topic}</p>
            </div>
          </div>

          <button
            onClick={() => handleCopy(currentRoom.code)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-amber-200 text-xs font-cozy font-semibold border border-amber-500/40 transition-all active:scale-95 self-start sm:self-auto shadow-sm"
            title="Copy room invite code"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-mono">#{currentRoom.code}</span>
          </button>
        </div>

        {/* 3. Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-cozy transition-all flex items-center gap-1 ${
                filterCategory === 'all'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/60 font-bold'
                  : 'bg-purple-950/50 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              <span>🚪 All Rooms</span>
              <span className="text-[10px] opacity-75">({ROOM_THEMES_INFO.length})</span>
            </button>

            <button
              onClick={() => setFilterCategory('office')}
              className={`px-3 py-1 rounded-xl text-xs font-cozy transition-all flex items-center gap-1 ${
                filterCategory === 'office'
                  ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 font-bold'
                  : 'bg-purple-950/50 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              <span>🏢 Tech Studios</span>
            </button>

            <button
              onClick={() => setFilterCategory('cafe')}
              className={`px-3 py-1 rounded-xl text-xs font-cozy transition-all flex items-center gap-1 ${
                filterCategory === 'cafe'
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60 font-bold'
                  : 'bg-purple-950/50 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              <span>☕ Tea & Cafes</span>
            </button>

            <button
              onClick={() => setFilterCategory('nature')}
              className={`px-3 py-1 rounded-xl text-xs font-cozy transition-all flex items-center gap-1 ${
                filterCategory === 'nature'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/60 font-bold'
                  : 'bg-purple-950/50 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              <span>🌲 Nature Lofts</span>
            </button>

            <button
              onClick={() => setFilterCategory('night')}
              className={`px-3 py-1 rounded-xl text-xs font-cozy transition-all flex items-center gap-1 ${
                filterCategory === 'night'
                  ? 'bg-pink-500/30 text-pink-200 border border-pink-400/60 font-bold'
                  : 'bg-purple-950/50 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              <span>👾 Night Dens</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-cozy font-bold shadow-md transition-all active:scale-95 border border-amber-400/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>✏️ Chalk a New Room</span>
          </button>
        </div>

        {/* 4. Chalkboard "Create Room" Writing Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="bg-[#19221d] p-4 rounded-2xl border-2 border-dashed border-emerald-500/50 mb-3 space-y-3 animate-fade-in text-xs font-cozy shadow-lg">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-800/40">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span>✏️ Chalking a Custom Room</span>
              </span>
              <span className="text-[10px] text-emerald-400/70">Private invite-only instance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-emerald-200 font-medium mb-1">Room Name:</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. 🍵 Late Night Study Club"
                  required
                  className="w-full bg-[#111814] border border-emerald-700/60 rounded-xl px-3 py-1.5 text-emerald-100 placeholder-emerald-600/60 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-emerald-200 font-medium mb-1">Study Goal / Focus Topic:</label>
                <input
                  type="text"
                  value={roomTopic}
                  onChange={(e) => setRoomTopic(e.target.value)}
                  placeholder="e.g. Silent coding sprint..."
                  className="w-full bg-[#111814] border border-emerald-700/60 rounded-xl px-3 py-1.5 text-emerald-100 placeholder-emerald-600/60 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-emerald-200 font-medium mb-1">Room Atmosphere Theme:</label>
              <select
                value={roomTheme}
                onChange={(e) => setRoomTheme(e.target.value as CoWorkingRoom['theme'])}
                className="w-full bg-[#111814] border border-emerald-700/60 rounded-xl px-3 py-1.5 text-emerald-200 focus:outline-hidden"
              >
                <option value="office">🏢 Open-Plan Studio Office (Desks, Whiteboards, Espresso)</option>
                <option value="loft_office">💼 Sunset Tech Hub Office (Skyline, High-Rise Views)</option>
                <option value="tech_hub">☕ Corner Office & Coffee Bar (Herringbone Oak, Neon)</option>
                <option value="tea_loft">🍵 Kyoto Tea Loft (Tatami Mats, Shoji, Zen Silence)</option>
                <option value="cafe">🌧️ Rainy Window Espresso Café (Warm Coffee, Raindrops)</option>
                <option value="treehouse">🌲 Canopy Treehouse (Fairy Lights, Forest Canopy)</option>
                <option value="greenhouse">🌿 Botanical Conservatory (Sunlit Glasshouse, Ferns)</option>
                <option value="lilypad">🌌 Starlight Lotus Pond (Bioluminescent Lilies, Night Water)</option>
                <option value="arcade">👾 Retro Pixel Den (Chiptune, Neon Synth, Arcade)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-xl text-emerald-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-md transition-all active:scale-95"
              >
                Chalk & Enter
              </button>
            </div>
          </form>
        )}

        {/* 5. Room Grid with 3 Servers per Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 pr-1 pb-1">
          {filteredThemes.map((themeInfo) => {
            const serversForTheme = ALL_ROOM_SERVERS.filter((s) => s.theme === themeInfo.theme);

            return (
              <div
                key={themeInfo.theme}
                className="p-4 rounded-2xl border-2 border-purple-800/40 bg-[#171326]/90 hover:border-amber-500/60 transition-all flex flex-col justify-between"
              >
                {/* Theme Header */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                      {themeInfo.doorBase}
                    </span>
                    <span className="text-[10px] bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-700/40 text-purple-300 font-mono flex items-center gap-1">
                      <Server className="w-2.5 h-2.5" />
                      <span>3 Servers</span>
                    </span>
                  </div>

                  <h4 className="font-cozy font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{themeInfo.icon}</span>
                    <span>{themeInfo.title}</span>
                  </h4>
                  <p className="text-xs text-purple-300/80 font-cozy line-clamp-2 mt-1 leading-relaxed">
                    {themeInfo.description}
                  </p>

                  <div className="mt-2 text-[11px] text-amber-300/80 font-cozy flex items-center gap-1 bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-800/30">
                    <span>{themeInfo.ambiance}</span>
                  </div>
                </div>

                {/* 3 Regional Server Selectors for this Room */}
                <div className="mt-3.5 space-y-1.5 pt-2.5 border-t border-purple-900/50">
                  <div className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">
                    Select Server to Join:
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {serversForTheme.map((srv) => {
                      const isCurrentServer = currentRoom.id === srv.id;

                      return (
                        <div
                          key={srv.id}
                          className={`px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${
                            isCurrentServer
                              ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400/40'
                              : 'bg-[#100d1e] border-purple-800/40 hover:border-purple-600 hover:bg-[#151026]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{srv.serverName}</span>
                              </div>
                              <div className="text-[10px] text-purple-300/70 flex items-center gap-2 font-mono">
                                <span>{srv.regionLabel}</span>
                                <span>•</span>
                                <span className="text-emerald-400">{srv.pingMs}ms</span>
                                <span>•</span>
                                <span>1 Bot + 5 Desks</span>
                              </div>
                            </div>
                          </div>

                          {isCurrentServer ? (
                            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-400/40">
                              Current 📍
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEnterServer(srv)}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow transition-all active:scale-95"
                            >
                              Join Server
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hallway Footer Note */}
        <div className="pt-3 mt-2 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-purple-400/80 font-cozy">
          <div className="flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-amber-400/70" />
            <span>Desks are automatically assigned when joining a room. Click any peer nametag to add or PM!</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-300 hover:text-white font-semibold underline underline-offset-2"
          >
            Return to Room ↩
          </button>
        </div>
      </div>
    </div>
  );
};
