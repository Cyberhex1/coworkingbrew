import type { useApp } from '../state/store';
import { streak, bestStreak } from '../state/store';

type S = ReturnType<typeof useApp.getState>;

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  reward: number;
  icon: string;
  progress: (s: S) => [number, number];
}

const mins = (s: S) => s.sessions.reduce((a, x) => a + x.minutes, 0);
const done = (s: S) => s.tasks.filter((t) => t.status === 'done').length;

// Real, computed achievements (each pays out once when claimed).
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-focus', name: 'First Brew', desc: 'Finish your first focus session', reward: 5, icon: 'tomato', progress: (s) => [Math.min(1, s.sessions.length), 1] },
  { id: 'ten-sessions', name: 'In the Zone', desc: 'Finish 10 focus sessions', reward: 15, icon: 'tomato', progress: (s) => [Math.min(10, s.sessions.length), 10] },
  { id: 'five-hours', name: 'Deep Roast', desc: 'Focus for 5 hours total', reward: 25, icon: 'coffee', progress: (s) => [Math.min(300, mins(s)), 300] },
  { id: 'twenty-hours', name: 'Café Legend', desc: 'Focus for 20 hours total', reward: 60, icon: 'star', progress: (s) => [Math.min(1200, mins(s)), 1200] },
  { id: 'streak-3', name: 'Regular', desc: 'Focus 3 days in a row', reward: 15, icon: 'calendar', progress: (s) => [Math.min(3, Math.max(streak(s.sessions), bestStreak(s.sessions))), 3] },
  { id: 'streak-7', name: 'Weekly Ritual', desc: 'Focus 7 days in a row', reward: 40, icon: 'calendar', progress: (s) => [Math.min(7, bestStreak(s.sessions)), 7] },
  { id: 'tasks-10', name: 'Checklist Hero', desc: 'Complete 10 tasks', reward: 15, icon: 'check', progress: (s) => [Math.min(10, done(s)), 10] },
  { id: 'book-1', name: 'Bookworm', desc: 'Finish a book from the library', reward: 10, icon: 'book', progress: (s) => [Math.min(1, s.counters.books), 1] },
  { id: 'drinks-5', name: 'Coffee Connoisseur', desc: 'Order 5 drinks at the espresso bar', reward: 10, icon: 'coffee', progress: (s) => [Math.min(5, s.counters.drinks), 5] },
  { id: 'journal-5', name: 'Dear Diary', desc: 'Write 5 journal entries', reward: 15, icon: 'notes', progress: (s) => [Math.min(5, s.journal.length), 5] },
  { id: 'arcade-5', name: 'Break Champion', desc: 'Play 5 arcade games', reward: 5, icon: 'joystick', progress: (s) => [Math.min(5, s.counters.games), 5] },
];
