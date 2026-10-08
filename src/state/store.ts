import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_AVATAR, type AvatarConfig, type PetKind } from '../engine/avatarTypes';
import type { ThemeId, ServerId } from '../engine/themes';
import { ECONOMY, SHOP_BY_ID, STARTER_UNLOCKS, DRINKS, type ShopItem } from '../data/catalog';
import type { StationId, AmbienceId, ChimeKind } from '../audio/engine';
import { toast } from './ui';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export type FocusMode = 'focus' | 'short' | 'long';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  estimate: number; // pomodoros
  spent: number;
  tag: string;
  createdAt: number;
  doneAt?: number;
  rewarded?: boolean;
}

export interface Block {
  id: string;
  date: string;
  start: string; // HH:MM
  end: string;
  title: string;
  color: string;
}

export interface JournalEntry {
  date: string;
  mood: number; // 1..5
  gratitude: string;
  text: string;
  rewarded: boolean;
}

export interface BookEntry {
  id: number; // gutenberg id
  title: string;
  author: string;
  status: 'want' | 'reading' | 'done';
  position: number; // page index
  pages?: number;
  notes: string;
  claimed: boolean;
  addedAt: number;
}

export interface Session {
  at: number;
  minutes: number;
  taskId?: string | null;
}

export interface Settings {
  master: number;
  music: number;
  musicOn: boolean;
  station: StationId;
  ambience: Record<AmbienceId, number>;
  npcs: boolean;
  zoom: number;
  chime: ChimeKind;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  focusMin: number;
  shortMin: number;
  longMin: number;
  longEvery: number;
  showTips: boolean;
}

export interface FocusState {
  mode: FocusMode;
  running: boolean;
  endsAt: number | null;
  remainingMs: number;
  cycle: number; // focus sessions completed in this set
  taskId: string | null;
  totalMs?: number; // length of the session as started (settings changes mid-session don't count)
  boost?: number; // drink boost active when the session started
}

interface AppState {
  // profile
  name: string;
  avatar: AvatarConfig;
  pet: PetKind;
  petName: string;
  deskIndex: number | null;
  tickets: number;
  unlocked: string[];
  deskDecor: string[];
  wallpaper: string;
  osAccent: string;
  onboarded: boolean;
  createdAt: number;
  // world
  theme: ThemeId;
  server: ServerId;
  held: { kind: string; label: string; until: number } | null;
  buff: { drinkId: string; until: number } | null;
  // productivity
  tasks: Task[];
  blocks: Block[];
  journal: JournalEntry[];
  notes: string;
  focus: FocusState;
  sessions: Session[];
  // misc progress
  library: BookEntry[];
  claimedBooks: number[]; // books that already paid out (survives removing them from the shelf)
  hydration: { date: string; glasses: number };
  caps: { date: string; taskTickets: number; gameTickets: number };
  ticketsEarned: number;
  achievements: string[];
  localChangedAt: number; // last time tickets/unlocks/look changed locally (for cloud merge)
  counters: { drinks: number; snacks: number; games: number; books: number; prints: number };
  settings: Settings;

  // actions
  set: (p: Partial<AppState>) => void;
  setSettings: (p: Partial<Settings>) => void;
  earn: (n: number, reason: string, silent?: boolean) => void;
  spend: (n: number) => boolean;
  buy: (itemId: string) => boolean;
  equip: (item: ShopItem) => void;
  // tasks
  addTask: (title: string, opts?: Partial<Task>) => string;
  updateTask: (id: string, p: Partial<Task>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;
  // focus
  startFocus: (mode?: FocusMode) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  resetFocus: () => void;
  skipFocus: () => void;
  completeFocus: () => { mode: FocusMode; minutes: number; tickets: number } | null;
  setFocusTask: (taskId: string | null) => void;
  setFocusMode: (mode: FocusMode) => void;
  // journal / planner
  saveJournal: (e: Omit<JournalEntry, 'rewarded'>) => void;
  addBlock: (b: Omit<Block, 'id'>) => void;
  updateBlock: (id: string, p: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  // misc
  drinkWater: () => boolean;
  orderDrink: (id: string) => boolean;
  holdItem: (kind: string, label: string, minutes?: number) => void;
  awardGame: (n: number, game: string) => number;
  upsertBook: (b: Partial<BookEntry> & { id: number }) => void;
  removeBook: (id: number) => void;
}

const durations = (s: Settings, m: FocusMode) => (m === 'focus' ? s.focusMin : m === 'short' ? s.shortMin : s.longMin) * 60_000;

const defaultSettings: Settings = {
  master: 0.7,
  music: 0.6,
  musicOn: true,
  station: 'rainy-cafe',
  ambience: { rain: 0, cafe: 0.3, fire: 0, birds: 0, crickets: 0, water: 0, vinyl: 0.2 },
  npcs: true,
  zoom: 3,
  chime: 'kalimba',
  autoStartBreaks: true,
  autoStartFocus: false,
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  showTips: true,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      name: '',
      avatar: DEFAULT_AVATAR,
      pet: 'none',
      petName: '',
      deskIndex: null,
      tickets: ECONOMY.startingTickets,
      unlocked: [...STARTER_UNLOCKS],
      deskDecor: ['mug'],
      wallpaper: 'meadow',
      osAccent: '#d9734e',
      onboarded: false,
      createdAt: Date.now(),
      theme: 'tech_hub',
      server: 'silicon',
      held: null,
      buff: null,
      tasks: [],
      blocks: [],
      journal: [],
      notes: '',
      focus: { mode: 'focus', running: false, endsAt: null, remainingMs: 25 * 60_000, cycle: 0, taskId: null },
      sessions: [],
      library: [],
      claimedBooks: [],
      hydration: { date: today(), glasses: 0 },
      caps: { date: today(), taskTickets: 0, gameTickets: 0 },
      ticketsEarned: 0,
      achievements: [],
      localChangedAt: 0,
      counters: { drinks: 0, snacks: 0, games: 0, books: 0, prints: 0 },
      settings: defaultSettings,

      set: (p) => set(p),
      setSettings: (p) => {
        const old = get().settings;
        const s = { ...old, ...p };
        set({ settings: s });
        const f = get().focus;
        // only re-sync an untouched timer (never wipe a paused session's progress)
        if (!f.running && f.endsAt === null && f.remainingMs === durations(old, f.mode) && ('focusMin' in p || 'shortMin' in p || 'longMin' in p)) {
          set({ focus: { ...f, remainingMs: durations(s, f.mode) } });
        }
      },

      earn: (n, reason, silent) => {
        if (n <= 0) return;
        set((s) => ({ tickets: s.tickets + n, ticketsEarned: s.ticketsEarned + n }));
        if (!silent) toast(`+${n} tickets · ${reason}`, 'ticket');
      },
      spend: (n) => {
        if (get().tickets < n) {
          toast(`Not enough tickets (need ${n})`, 'error');
          return false;
        }
        set((s) => ({ tickets: s.tickets - n }));
        return true;
      },
      buy: (itemId) => {
        const item = SHOP_BY_ID[itemId];
        if (!item) return false;
        if (get().unlocked.includes(itemId) || item.price === 0) return true;
        if (!get().spend(item.price)) return false;
        set((s) => ({ unlocked: [...s.unlocked, itemId] }));
        toast(`Unlocked ${item.name}!`, 'success');
        return true;
      },
      equip: (item) => {
        const s = get();
        switch (item.category) {
          case 'hat': set({ avatar: { ...s.avatar, hat: item.value as AvatarConfig['hat'] } }); break;
          case 'glasses': set({ avatar: { ...s.avatar, glasses: item.value as AvatarConfig['glasses'] } }); break;
          case 'extra': set({ avatar: { ...s.avatar, extra: item.value as AvatarConfig['extra'] } }); break;
          case 'top': set({ avatar: { ...s.avatar, top: item.value as AvatarConfig['top'] } }); break;
          case 'pet': set({ pet: item.value as PetKind, petName: s.petName || defaultPetName(item.value as PetKind) }); break;
          case 'decor':
            set({ deskDecor: s.deskDecor.includes(item.value) ? s.deskDecor.filter((d) => d !== item.value) : [...s.deskDecor, item.value] });
            break;
          case 'wallpaper': set({ wallpaper: item.value }); break;
        }
      },

      addTask: (title, opts) => {
        const id = uid();
        const t: Task = { id, title: title.trim().slice(0, 140), status: 'todo', estimate: 1, spent: 0, tag: '', createdAt: Date.now(), ...opts };
        set((s) => ({ tasks: [t, ...s.tasks] }));
        return id;
      },
      updateTask: (id, p) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
      setTaskStatus: (id, status) => {
        const t = get().tasks.find((x) => x.id === id);
        if (!t) return;
        const doneNow = status === 'done' && t.status !== 'done';
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, status, doneAt: status === 'done' ? Date.now() : undefined, rewarded: x.rewarded || doneNow } : x)),
        }));
        if (doneNow && !t.rewarded) {
          const caps = rollCaps(get().caps);
          if (caps.taskTickets < ECONOMY.taskDailyCap) {
            set({ caps: { ...caps, taskTickets: caps.taskTickets + ECONOMY.taskComplete } });
            get().earn(ECONOMY.taskComplete, 'task done');
          } else {
            set({ caps });
            toast('Task done ✔', 'success');
          }
        }
        if (get().focus.taskId === id && status === 'done') set((s) => ({ focus: { ...s.focus, taskId: null } }));
      },
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), focus: s.focus.taskId === id ? { ...s.focus, taskId: null } : s.focus })),

      startFocus: (mode) => {
        const s = get();
        const m = mode ?? s.focus.mode;
        const ms = mode && mode !== s.focus.mode ? durations(s.settings, m) : s.focus.endsAt === null && !s.focus.running && s.focus.remainingMs > 0 ? s.focus.remainingMs : durations(s.settings, m);
        const fresh = !(s.focus.endsAt === null && !s.focus.running && s.focus.remainingMs > 0 && s.focus.remainingMs < durations(s.settings, m) && m === s.focus.mode);
        const boost = s.buff && s.buff.until > Date.now() ? DRINKS.find((d) => d.id === s.buff!.drinkId)?.boost ?? 0 : 0;
        set({
          focus: {
            ...s.focus, mode: m, running: true, endsAt: Date.now() + ms, remainingMs: ms,
            totalMs: fresh || !s.focus.totalMs ? ms : s.focus.totalMs,
            boost: fresh || s.focus.boost == null ? boost : s.focus.boost,
          },
        });
      },
      pauseFocus: () => {
        const f = get().focus;
        if (!f.running || !f.endsAt) return;
        set({ focus: { ...f, running: false, remainingMs: Math.max(0, f.endsAt - Date.now()), endsAt: null } });
      },
      resumeFocus: () => {
        const f = get().focus;
        if (f.running) return;
        set({ focus: { ...f, running: true, endsAt: Date.now() + f.remainingMs } });
      },
      resetFocus: () => {
        const s = get();
        set({ focus: { ...s.focus, running: false, endsAt: null, remainingMs: durations(s.settings, s.focus.mode) } });
      },
      skipFocus: () => {
        const s = get();
        const next: FocusMode = s.focus.mode === 'focus' ? ((s.focus.cycle + 1) % s.settings.longEvery === 0 ? 'long' : 'short') : 'focus';
        set({ focus: { ...s.focus, mode: next, running: false, endsAt: null, remainingMs: durations(s.settings, next) } });
      },
      completeFocus: () => {
        const s = get();
        const f = s.focus;
        if (!f.running) return null;
        const minutes = Math.round((f.totalMs ?? durations(s.settings, f.mode)) / 60_000);
        let tickets = 0;
        let cycle = f.cycle;
        let next: FocusMode;
        if (f.mode === 'focus') {
          cycle += 1;
          const boost = f.boost ?? 0;
          tickets = Math.max(1, Math.round((minutes / 5) * ECONOMY.focusTicketsPer5Min * (1 + boost)));
          set((st) => ({
            sessions: [...st.sessions, { at: Date.now(), minutes, taskId: f.taskId }].slice(-2000),
            tasks: f.taskId ? st.tasks.map((t) => (t.id === f.taskId ? { ...t, spent: t.spent + 1, status: t.status === 'todo' ? 'doing' : t.status } : t)) : st.tasks,
          }));
          get().earn(tickets, `${minutes} min focus${boost ? ' ☕ boost' : ''}`);
          next = cycle % s.settings.longEvery === 0 ? 'long' : 'short';
        } else {
          next = 'focus';
        }
        const auto = next === 'focus' ? s.settings.autoStartFocus : s.settings.autoStartBreaks;
        const ms = durations(s.settings, next);
        set({ focus: { ...get().focus, mode: next, cycle, running: auto, endsAt: auto ? Date.now() + ms : null, remainingMs: ms } });
        return { mode: f.mode, minutes, tickets };
      },
      setFocusTask: (taskId) => set((s) => ({ focus: { ...s.focus, taskId } })),
      setFocusMode: (mode) => {
        const s = get();
        set({ focus: { ...s.focus, mode, running: false, endsAt: null, remainingMs: durations(s.settings, mode) } });
      },

      saveJournal: (e) => {
        const existing = get().journal.find((j) => j.date === e.date);
        const rewarded = existing?.rewarded ?? false;
        const qualifies = e.text.trim().length > 10 || e.gratitude.trim().length > 3;
        const entry: JournalEntry = { ...e, rewarded: rewarded || qualifies };
        set((s) => ({ journal: [entry, ...s.journal.filter((j) => j.date !== e.date)].slice(0, 400) }));
        if (!rewarded && qualifies) get().earn(ECONOMY.journalDaily, 'journal entry');
        else toast('Journal saved', 'success');
      },
      addBlock: (b) => set((s) => ({ blocks: [...s.blocks, { ...b, id: uid() }] })),
      updateBlock: (id, p) => set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...p } : b)) })),
      removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

      drinkWater: () => {
        const h = get().hydration.date === today() ? get().hydration : { date: today(), glasses: 0 };
        if (h.glasses >= ECONOMY.glassesPerDay) {
          set({ hydration: h });
          toast('Fully hydrated today 💧', 'info');
          return false;
        }
        set({ hydration: { ...h, glasses: h.glasses + 1 } });
        get().earn(ECONOMY.glassOfWater, `water ${h.glasses + 1}/${ECONOMY.glassesPerDay}`);
        return true;
      },
      orderDrink: (id) => {
        const d = DRINKS.find((x) => x.id === id);
        if (!d) return false;
        if (!get().spend(d.price)) return false;
        set((s) => ({
          buff: { drinkId: id, until: Date.now() + 60 * 60_000 },
          counters: { ...s.counters, drinks: s.counters.drinks + 1 },
        }));
        get().holdItem(`cup:${d.cup}:${d.lid}`, d.name, 20);
        return true;
      },
      holdItem: (kind, label, minutes = 15) => set({ held: { kind, label, until: Date.now() + minutes * 60_000 } }),
      awardGame: (n, game) => {
        const caps = rollCaps(get().caps);
        const room = Math.max(0, ECONOMY.gameDailyCap - caps.gameTickets);
        const give = Math.min(room, Math.max(0, Math.round(n)));
        set((s) => ({ caps: { ...caps, gameTickets: caps.gameTickets + give }, counters: { ...s.counters, games: s.counters.games + 1 } }));
        if (give > 0) get().earn(give, game);
        else if (n > 0) toast('Daily arcade ticket cap reached — playing for fun now!', 'info');
        return give;
      },
      upsertBook: (b) => {
        const lib = get().library;
        const ex = lib.find((x) => x.id === b.id);
        if (ex) {
          const merged = { ...ex, ...b };
          set({ library: lib.map((x) => (x.id === b.id ? merged : x)) });
          if (merged.status === 'done' && !ex.claimed && !get().claimedBooks.includes(b.id)) {
            set((s) => ({
              library: s.library.map((x) => (x.id === b.id ? { ...x, claimed: true } : x)),
              claimedBooks: [...s.claimedBooks, b.id],
              counters: { ...s.counters, books: s.counters.books + 1 },
            }));
            get().earn(ECONOMY.bookFinished, `finished "${merged.title}"`);
          }
        } else {
          const entry: BookEntry = { title: 'Untitled', author: 'Unknown', status: 'want', position: 0, notes: '', addedAt: Date.now(), ...b, claimed: get().claimedBooks.includes(b.id) };
          set({ library: [entry, ...lib] });
        }
      },
      removeBook: (id) => set((s) => ({ library: s.library.filter((x) => x.id !== id) })),
    }),
    {
      name: 'coworkingbrew:v2',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => {
        // don't persist functions; keep everything else
        const { set: _s, ...rest } = s as AppState & Record<string, unknown>;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<AppState>;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}), ambience: { ...current.settings.ambience, ...(p.settings?.ambience ?? {}) } },
          avatar: { ...current.avatar, ...(p.avatar ?? {}) },
          counters: { ...current.counters, ...(p.counters ?? {}) },
        };
      },
    },
  ),
);

// Stamp local changes to the things that sync to the cloud, so sign-in can
// tell whether the cloud copy or this browser is newer.
useApp.subscribe((s, p) => {
  if (s.tickets !== p.tickets || s.unlocked !== p.unlocked || s.avatar !== p.avatar || s.deskDecor !== p.deskDecor || s.pet !== p.pet || s.wallpaper !== p.wallpaper) {
    if (s.localChangedAt === p.localChangedAt) useApp.setState({ localChangedAt: Date.now() });
  }
});

function rollCaps(c: AppState['caps']) {
  return c.date === today() ? c : { date: today(), taskTickets: 0, gameTickets: 0 };
}

export function defaultPetName(k: PetKind) {
  return ({ cat: 'Mochi', shiba: 'Kuma', bunny: 'Dango', duck: 'Quackers', capybara: 'Yuzu', ghost: 'Boo', dragon: 'Ember', frog: 'Pickle', none: '' } as Record<PetKind, string>)[k];
}

/** Focus minutes per day for the last n days (oldest first). */
export function focusByDay(sessions: Session[], days = 7) {
  const out: { date: string; label: string; minutes: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toDateString();
    const minutes = sessions.filter((s) => new Date(s.at).toDateString() === key).reduce((a, s) => a + s.minutes, 0);
    out.push({ date: key, label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), minutes });
  }
  return out;
}

export function streak(sessions: Session[]) {
  const days = new Set(sessions.map((s) => new Date(s.at).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function bestStreak(sessions: Session[]) {
  const days = [...new Set(sessions.map((s) => { const d = new Date(s.at); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }))].sort((a, b) => a - b);
  let best = 0, cur = 0, prev = 0;
  for (const t of days) {
    cur = prev && t - prev <= 86_400_000 + 3_600_000 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = t;
  }
  return best;
}
