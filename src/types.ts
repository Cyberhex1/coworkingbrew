export type TimeOfDay = 'day' | 'sunset' | 'night' | 'rainy';

export type ActivityType =
  | 'coding'
  | 'typing'
  | 'reading'
  | 'writing'
  | 'drawing'
  | 'tea'
  | 'meditating'
  | 'sleeping';

export type MoodType = 'focused' | 'calm' | 'energetic' | 'tired' | 'proud';

export type DisplayMode = 'full' | 'docked' | 'sticker' | 'zen';

export interface AvatarConfig {
  name?: string;
  role?: string;
  bio?: string;
  vibeBadge?: string;
  skinColor: string;
  hairStyle: 'messy' | 'bob' | 'spiky' | 'braids' | 'ponytail' | 'fringe' | 'afro' | 'short';
  hairColor: string;
  eyeStyle: 'sparkle' | 'sleepy' | 'happy' | 'wink' | 'focused' | 'glasses';
  eyeColor: string;
  mouthStyle: 'smile' | 'cat' | 'bubblegum' | 'tea' | 'dot' | 'open';
  hat: 'none' | 'frog' | 'beanie' | 'catears' | 'straw' | 'wizard' | 'headphones' | 'beret' | 'crown';
  glasses: 'none' | 'round' | 'square' | 'sunglasses' | 'monocle' | 'cyber';
  clothing: 'hoodie' | 'sweater' | 'overalls' | 'shirt' | 'cardigan' | 'kimono' | 'dungarees';
  clothingColor: string;
  backpack: 'none' | 'bear' | 'cat' | 'classic' | 'wings';
  tail: 'none' | 'cat' | 'fox' | 'puppy' | 'bunny' | 'dragon';
  activity: ActivityType;
  statusText: string;
  mood: MoodType;
}

export interface DeskConfig {
  deskStyle: 'wood' | 'sakura' | 'cyber' | 'walnut' | 'crystal' | 'vintage';
  deskAccessory: 'mug' | 'succulent' | 'mushroom_lamp' | 'lava_lamp' | 'crystal' | 'gameboy' | 'bonsai';
  petType: 'none' | 'shiba' | 'cat' | 'ghost' | 'duck' | 'capybara' | 'dragon';
  petColor: string;
  petName: string;
}

export interface RoomPeer {
  id: string;
  name: string;
  isUser: boolean;
  avatar: AvatarConfig;
  desk: DeskConfig;
  currentTask: string;
  focusMinutesToday: number;
  streakDays: number;
  tickets: number;
  isMuted?: boolean;
  reactionEmoji?: string;
  reactionTimestamp?: number;
  deskIndex: number;
}

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoro: boolean;
  tickingSound: boolean;
  alarmSound: 'bell' | 'chime' | 'soft_gong' | 'digital';
  volume: number;
}

export interface TaskItem {
  id: string;
  title: string;
  category: 'Work' | 'Study' | 'Creative' | 'Health' | 'Coding' | 'General';
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  gratitude: string;
  reflection: string;
  focusMinutes: number;
  completedTasksCount: number;
  tags: string[];
}

export interface TimeBlock {
  id: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  category: string;
  completed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'hat' | 'clothing' | 'accessory' | 'pet' | 'desk' | 'room' | 'tail';
  cost: number;
  icon: string;
  description: string;
  unlocked: boolean;
  targetKey: string;
  targetValue: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarSeed?: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface CoWorkingRoom {
  id: string;
  name: string;
  code: string;
  theme: 'office' | 'loft_office' | 'tech_hub' | 'tea_loft' | 'treehouse' | 'lilypad' | 'cafe' | 'greenhouse' | 'arcade';
  topic: string;
  timeOfDay: TimeOfDay;
  isPrivate: boolean;
  creatorName: string;
  maxCapacity: number;
}

export interface AudioTrackVolume {
  lofiChords: number;
  rain: number;
  fireplace: number;
  cafeMurmur: number;
  forestBirds: number;
  nightCrickets: number;
  oceanWaves: number;
  clockTick: number;
  master: number;
  isPlaying: boolean;
}

export interface CaughtFish {
  id: string;
  name: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  ticketValue: number;
  weight: string;
  caughtAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rewardTickets: number;
}
