import { useEffect, useRef, useState } from 'react';
import { PixelIcon } from './PixelIcon';
import { useApp } from '../state/store';
import { useUI, type PanelId } from '../state/ui';
import { THEME_BY_ID, SERVERS } from '../engine/themes';
import { game } from '../engine/gameRef';
import { audio } from '../audio/engine';
import { sendChat } from '../net/chat';

export function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- room card (top-left)
export function RoomCard() {
  const theme = useApp((s) => s.theme);
  const server = useApp((s) => s.server);
  const zone = useUI((s) => s.zone);
  const online = useUI((s) => s.online);
  const now = useNow(15_000);
  const t = THEME_BY_ID[theme];
  const sv = SERVERS.find((x) => x.id === server)?.name ?? server;
  return (
    <button
      className="px-shadow text-left pointer-events-auto"
      onClick={() => { audio.sfx('open'); useUI.getState().openPanel('rooms'); }}
      title="Switch rooms"
    >
      <div className="px-panel px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-2.5 hover:bg-[#fff8e8]">
        <PixelIcon name={t.timeOfDay === 'night' ? 'moon' : t.timeOfDay === 'rainy' ? 'water' : 'sun'} size={28} />
        <div className="leading-tight">
          <div className="font-semibold text-[13px] sm:text-[15px] whitespace-nowrap">{t.short}</div>
          <div className="text-[11px] text-[var(--color-cocoa)] flex items-center gap-1.5 whitespace-nowrap">
            <span>{sv}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{zone || 'Entrance'}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
        {online.signedIn && (
          <span className="px-chip ml-1 bg-[var(--color-mint)]" title="People online in this room">
            {online.count} online
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------- top-right cluster
export function TopRight() {
  const tickets = useApp((s) => s.tickets);
  const musicOn = useApp((s) => s.settings.musicOn);
  const signedIn = useUI((s) => s.online.signedIn);
  const prev = useRef(tickets);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (tickets > prev.current) {
      setBump(true);
      audio.sfx('coin');
      const id = setTimeout(() => setBump(false), 400);
      prev.current = tickets;
      return () => clearTimeout(id);
    }
    prev.current = tickets;
  }, [tickets]);
  const open = (p: PanelId) => { audio.sfx('open'); useUI.getState().openPanel(p); };
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
      <button className="px-btn" onClick={() => open('shop')} title="Ticket shop" style={bump ? { transform: 'translateY(-3px)' } : undefined}>
        <PixelIcon name="ticket" size={18} />
        <span className="tabular-nums">{tickets}</span>
      </button>
      <button
        className="px-btn px-btn-icon"
        onClick={() => {
          const on = !useApp.getState().settings.musicOn;
          useApp.getState().setSettings({ musicOn: on });
          audio.sfx('click');
        }}
        title={musicOn ? 'Mute music (M)' : 'Play music (M)'}
        aria-label="Toggle music"
      >
        <PixelIcon name={musicOn ? 'soundOn' : 'soundOff'} size={20} />
      </button>
      <button className="px-btn px-btn-icon" onClick={() => open('settings')} title="Settings" aria-label="Settings">
        <PixelIcon name="gear" size={20} />
      </button>
      <button className="px-btn px-btn-icon" onClick={() => open('account')} title={signedIn ? 'Account' : 'Sign in to sync & see others'} aria-label="Account">
        <PixelIcon name="user" size={20} />
        {!signedIn && <span className="hidden md:inline text-[12px]">Sign in</span>}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- focus widget
export function FocusWidget() {
  const focus = useApp((s) => s.focus);
  const tasks = useApp((s) => s.tasks);
  const settings = useApp((s) => s.settings);
  const now = useNow(250);
  const total = (focus.mode === 'focus' ? settings.focusMin : focus.mode === 'short' ? settings.shortMin : settings.longMin) * 60_000;
  const remaining = focus.running && focus.endsAt ? focus.endsAt - now : focus.remainingMs;
  const progress = 1 - remaining / total;
  const task = tasks.find((t) => t.id === focus.taskId);
  const app = useApp.getState();
  const isBreak = focus.mode !== 'focus';
  const label = focus.mode === 'focus' ? 'Focus' : focus.mode === 'short' ? 'Short break' : 'Long break';
  const started = focus.running || focus.endsAt !== null || remaining < total - 500;

  const start = () => startFocusAndGo();

  return (
    <div className="px-shadow pointer-events-auto">
      <div className={`px-panel px-3 py-2 w-[250px] ${isBreak ? 'bg-[#eaf6e4]' : ''}`}>
        <div className="flex items-center gap-2">
          <PixelIcon name={isBreak ? 'coffee' : 'tomato'} size={22} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold tabular-nums leading-none tracking-wide">{fmt(remaining)}</span>
              <span className="px-tiny text-[var(--color-cocoa)]">{label}</span>
            </div>
          </div>
          {focus.running ? (
            <button className="px-btn px-btn-icon px-btn-sm" onClick={() => { audio.sfx('click'); app.pauseFocus(); }} title="Pause (F)" aria-label="Pause">
              <PixelIcon name="pause" size={16} />
            </button>
          ) : (
            <button className="px-btn px-btn-icon px-btn-sm px-btn-green" onClick={() => (focus.endsAt === null && started ? (audio.sfx('click'), app.resumeFocus()) : start())} title="Start (F)" aria-label="Start">
              <PixelIcon name="play" size={16} />
            </button>
          )}
          {started && (
            <button className="px-btn px-btn-icon px-btn-sm" onClick={() => { audio.sfx('click'); app.resetFocus(); }} title="Reset" aria-label="Reset">
              <PixelIcon name="reset" size={16} />
            </button>
          )}
          <button className="px-btn px-btn-icon px-btn-sm" onClick={() => { audio.sfx('click'); app.skipFocus(); }} title="Skip to next" aria-label="Skip">
            <PixelIcon name="skip" size={16} />
          </button>
        </div>
        <div className="px-progress mt-2"><span style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} /></div>
        <div className="mt-1.5 text-[11px] leading-tight flex items-center gap-1 text-[var(--color-cocoa)]">
          {isBreak ? (
            <span>Stretch, sip something, play a game — you earned it.</span>
          ) : task ? (
            <span className="truncate">On: <b className="text-[var(--color-ink)]">{task.title}</b></span>
          ) : (
            <button className="underline decoration-dotted hover:text-[var(--color-ink)]" onClick={() => useUI.getState().openPanel('tasks')}>
              Pick a task to focus on…
            </button>
          )}
          <span className="ml-auto shrink-0">
            {Array.from({ length: settings.longEvery }).map((_, i) => (
              <span key={i} className={i < focus.cycle % settings.longEvery ? 'text-[var(--color-tomato)]' : 'opacity-30'}>●</span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- interaction prompt
export function Prompt() {
  const near = useUI((s) => s.near);
  const seatId = useUI((s) => s.seatId);
  const panel = useUI((s) => s.panel);
  if (panel) return null;
  if (seatId) {
    return (
      <div className="px-panel px-3 py-1.5 text-[13px] flex items-center gap-2 pointer-events-auto">
        <span className="px-kbd">WASD</span> stand up
        {seatId.startsWith('desk-') && (
          <>
            <span className="opacity-40">·</span>
            <button className="flex items-center gap-1.5 hover:underline" onClick={() => useUI.getState().openPanel('brewos')}>
              <span className="px-kbd">E</span> open BrewOS
            </button>
          </>
        )}
      </div>
    );
  }
  if (!near) return null;
  return (
    <button className="px-panel px-3 py-1.5 text-[14px] flex items-center gap-2 pointer-events-auto px-in hover:bg-[#fff8e8]" onClick={() => game()?.interact()}>
      <span className="px-kbd">E</span>
      <span className="font-semibold">{near.verb}</span>
      <span className="text-[var(--color-cocoa)]">· {near.name}</span>
    </button>
  );
}

// ---------------------------------------------------------------- dock
const DOCK: { id: string; icon: string; label: string; key?: string }[] = [
  { id: 'desk', icon: 'desk', label: 'My desk', key: 'G' },
  { id: 'tasks', icon: 'check', label: 'Tasks', key: 'T' },
  { id: 'record', icon: 'music', label: 'Music' },
  { id: 'shop', icon: 'bag', label: 'Shop' },
  { id: 'stats', icon: 'chart', label: 'Stats' },
  { id: 'rooms', icon: 'door', label: 'Rooms' },
  { id: 'help', icon: 'help', label: 'Help' },
];

/** Start (or resume) the timer and, for focus sessions, walk to your desk. */
export function startFocusAndGo() {
  const app = useApp.getState();
  void audio.unlock();
  audio.sfx('success');
  app.startFocus();
  const ui = useUI.getState();
  const atDesk = ui.sittingDesk != null && ui.sittingDesk === app.deskIndex;
  if (app.focus.mode === 'focus' && !atDesk) goToMyDesk();
}

export function goToMyDesk() {
  const g = game();
  if (!g) return;
  const d = useApp.getState().deskIndex;
  if (d != null && !g.deskOwner(d)) g.goToDesk(d);
  else {
    const free = [1, 2, 3, 4, 5, 6, 7].find((i) => !g.deskOwner(i));
    if (free != null) g.goToDesk(free);
  }
}

export function Dock() {
  const panel = useUI((s) => s.panel);
  return (
    <nav className="px-shadow pointer-events-auto" aria-label="Main">
      <div className="px-panel flex items-end gap-0.5 sm:gap-1 px-1.5 py-1.5">
        {DOCK.map((d) => (
          <button
            key={d.id}
            className={`group relative flex flex-col items-center gap-0.5 px-1.5 sm:px-2.5 py-1 hover:bg-[var(--color-paper-2)] ${panel === d.id ? 'bg-[var(--color-paper-3)]' : ''}`}
            onClick={() => {
              audio.unlock();
              audio.sfx('open');
              if (d.id === 'desk') goToMyDesk();
              else useUI.getState().openPanel(d.id as PanelId);
            }}
            title={d.key ? `${d.label} (${d.key})` : d.label}
          >
            <PixelIcon name={d.icon} size={28} className="group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[10px] leading-none hidden sm:block">{d.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------- camera controls
export function CameraControls() {
  return (
    <div className="flex flex-col gap-1.5 pointer-events-auto">
      <div className="flex gap-1.5">
        <button className="px-btn px-btn-icon px-btn-sm" onClick={() => game()?.rotate(-1)} title="Rotate view (Q)" aria-label="Rotate left"><PixelIcon name="rotL" size={16} /></button>
        <button className="px-btn px-btn-icon px-btn-sm" onClick={() => game()?.rotate(1)} title="Rotate view (R)" aria-label="Rotate right"><PixelIcon name="rotR" size={16} /></button>
      </div>
      <div className="flex gap-1.5">
        <button className="px-btn px-btn-icon px-btn-sm" onClick={() => zoom(1)} title="Zoom in (+)" aria-label="Zoom in"><PixelIcon name="plus" size={16} /></button>
        <button className="px-btn px-btn-icon px-btn-sm" onClick={() => zoom(-1)} title="Zoom out (-)" aria-label="Zoom out"><PixelIcon name="minus" size={16} /></button>
      </div>
    </div>
  );
}

function zoom(d: number) {
  const z = Math.max(2, Math.min(6, useApp.getState().settings.zoom + d));
  useApp.getState().setSettings({ zoom: z });
}

// ---------------------------------------------------------------- toasts
export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="flex flex-col items-center gap-1.5" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-panel px-3 py-1.5 text-[13px] flex items-center gap-2 px-in ${t.kind === 'error' ? 'bg-[#fbe0d8]' : t.kind === 'ticket' ? 'bg-[#fff2c4]' : t.kind === 'success' ? 'bg-[#e4f4dc]' : ''}`}
        >
          <PixelIcon name={t.kind === 'ticket' ? 'ticket' : t.kind === 'error' ? 'close' : t.kind === 'success' ? 'star' : 'sparkle'} size={16} />
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- chat
export function Chat() {
  const chat = useUI((s) => s.chat);
  const open = useUI((s) => s.chatOpen);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const now = useNow(5000);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  const recent = open ? chat.slice(-12) : chat.filter((m) => now - m.at < 25_000).slice(-4);
  return (
    <div className="pointer-events-auto w-[300px] max-w-[70vw] flex flex-col gap-1">
      <div className={`flex flex-col gap-1 ${open ? 'px-panel p-2 max-h-[240px] overflow-y-auto' : ''}`}>
        {recent.map((m) => (
          <div key={m.id} className={`text-[12px] leading-snug ${open ? '' : 'px-panel px-2 py-1 px-in'}`}>
            {m.system ? (
              <span className="text-[var(--color-cocoa)] italic">{m.text}</span>
            ) : (
              <>
                <b>{m.from}:</b> {m.text}
              </>
            )}
          </div>
        ))}
        {open && !recent.length && <div className="text-[12px] text-[var(--color-cocoa)]">Say hi to the room 👋 Messages appear as bubbles over your head.</div>}
      </div>
      {open ? (
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) sendChat(text.trim());
            setText('');
            useUI.getState().set({ chatOpen: false });
          }}
        >
          <input
            ref={inputRef}
            className="px-input text-[13px] py-1.5"
            value={text}
            maxLength={200}
            placeholder="Say something…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') useUI.getState().set({ chatOpen: false }); }}
            onBlur={() => setTimeout(() => useUI.getState().set({ chatOpen: false }), 150)}
          />
          <button className="px-btn px-btn-sm" onMouseDown={(e) => e.preventDefault()}>Send</button>
        </form>
      ) : (
        <button className="px-btn px-btn-sm self-start" onClick={() => useUI.getState().set({ chatOpen: true })} title="Chat (Enter)">
          <PixelIcon name="chat" size={16} /> <span className="hidden sm:inline">Chat</span> <span className="px-kbd ml-1 hidden sm:inline-flex">↵</span>
        </button>
      )}
    </div>
  );
}
