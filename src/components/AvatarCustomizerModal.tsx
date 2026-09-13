import React, { useState } from 'react';
import { AvatarConfig, DeskConfig, ActivityType } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { DeskRenderer } from './DeskRenderer';
import { VoxelAvatarPreview } from './VoxelAvatarPreview';
import { Sparkles, Palette, User, Shirt, Armchair, Heart, Check, X, Box } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  avatar: AvatarConfig;
  desk: DeskConfig;
  onSave: (avatar: AvatarConfig, desk: DeskConfig) => void;
  onClose: () => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  avatar: initialAvatar,
  desk: initialDesk,
  onSave,
  onClose,
}) => {
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar);
  const [desk, setDesk] = useState<DeskConfig>(initialDesk);
  const [activeCategory, setActiveCategory] = useState<'profile' | 'character' | 'wardrobe' | 'desk' | 'pet' | 'activity'>('profile');
  const [previewMode, setPreviewMode] = useState<'3d' | '2d'>('3d');

  if (!isOpen) return null;

  const skinColors = ['#ffd8b3', '#fcd5b5', '#eac096', '#d69e6b', '#b37746', '#704724', '#f1e2d6'];
  const hairColors = ['#271c19', '#4a2c11', '#78350f', '#ca8a04', '#e11d48', '#8b5cf6', '#06b6d4', '#f43f5e', '#e2e8f0'];
  const clothingColors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#1e293b', '#f8fafc', '#6366f1'];

  const hairStyles: { id: AvatarConfig['hairStyle']; label: string }[] = [
    { id: 'messy', label: 'Messy Curls' },
    { id: 'bob', label: 'Cozy Bob' },
    { id: 'spiky', label: 'Spiky Anime' },
    { id: 'braids', label: 'Twin Braids' },
    { id: 'ponytail', label: 'High Ponytail' },
    { id: 'fringe', label: 'Bangs / Fringe' },
    { id: 'afro', label: 'Afro Puffs' },
    { id: 'short', label: 'Classic Short' },
  ];

  const eyeStyles: { id: AvatarConfig['eyeStyle']; label: string }[] = [
    { id: 'sparkle', label: '✨ Sparkle' },
    { id: 'happy', label: '😊 Happy' },
    { id: 'sleepy', label: '😴 Sleepy' },
    { id: 'wink', label: '😉 Wink' },
    { id: 'focused', label: '🎯 Focused' },
  ];

  const mouthStyles: { id: AvatarConfig['mouthStyle']; label: string }[] = [
    { id: 'smile', label: '😊 Smile' },
    { id: 'cat', label: '🐱 Cat :3' },
    { id: 'bubblegum', label: '🫧 Bubblegum' },
    { id: 'tea', label: '🍵 Sip Tea' },
    { id: 'dot', label: '• Dot' },
  ];

  const hats: { id: AvatarConfig['hat']; label: string }[] = [
    { id: 'none', label: 'No Hat' },
    { id: 'frog', label: '🐸 Frog Bucket' },
    { id: 'beanie', label: '🧣 Cozy Beanie' },
    { id: 'catears', label: '🐱 Cat Ears' },
    { id: 'straw', label: '👒 Straw Hat' },
    { id: 'wizard', label: '🧙 Wizard Hat' },
    { id: 'headphones', label: '🎧 Headset' },
    { id: 'beret', label: '🎨 Artist Beret' },
    { id: 'crown', label: '👑 Gold Crown' },
  ];

  const glassesList: { id: AvatarConfig['glasses']; label: string }[] = [
    { id: 'none', label: 'No Glasses' },
    { id: 'round', label: '👓 Round Wire' },
    { id: 'square', label: '🕶️ Square Frame' },
    { id: 'sunglasses', label: '🕶️ Cool Shades' },
    { id: 'cyber', label: '🥽 Cyber Visor' },
  ];

  const clothingList: { id: AvatarConfig['clothing']; label: string }[] = [
    { id: 'hoodie', label: 'Oversized Hoodie' },
    { id: 'sweater', label: 'Knitted Sweater' },
    { id: 'overalls', label: 'Denim Overalls' },
    { id: 'shirt', label: 'Collared Shirt' },
    { id: 'kimono', label: 'Silk Kimono' },
  ];

  const tails: { id: AvatarConfig['tail']; label: string }[] = [
    { id: 'none', label: 'No Tail' },
    { id: 'fox', label: '🦊 Fluffy Fox' },
    { id: 'cat', label: '🐱 Sleek Cat' },
    { id: 'puppy', label: '🐕 Puppy Wag' },
    { id: 'bunny', label: '🐇 Bunny Puff' },
    { id: 'dragon', label: '🐉 Dragon Tail' },
  ];

  const deskStyles: { id: DeskConfig['deskStyle']; label: string }[] = [
    { id: 'wood', label: '🪵 Natural Oak' },
    { id: 'sakura', label: '🌸 Sakura Blossom' },
    { id: 'cyber', label: '⚡ Cyber Neon' },
    { id: 'walnut', label: '🌰 Dark Walnut' },
    { id: 'crystal', label: '🔮 Amethyst Crystal' },
    { id: 'vintage', label: '📜 Antique Wood' },
  ];

  const deskAccessories: { id: DeskConfig['deskAccessory']; label: string }[] = [
    { id: 'mug', label: '🍵 Steaming Matcha' },
    { id: 'succulent', label: '🪴 Mini Succulent' },
    { id: 'mushroom_lamp', label: '🍄 Mushroom Lamp' },
    { id: 'lava_lamp', label: '🧪 Pink Lava Lamp' },
    { id: 'crystal', label: '💎 Glowing Quartz' },
    { id: 'gameboy', label: '🕹️ Retro Console' },
    { id: 'bonsai', label: '🌳 Miniature Bonsai' },
  ];

  const pets: { id: DeskConfig['petType']; label: string }[] = [
    { id: 'none', label: 'No Pet' },
    { id: 'shiba', label: '🐕 Shiba Inu' },
    { id: 'cat', label: '🐈 Calico Cat' },
    { id: 'ghost', label: '👻 Floating Ghost' },
    { id: 'capybara', label: '🦫 Capybara' },
    { id: 'duck', label: '🦆 Yellow Duck' },
    { id: 'dragon', label: '🐉 Star Dragon' },
  ];

  const activities: { id: ActivityType; label: string; desc: string }[] = [
    { id: 'typing', label: '💻 Typing on Laptop', desc: 'Working & writing code' },
    { id: 'reading', label: '📖 Reading Book', desc: 'Studying text & notes' },
    { id: 'writing', label: '✍️ Writing in Notebook', desc: 'Drafting ideas' },
    { id: 'drawing', label: '🎨 Painting Easel', desc: 'Designing & art' },
    { id: 'tea', label: '🍵 Sipping Hot Tea', desc: 'Calm mindful focus' },
    { id: 'meditating', label: '🧘 Meditating', desc: 'Breathing & mindfulness' },
    { id: 'sleeping', label: '💤 Resting / Napping', desc: 'Recharging energy' },
  ];

  const handleSave = () => {
    soundEngine.playChime('chime');
    onSave(avatar, desk);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#1e1a2f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in text-purple-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="font-cozy font-bold text-lg text-white">Avatar & Desk Studio</h2>
              <p className="text-xs text-purple-300">Customize your cozy co-working persona</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1">
          {/* Left Preview Box */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-purple-950/70 rounded-2xl border border-purple-800/40 p-4 relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-cozy text-purple-300/80 bg-purple-900/50 px-2.5 py-0.5 rounded-full">
                Live Preview
              </span>
              <div className="flex items-center gap-1 bg-purple-900/60 p-0.5 rounded-xl border border-purple-700/40 text-[10px] font-cozy">
                <button
                  onClick={() => setPreviewMode('3d')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    previewMode === '3d' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  3D Voxel
                </button>
                <button
                  onClick={() => setPreviewMode('2d')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    previewMode === '2d' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  2D Chibi
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center my-2">
              {previewMode === '3d' ? (
                <VoxelAvatarPreview avatar={avatar} desk={desk} category={activeCategory} />
              ) : (
                <>
                  {activeCategory === 'desk' ? (
                    <div className="w-full max-w-[220px] py-6 flex flex-col items-center justify-center">
                      <DeskRenderer desk={desk} />
                    </div>
                  ) : (
                    <>
                      <AvatarRenderer avatar={avatar} size={150} animate={true} showActivityProp={true} />
                      {activeCategory === 'pet' && desk.petType !== 'none' && (
                        <div className="text-2xl mt-2 animate-bounce">
                          {desk.petType === 'shiba' && '🐕'}
                          {desk.petType === 'cat' && '🐱'}
                          {desk.petType === 'ghost' && '👻'}
                          {desk.petType === 'duck' && '🦆'}
                          {desk.petType === 'capybara' && '🥔'}
                          {desk.petType === 'dragon' && '🐉'}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Status input preview */}
            <div className="w-full mt-2">
              <label className="text-[11px] font-cozy text-purple-300 block mb-1">Status Quote:</label>
              <input
                type="text"
                value={avatar.statusText}
                onChange={(e) => setAvatar({ ...avatar, statusText: e.target.value })}
                placeholder="e.g. In the zone... 🎧"
                className="w-full bg-purple-900/50 border border-purple-700/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-hidden font-cozy"
              />
            </div>
          </div>

          {/* Right Customization Tabs & Options */}
          <div className="md:col-span-7 flex flex-col">
            {/* Category Sub-Tabs */}
            <div className="flex items-center gap-1.5 border-b border-purple-800/40 pb-2 mb-3 overflow-x-auto text-xs font-cozy">
              <button
                onClick={() => setActiveCategory('profile')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'profile' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white bg-purple-950/50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile & ID</span>
              </button>
              <button
                onClick={() => setActiveCategory('character')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeCategory === 'character' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white bg-purple-950/50'
                }`}
              >
                Face & Hair
              </button>
              <button
                onClick={() => setActiveCategory('wardrobe')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeCategory === 'wardrobe' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white bg-purple-950/50'
                }`}
              >
                Outfits & Hats
              </button>
              <button
                onClick={() => setActiveCategory('desk')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeCategory === 'desk' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white bg-purple-950/50'
                }`}
              >
                Desk Setup
              </button>
              <button
                onClick={() => setActiveCategory('pet')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeCategory === 'pet' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white bg-purple-950/50'
                }`}
              >
                Pet Companion
              </button>
              <button
                onClick={() => setActiveCategory('activity')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeCategory === 'activity' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white bg-purple-950/50'
                }`}
              >
                Focus Activity
              </button>
            </div>

            {/* Tab 0: Profile (Username, Role, Mantra, Bio, Vibe Badge) */}
            {activeCategory === 'profile' && (
              <div className="space-y-4 text-xs font-cozy">
                {/* Username Input */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">
                    Display Username <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={avatar.name || ''}
                    onChange={(e) => setAvatar({ ...avatar, name: e.target.value })}
                    placeholder="e.g. Alex"
                    className="w-full bg-[#1b1530] border border-purple-600/50 rounded-xl px-3.5 py-2 text-white placeholder-purple-400/40 text-sm focus:outline-hidden focus:border-purple-400 font-cozy"
                  />
                  <p className="text-[10px] text-purple-400/70 mt-1">This name appears above your avatar in the 3D office and co-worker list.</p>
                </div>

                {/* Professional Role / Focus Title */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Work Title / Specialty</label>
                  <input
                    type="text"
                    value={avatar.role || ''}
                    onChange={(e) => setAvatar({ ...avatar, role: e.target.value })}
                    placeholder="e.g. Full-Stack Engineer, Novelist, Student, UI Designer"
                    className="w-full bg-[#1b1530] border border-purple-600/50 rounded-xl px-3.5 py-2 text-white placeholder-purple-400/40 text-xs focus:outline-hidden focus:border-purple-400 font-cozy"
                  />
                </div>

                {/* Vibe Badge Emoji */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Vibe Badge Icon</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['⚡', '☕', '💻', '🎨', '🚀', '📚', '✨', '🧠', '🎧', '🌿', '🐱', '🍕'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, vibeBadge: emoji })}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          avatar.vibeBadge === emoji
                            ? 'bg-purple-600 text-white scale-110 shadow-lg border border-purple-300'
                            : 'bg-purple-950/50 text-purple-200 border border-purple-800/40 hover:bg-purple-900/50 hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio / About */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">About / Bio</label>
                  <textarea
                    value={avatar.bio || ''}
                    onChange={(e) => setAvatar({ ...avatar, bio: e.target.value })}
                    placeholder="Tell your co-working team what projects you are building today..."
                    rows={3}
                    className="w-full bg-[#1b1530] border border-purple-600/50 rounded-xl px-3.5 py-2 text-white placeholder-purple-400/40 text-xs focus:outline-hidden focus:border-purple-400 font-cozy resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 1: Character (Hair, Skin, Face) */}
            {activeCategory === 'character' && (
              <div className="space-y-4 text-xs font-cozy">
                {/* Skin Color Swatches */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Skin Tone</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {skinColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAvatar({ ...avatar, skinColor: color })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          avatar.skinColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Hair Style */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Hair Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {hairStyles.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setAvatar({ ...avatar, hairStyle: h.id })}
                        className={`py-1.5 px-2.5 rounded-xl border text-left transition-all ${
                          avatar.hairStyle === h.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Hair Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {hairColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAvatar({ ...avatar, hairColor: c })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          avatar.hairColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Eyes & Mouth */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 mb-1 font-medium">Eyes Expression</label>
                    <div className="space-y-1">
                      {eyeStyles.map((eye) => (
                        <button
                          key={eye.id}
                          onClick={() => setAvatar({ ...avatar, eyeStyle: eye.id })}
                          className={`w-full py-1 px-2 rounded-lg border text-left text-[11px] ${
                            avatar.eyeStyle === eye.id
                              ? 'bg-purple-600/80 border-purple-400 text-white'
                              : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                          }`}
                        >
                          {eye.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-purple-300 mb-1 font-medium">Mouth Expression</label>
                    <div className="space-y-1">
                      {mouthStyles.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setAvatar({ ...avatar, mouthStyle: m.id })}
                          className={`w-full py-1 px-2 rounded-lg border text-left text-[11px] ${
                            avatar.mouthStyle === m.id
                              ? 'bg-purple-600/80 border-purple-400 text-white'
                              : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Wardrobe & Hats */}
            {activeCategory === 'wardrobe' && (
              <div className="space-y-4 text-xs font-cozy">
                {/* Hats */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Headwear & Hats</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {hats.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setAvatar({ ...avatar, hat: h.id })}
                        className={`py-1.5 px-2 rounded-xl border text-left text-[11px] truncate ${
                          avatar.hat === h.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glasses */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Glasses & Eyewear</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {glassesList.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setAvatar({ ...avatar, glasses: g.id })}
                        className={`py-1.5 px-2 rounded-xl border text-left text-[11px] truncate ${
                          avatar.glasses === g.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clothing & Color */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Clothing Style & Color</label>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {clothingList.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setAvatar({ ...avatar, clothing: c.id })}
                        className={`py-1.5 px-2 rounded-xl border text-left text-[11px] ${
                          avatar.clothing === c.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {clothingColors.map((col) => (
                      <button
                        key={col}
                        onClick={() => setAvatar({ ...avatar, clothingColor: col })}
                        className={`w-6 h-6 rounded-full border-2 ${
                          avatar.clothingColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Cute Tails */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Tails & Cosplay</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {tails.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setAvatar({ ...avatar, tail: t.id })}
                        className={`py-1.5 px-2 rounded-xl border text-left text-[11px] ${
                          avatar.tail === t.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Desk Setup */}
            {activeCategory === 'desk' && (
              <div className="space-y-4 text-xs font-cozy">
                {/* Desk Material */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Desk Table Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {deskStyles.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDesk({ ...desk, deskStyle: d.id })}
                        className={`py-2 px-3 rounded-xl border text-left ${
                          desk.deskStyle === d.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desk Accessories */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Desk Accessory & Lamp</label>
                  <div className="grid grid-cols-2 gap-2">
                    {deskAccessories.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setDesk({ ...desk, deskAccessory: acc.id })}
                        className={`py-2 px-3 rounded-xl border text-left ${
                          desk.deskAccessory === acc.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Pet Companion */}
            {activeCategory === 'pet' && (
              <div className="space-y-4 text-xs font-cozy">
                {/* Pet selection */}
                <div>
                  <label className="block text-purple-300 mb-1.5 font-medium">Choose Companion Pet</label>
                  <div className="grid grid-cols-2 gap-2">
                    {pets.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setDesk({ ...desk, petType: p.id })}
                        className={`py-2 px-3 rounded-xl border text-left ${
                          desk.petType === p.id
                            ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                            : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pet Name input */}
                {desk.petType !== 'none' && (
                  <div>
                    <label className="block text-purple-300 mb-1 font-medium">Pet Nickname</label>
                    <input
                      type="text"
                      value={desk.petName}
                      onChange={(e) => setDesk({ ...desk, petName: e.target.value })}
                      placeholder="e.g. Mochi, Biscuit, Boba..."
                      className="w-full bg-purple-950/60 border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-hidden font-cozy"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Focus Activity */}
            {activeCategory === 'activity' && (
              <div className="space-y-3 text-xs font-cozy">
                <label className="block text-purple-300 font-medium">Select Focus Animation & Prop</label>
                <div className="space-y-1.5">
                  {activities.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => setAvatar({ ...avatar, activity: act.id })}
                      className={`w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        avatar.activity === act.id
                          ? 'bg-purple-600/80 border-purple-400 text-white font-semibold'
                          : 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
                      }`}
                    >
                      <span>{act.label}</span>
                      <span className="text-[10px] text-purple-300/80">{act.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-purple-800/40 pt-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-cozy font-medium text-purple-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-cozy font-bold text-xs text-white shadow-lg transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Save Persona</span>
          </button>
        </div>
      </div>
    </div>
  );
};
