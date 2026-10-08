import { audio } from '../../../audio/engine';
import { useApp } from '../../../state/store';
import type { GameId, SfxName } from './types';

const BEST_KEY = 'cb:arcade-best';

export type Bests = Partial<Record<GameId, number>>;

export function loadBests(): Bests {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Bests = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k as GameId] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Store a score; returns true if it is a new best. */
export function saveBest(id: GameId, score: number): boolean {
  const bests = loadBests();
  const prev = bests[id] ?? 0;
  if (score <= prev) return false;
  bests[id] = score;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(bests));
  } catch {
    /* storage unavailable: best only lives for this session */
  }
  return true;
}

export function sfx(name: SfxName) {
  try {
    audio.sfx(name);
  } catch {
    /* audio is optional */
  }
}

/**
 * Ticket policy: games always pay out, but the full value is reserved for
 * Pomodoro breaks. Outside a break the payout is halved (rounded up), so a
 * break effectively doubles your tickets.
 */
export function ticketsFor(base: number, onBreak: boolean) {
  const b = Math.max(0, Math.round(base));
  return onBreak ? b : Math.ceil(b / 2);
}

/** On a Pomodoro break = a running short/long break timer. */
export function isOnBreak() {
  const f = useApp.getState().focus;
  return f.mode !== 'focus' && f.running;
}
