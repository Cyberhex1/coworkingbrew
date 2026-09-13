import React, { useState, useEffect } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  ShoppingBag,
  Sparkles,
  Check,
  Send,
  Heart,
  MessageSquare,
  Share2,
  ThumbsUp,
  Image as ImageIcon,
  Zap,
  Coffee,
  Bookmark,
  ExternalLink,
  Flame,
  Eye,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Monitor,
} from 'lucide-react';
import { DeskConfig } from '../types';
import { WallpaperId, WallpaperItem, WALLPAPERS } from './DeskWorkstationOverlay';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

interface SocialPost {
  id: string;
  author: string;
  avatarEmoji: string;
  role: string;
  timeAgo: string;
  content: string;
  imageTag?: string;
  likes: number;
  hasLiked: boolean;
  comments: { author: string; text: string }[];
}

interface BoutiqueItem {
  id: string;
  name: string;
  category: 'Desk Gear' | 'Aesthetics' | 'Stationery' | 'Tech';
  icon: string;
  cost: number;
  desc: string;
  perk: string;
  bought: boolean;
}

interface DesktopBrowserAppProps {
  tickets: number;
  onAddTickets: (amount: number) => void;
  activeWallpaper: WallpaperId;
  onSelectWallpaper: (wp: WallpaperItem) => void;
  unlockedWallpapers: WallpaperId[];
  desk: DeskConfig;
  onUpdateDesk: (newDesk: DeskConfig) => void;
  userName: string;
}

const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    author: 'Mei 🍵',
    avatarEmoji: '🌸',
    role: 'Product Designer',
    timeAgo: '12m ago',
    content:
      'Just completed 4 deep work sprint blocks without checking my phone once! Steaming jasmine tea is the ultimate productivity hack. How is everyone’s sprint going? 🌿🍵',
    likes: 6,
    hasLiked: false,
    comments: [
      { author: 'Ren ⚡', text: 'Congrats Mei! Crushed my morning OAuth bug thanks to the lofi beats.' },
      { author: 'Aoi 🌸', text: 'Jasmine tea sounds heavenly right now, gonna grab some water!' },
    ],
  },
  {
    id: 'post-2',
    author: 'Ren ⚡',
    avatarEmoji: '⚡',
    role: 'Full-Stack Eng',
    timeAgo: '28m ago',
    content:
      'Shipped the new WebSocket presence protocol! 🚀 Zero latency syncing across all 8 cubicle pods. Time to hit the office espresso bar for a double macchiato ☕',
    imageTag: '💻 Shipped PR #142',
    likes: 9,
    hasLiked: true,
    comments: [
      { author: 'Jordan', text: 'Clean PR, merged it into staging without a hitch.' },
    ],
  },
  {
    id: 'post-3',
    author: 'Aoi 🌸',
    avatarEmoji: '📚',
    role: 'Bio Researcher',
    timeAgo: '45m ago',
    content:
      'Finished Chapter 4 molecular biology notes! 🧬 Setting up my desk with the new Cherry Blossom mat. Loving the peaceful vibes in CoworkingBrew today ✨',
    likes: 4,
    hasLiked: false,
    comments: [],
  },
  {
    id: 'post-4',
    author: 'Chloe 🎀',
    avatarEmoji: '🎀',
    role: 'Frontend Dev',
    timeAgo: '1h ago',
    content:
      'Remember to stretch your wrists and take rest breaks between rounds! 🧘‍♀️ Drink your water at the cooler station!',
    likes: 8,
    hasLiked: false,
    comments: [
      { author: 'Liam ☕', text: 'Just logged 4 glasses thanks for the reminder!' },
    ],
  },
];

const BOUTIQUE_ITEMS: BoutiqueItem[] = [
  {
    id: 'mat_sakura',
    name: 'Sakura Petal Silk Desk Mat',
    category: 'Desk Gear',
    icon: '🌸',
    cost: 30,
    desc: 'Ultra-smooth water-resistant extended micro-weave mat with pastel blossom print.',
    perk: '+10% Focus Comfort',
    bought: false,
  },
  {
    id: 'mech_kb',
    name: 'Artisan Mechanical Keyboard (Cream Switches)',
    category: 'Tech',
    icon: '⌨️',
    cost: 45,
    desc: 'Custom lubricated linear switches with tactile thocky sound acoustics and RGB glow.',
    perk: '+15% Typing Flow',
    bought: false,
  },
  {
    id: 'neon_sign',
    name: 'Neon "BREW & FLOW" Wall Sign',
    category: 'Aesthetics',
    icon: '💡',
    cost: 40,
    desc: 'Warm electric ambient neon tube casting a cozy purple-rose radiance across your pod.',
    perk: 'Custom Ambience',
    bought: false,
  },
  {
    id: 'aura_lightbar',
    name: 'Asymmetric Monitor Light Bar',
    category: 'Tech',
    icon: '✨',
    cost: 35,
    desc: 'Anti-glare screen lightbar with auto-dimming circadian temperature adjustment.',
    perk: 'Zero Eye Strain',
    bought: false,
  },
  {
    id: 'gold_espresso',
    name: 'Italian Copper Portafilter & Dripper',
    category: 'Stationery',
    icon: '☕',
    cost: 35,
    desc: 'Heavyweight brass espresso tamper and pour-over kettle for desk baristas.',
    perk: '+5 🎟️ on Coffee Sprints',
    bought: false,
  },
  {
    id: 'boba_caps',
    name: 'Artisan Taro Boba Keycap Set',
    category: 'Desk Gear',
    icon: '🧋',
    cost: 25,
    desc: 'Sculpted translucent resin keycaps filled with miniature floating boba pearls.',
    perk: 'Super Cute Aesthetic',
    bought: false,
  },
];

export const DesktopBrowserApp: React.FC<DesktopBrowserAppProps> = ({
  tickets,
  onAddTickets,
  activeWallpaper,
  onSelectWallpaper,
  unlockedWallpapers,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'social' | 'boutique' | 'wallpapers'>('social');
  const [wallpaperFilter, setWallpaperFilter] = useState<'all' | 'food' | 'pet' | 'anime' | 'scenery' | 'basic'>('all');
  const [previewModalWallpaper, setPreviewModalWallpaper] = useState<WallpaperItem | null>(null);
  const [hoveredWpId, setHoveredWpId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('brew://social-lounge');

  // Handle ESC key to close wallpaper preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewModalWallpaper) {
        setPreviewModalWallpaper(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModalWallpaper]);
  const [posts, setPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('coworkingbrew_browser_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });
  const [newPostText, setNewPostText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [boutiqueItems, setBoutiqueItems] = useState<BoutiqueItem[]>(() => {
    const saved = localStorage.getItem('coworkingbrew_boutique_bought');
    const boughtIds: string[] = saved ? JSON.parse(saved) : [];
    return BOUTIQUE_ITEMS.map((item) => ({
      ...item,
      bought: boughtIds.includes(item.id),
    }));
  });

  const savePosts = (newPosts: SocialPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('coworkingbrew_browser_posts', JSON.stringify(newPosts));
  };

  const handleTabChange = (tab: 'social' | 'boutique' | 'wallpapers') => {
    setActiveTab(tab);
    if (tab === 'social') setUrlInput('brew://social-lounge');
    if (tab === 'boutique') setUrlInput('brew://luxe-boutique');
    if (tab === 'wallpapers') setUrlInput('brew://cute-wallpapers');
    soundEngine.playChime('chime');
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      author: `${userName || 'You'} ✨`,
      avatarEmoji: '🌟',
      role: 'Co-Worker',
      timeAgo: 'Just now',
      content: newPostText.trim(),
      likes: 1,
      hasLiked: true,
      comments: [],
    };

    const updated = [newPost, ...posts];
    savePosts(updated);
    setNewPostText('');
    soundEngine.playCoin();
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleToggleLike = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const hasLiked = !p.hasLiked;
        const likes = hasLiked ? p.likes + 1 : p.likes - 1;
        if (hasLiked) {
          soundEngine.playHighFive();
          confetti({ particleCount: 15, spread: 30 });
        }
        return { ...p, hasLiked, likes };
      }
      return p;
    });
    savePosts(updated);
  };

  const handleAddComment = (postId: string) => {
    const text = replyTextMap[postId]?.trim();
    if (!text) return;

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { author: userName || 'You', text }],
        };
      }
      return p;
    });
    savePosts(updated);
    setReplyTextMap((prev) => ({ ...prev, [postId]: '' }));
    setActiveReplyPostId(null);
    soundEngine.playCoin();
  };

  const handleBuyBoutiqueItem = (item: BoutiqueItem) => {
    if (item.bought) return;
    if (tickets < item.cost) {
      soundEngine.playChime('digital');
      return;
    }

    onAddTickets(-item.cost);
    const updated = boutiqueItems.map((bi) => (bi.id === item.id ? { ...bi, bought: true } : bi));
    setBoutiqueItems(updated);
    const boughtIds = updated.filter((i) => i.bought).map((i) => i.id);
    localStorage.setItem('coworkingbrew_boutique_bought', JSON.stringify(boughtIds));

    soundEngine.playCoin();
    confetti({ particleCount: 45, spread: 70 });
  };

  return (
    <div className="flex flex-col h-full bg-[#110e1e] text-purple-100 rounded-xl overflow-hidden border border-purple-500/30">
      {/* 1. Safari Browser Navigation Toolbar */}
      <div className="bg-[#1b152b] border-b border-purple-500/25 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 text-purple-300">
          <button
            onClick={() => handleTabChange('social')}
            className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTabChange('boutique')}
            className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => soundEngine.playChime('chime')}
            className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Reload Page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-lg flex items-center gap-2 bg-[#0c0916] border border-purple-800/60 rounded-xl px-3 py-1 text-xs text-purple-200">
          <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <input
            type="text"
            readOnly
            value={urlInput}
            className="bg-transparent border-none outline-hidden text-xs text-purple-200 w-full font-mono select-none"
          />
          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50 font-semibold shrink-0">
            SECURE
          </span>
        </div>

        {/* Tickets Balance Pill */}
        <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-xl text-xs text-amber-200 font-bold font-mono-timer">
          <span>🎟️</span>
          <span>{tickets} Credits</span>
        </div>
      </div>

      {/* 2. Web Page Tab Links */}
      <div className="bg-[#171226] border-b border-purple-500/20 px-4 flex items-center gap-2 text-xs">
        <button
          onClick={() => handleTabChange('social')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition-all ${
            activeTab === 'social'
              ? 'border-purple-400 text-white font-bold bg-purple-900/30'
              : 'border-transparent text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span>💬 CoffeeLounge Social Chat</span>
        </button>

        <button
          onClick={() => handleTabChange('boutique')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition-all ${
            activeTab === 'boutique'
              ? 'border-amber-400 text-white font-bold bg-amber-950/30'
              : 'border-transparent text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>🛍️ Luxe Desk Boutique</span>
        </button>

        <button
          onClick={() => handleTabChange('wallpapers')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition-all ${
            activeTab === 'wallpapers'
              ? 'border-pink-400 text-white font-bold bg-pink-950/30'
              : 'border-transparent text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-pink-400" />
          <span>🌸 Cute Extensive Wallpapers</span>
        </button>
      </div>

      {/* 3. Browser Viewport Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ================= TAB 1: SOCIAL MEDIA CHAT ================= */}
        {activeTab === 'social' && (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Create Post Card */}
            <form onSubmit={handlePostSubmit} className="bg-[#1b152d] border border-purple-500/30 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-md">
                  ✨
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Share an update with the co-working room</h4>
                  <p className="text-[10px] text-purple-300/80">Connect with Mei, Ren, Aoi, Chloe & the team</p>
                </div>
              </div>

              <textarea
                rows={2}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What are you focusing on, celebrating, or sipping right now? ☕"
                className="w-full bg-[#0d0a18] border border-purple-800/60 rounded-xl p-3 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-hidden focus:border-purple-400 resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-purple-400">
                  <button
                    type="button"
                    onClick={() => setNewPostText((p) => p + ' ☕')}
                    className="hover:bg-purple-900/50 px-2 py-1 rounded-lg text-sm transition-colors"
                  >
                    ☕
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostText((p) => p + ' 🚀')}
                    className="hover:bg-purple-900/50 px-2 py-1 rounded-lg text-sm transition-colors"
                  >
                    🚀
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostText((p) => p + ' 🌸')}
                    className="hover:bg-purple-900/50 px-2 py-1 rounded-lg text-sm transition-colors"
                  >
                    🌸
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostText((p) => p + ' 🎧')}
                    className="hover:bg-purple-900/50 px-2 py-1 rounded-lg text-sm transition-colors"
                  >
                    🎧
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!newPostText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Status</span>
                </button>
              </div>
            </form>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#181329] border border-purple-500/25 rounded-2xl p-4 shadow-md space-y-3 transition-all hover:border-purple-400/50"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-900/60 border border-purple-600/40 flex items-center justify-center text-base">
                        {post.avatarEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{post.author}</span>
                          <span className="text-[10px] text-purple-400">• {post.timeAgo}</span>
                        </div>
                        <span className="text-[10px] text-purple-300/80 font-mono-timer">{post.role}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                        post.hasLiked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-purple-900/30 text-purple-300 hover:text-white border border-purple-800/40'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-purple-100 leading-relaxed font-cozy whitespace-pre-wrap">{post.content}</p>

                  {/* Optional Image / Badge */}
                  {post.imageTag && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-700/50 text-[11px] text-purple-200 font-mono">
                      <span>{post.imageTag}</span>
                    </div>
                  )}

                  {/* Post Actions & Comments Bar */}
                  <div className="pt-2 border-t border-purple-800/30 flex items-center justify-between text-xs text-purple-300">
                    <button
                      onClick={() =>
                        setActiveReplyPostId((prev) => (prev === post.id ? null : post.id))
                      }
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>{post.comments.length} {post.comments.length === 1 ? 'Reply' : 'Replies'}</span>
                    </button>

                    <span className="text-[10px] text-purple-400 font-mono">CozyLounge Feed</span>
                  </div>

                  {/* Comments Thread */}
                  {post.comments.length > 0 && (
                    <div className="space-y-2 pt-2 pl-3 border-l-2 border-purple-800/40">
                      {post.comments.map((comm, idx) => (
                        <div key={idx} className="bg-[#110d1f] p-2.5 rounded-xl border border-purple-900/40 text-xs">
                          <span className="font-bold text-white text-[11px] mr-1.5">{comm.author}:</span>
                          <span className="text-purple-200 text-[11px]">{comm.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input Box */}
                  {activeReplyPostId === post.id && (
                    <div className="flex items-center gap-2 pt-2 animate-fadeIn">
                      <input
                        type="text"
                        value={replyTextMap[post.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        placeholder="Write a cheerful reply..."
                        className="flex-1 bg-[#0c0917] border border-purple-800/60 rounded-xl px-3 py-1.5 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-hidden focus:border-purple-400"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: LUXE DESK BOUTIQUE ================= */}
        {activeTab === 'boutique' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-rose-950/60 border border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>The Luxe Co-Working Boutique</span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
                  Curated premium accessories, custom RGB hardware, and artisan peripherals. Unlock them using your focus session credits!
                </p>
              </div>

              <div className="bg-amber-500/20 border border-amber-400/50 px-4 py-2 rounded-2xl text-center shrink-0">
                <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Your Balance</span>
                <span className="text-base font-bold text-amber-200 font-mono-timer">🎟️ {tickets} Credits</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boutiqueItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    item.bought
                      ? 'bg-purple-950/40 border-emerald-500/40 shadow-sm'
                      : 'bg-[#181329] border-purple-500/25 hover:border-amber-400/50 shadow-md hover:shadow-xl'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-800 to-amber-700/60 flex items-center justify-center text-2xl shadow-md border border-white/10">
                        {item.icon}
                      </div>
                      <span className="text-[10px] bg-purple-900/60 text-purple-200 border border-purple-700/50 px-2 py-0.5 rounded-full font-mono">
                        {item.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[11px] text-purple-300/80 mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/50 border border-emerald-600/30 text-[10px] text-emerald-300 font-semibold">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{item.perk}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-purple-800/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono-timer">
                      🎟️ {item.cost} Credits
                    </span>

                    {item.bought ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Equipped</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyBoutiqueItem(item)}
                        disabled={tickets < item.cost}
                        className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          tickets >= item.cost
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 active:scale-95'
                            : 'bg-purple-900/40 text-purple-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Unlock</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CUTE EXTENSIVE WALLPAPERS ================= */}
        {activeTab === 'wallpapers' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-pink-950/60 via-purple-950/60 to-indigo-950/60 border border-pink-500/40 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                  <span>Safari Pro Luxe Wallpapers Boutique</span>
                </h3>
                <p className="text-xs text-pink-200/80 mt-1 max-w-xl">
                  Explore cute cartoon foods, sweet pets, anime skies, and cozy lofi backgrounds! Instant 1-click apply to your desktop workstation.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-pink-300 block font-mono">15+ Handcrafted Themes</span>
                <span className="text-xs text-purple-300">1-Click Apply to OS</span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 border-b border-purple-800/40 pb-3">
              {[
                { id: 'all', label: '🌟 All Themes' },
                { id: 'food', label: '🍜 Cute Foods' },
                { id: 'pet', label: '🐾 Cute Pets' },
                { id: 'anime', label: '🌸 Anime & Aesthetic' },
                { id: 'scenery', label: '🌲 Scenery & Lofi' },
                { id: 'basic', label: '🌊 Basic Defaults' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setWallpaperFilter(chip.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-cozy transition-all flex items-center gap-1.5 ${
                    wallpaperFilter === chip.id
                      ? 'bg-pink-600 text-white font-bold shadow-md ring-1 ring-pink-400'
                      : 'bg-purple-950/60 text-purple-300 hover:text-white hover:bg-purple-900/60 border border-purple-800/40'
                  }`}
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Wallpapers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {WALLPAPERS.filter((wp) => wallpaperFilter === 'all' || wp.category === wallpaperFilter).map((wp) => {
                const isUnlocked = unlockedWallpapers.includes(wp.id);
                const isActive = activeWallpaper === wp.id;
                const isHovered = hoveredWpId === wp.id;

                return (
                  <div
                    key={wp.id}
                    onMouseEnter={() => setHoveredWpId(wp.id)}
                    onMouseLeave={() => setHoveredWpId(null)}
                    className={`group relative rounded-2xl overflow-hidden border p-3.5 flex flex-col justify-between transition-all duration-200 ${
                      isActive
                        ? 'border-pink-400 bg-[#231536] ring-2 ring-pink-400/50 shadow-xl'
                        : isHovered
                        ? 'border-pink-500/70 bg-[#1c142e] shadow-lg shadow-pink-950/40 -translate-y-0.5'
                        : 'border-purple-500/30 bg-[#161226] hover:border-pink-500/60 shadow-md'
                    }`}
                  >
                    {/* Wallpaper Preview Swatch */}
                    <div>
                      <div
                        onClick={() => {
                          setPreviewModalWallpaper(wp);
                          soundEngine.playChime('chime');
                        }}
                        className={`w-full h-28 rounded-xl shadow-inner relative overflow-hidden cursor-pointer transition-transform duration-300 group-hover:scale-[1.02] ${wp.gradientClass}`}
                      >
                        <img
                          src={wp.imageUrl}
                          alt={wp.name}
                          onError={(e) => {
                            if ('svgFallback' in wp && (wp as any).svgFallback) {
                              e.currentTarget.src = (wp as any).svgFallback;
                            }
                          }}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                        {/* Hover Overlay Button */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                          <span className="bg-pink-600/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white/20 flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Preview Fullscreen</span>
                          </span>
                        </div>

                        {isActive && (
                          <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 z-10 border border-white/20">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>ACTIVE</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-pink-200 font-mono">
                          {wp.category.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                            {wp.name}
                          </h4>
                          <button
                            onClick={() => {
                              setPreviewModalWallpaper(wp);
                              soundEngine.playChime('chime');
                            }}
                            title="Open larger preview"
                            className="text-purple-400 hover:text-pink-300 p-1 rounded-lg hover:bg-purple-900/40 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-purple-300/80 line-clamp-2 leading-relaxed">{wp.desc}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-purple-800/30 flex items-center justify-between">
                      <span className="text-[11px] font-mono-timer font-bold text-amber-300">
                        {wp.cost === 0 ? 'Free Default' : `🎟️ ${wp.cost}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setPreviewModalWallpaper(wp);
                            soundEngine.playChime('chime');
                          }}
                          className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/60 transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => onSelectWallpaper(wp)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-pink-600 text-white font-semibold'
                              : isUnlocked
                              ? 'bg-purple-700 hover:bg-purple-600 text-white'
                              : tickets >= wp.cost
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                              : 'bg-purple-900/40 text-purple-400 cursor-not-allowed'
                          }`}
                        >
                          {isActive ? 'Current' : isUnlocked ? 'Apply' : `Unlock`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= FULL-SCREEN WALLPAPER PREVIEW MODAL ================= */}
        {previewModalWallpaper && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewModalWallpaper(null);
            }}
          >
            {/* Modal Container */}
            <div className="w-full max-w-5xl bg-[#130f24] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Top Header Bar */}
              <div className="bg-[#1a1530] border-b border-purple-800/40 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 cursor-pointer" onClick={() => setPreviewModalWallpaper(null)} />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-bold text-purple-200 ml-2 flex items-center gap-1.5 font-mono">
                    <Monitor className="w-3.5 h-3.5 text-pink-400" />
                    <span>Live Desktop Fullscreen Preview: {previewModalWallpaper.name}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-purple-400 font-mono hidden sm:inline">Press ESC to exit</span>
                  <button
                    onClick={() => setPreviewModalWallpaper(null)}
                    className="p-1.5 rounded-xl bg-purple-900/50 hover:bg-rose-900/50 text-purple-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Full Desktop Mockup Canvas */}
              <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] overflow-hidden bg-slate-950 flex items-center justify-center select-none">
                {/* Wallpaper Full Render */}
                <img
                  src={previewModalWallpaper.imageUrl}
                  alt={previewModalWallpaper.name}
                  onError={(e) => {
                    if ('svgFallback' in previewModalWallpaper && (previewModalWallpaper as any).svgFallback) {
                      e.currentTarget.src = (previewModalWallpaper as any).svgFallback;
                    }
                  }}
                  className="w-full h-full object-cover absolute inset-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10" />

                {/* Simulated Desktop OS Elements for Realistic Preview */}
                {/* Top Desktop Bar */}
                <div className="absolute top-0 left-0 right-0 h-7 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between text-[11px] text-white/90 font-medium">
                  <div className="flex items-center gap-3">
                    <span className="font-bold tracking-wide">☕ CoworkingBrew OS</span>
                    <span className="text-white/70 hidden sm:inline">Focus</span>
                    <span className="text-white/70 hidden sm:inline">Music</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    <span>🌸 25:00 Focus</span>
                    <span>🌿 Lofi Rain</span>
                    <span className="bg-white/15 px-2 py-0.5 rounded-md font-bold">10:42 AM</span>
                  </div>
                </div>

                {/* Simulated Floating Sticky Note Widget */}
                <div className="absolute top-12 left-6 bg-amber-100/90 text-amber-950 p-3 rounded-2xl shadow-xl border border-amber-300/40 w-44 backdrop-blur-xs hidden sm:block transform -rotate-1 pointer-events-none">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">📌 Daily Focus</div>
                  <div className="text-xs font-semibold mt-1">1. Ship features 🚀</div>
                  <div className="text-xs font-semibold">2. Drink matcha 🍵</div>
                </div>

                {/* Simulated Focus Timer Widget */}
                <div className="absolute top-12 right-6 bg-black/50 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl w-48 text-white text-center hidden sm:block pointer-events-none">
                  <div className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">⏱️ Sprint Timer</div>
                  <div className="text-2xl font-bold font-mono-timer text-amber-300 mt-0.5">24:18</div>
                  <div className="text-[10px] text-emerald-300">🌿 Deep Focus Mode</div>
                </div>

                {/* Simulated Dock at Bottom */}
                <div className="absolute bottom-4 bg-black/45 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-sm shadow">📝</div>
                  <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-sm shadow">🛍️</div>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-sm shadow">🌐</div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-sm shadow">🎧</div>
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-sm shadow">🐾</div>
                </div>

                {/* Cycling Navigation Buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const filtered = WALLPAPERS.filter((wp) => wallpaperFilter === 'all' || wp.category === wallpaperFilter);
                    const currIdx = filtered.findIndex((w) => w.id === previewModalWallpaper.id);
                    const prevIdx = (currIdx - 1 + filtered.length) % filtered.length;
                    setPreviewModalWallpaper(filtered[prevIdx]);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 backdrop-blur-md shadow-xl transition-transform hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const filtered = WALLPAPERS.filter((wp) => wallpaperFilter === 'all' || wp.category === wallpaperFilter);
                    const currIdx = filtered.findIndex((w) => w.id === previewModalWallpaper.id);
                    const nextIdx = (currIdx + 1) % filtered.length;
                    setPreviewModalWallpaper(filtered[nextIdx]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 backdrop-blur-md shadow-xl transition-transform hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Bottom Control Bar */}
              <div className="bg-[#18132b] border-t border-purple-800/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-bold text-white">{previewModalWallpaper.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-pink-900/60 border border-pink-700/50 text-[10px] text-pink-300 font-mono">
                      {previewModalWallpaper.category.toUpperCase()}
                    </span>
                    {activeWallpaper === previewModalWallpaper.id && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/40 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        CURRENTLY ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-300/80 max-w-xl">{previewModalWallpaper.desc}</p>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono-timer font-bold text-amber-300">
                    {previewModalWallpaper.cost === 0 ? 'Free Default' : `🎟️ ${previewModalWallpaper.cost} Credits`}
                  </span>

                  <button
                    onClick={() => {
                      onSelectWallpaper(previewModalWallpaper);
                      if (unlockedWallpapers.includes(previewModalWallpaper.id) || previewModalWallpaper.cost === 0) {
                        setPreviewModalWallpaper(null);
                      }
                    }}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                      activeWallpaper === previewModalWallpaper.id
                        ? 'bg-pink-600 text-white ring-2 ring-pink-400/50'
                        : unlockedWallpapers.includes(previewModalWallpaper.id)
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60 active:scale-95'
                        : tickets >= previewModalWallpaper.cost
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 active:scale-95'
                        : 'bg-purple-900/40 text-purple-400 cursor-not-allowed'
                    }`}
                  >
                    {activeWallpaper === previewModalWallpaper.id ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Applied to Workstation</span>
                      </>
                    ) : unlockedWallpapers.includes(previewModalWallpaper.id) ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Apply to Workstation</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Unlock Wallpaper (🎟️ {previewModalWallpaper.cost})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
