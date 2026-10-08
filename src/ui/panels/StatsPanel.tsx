import { Window } from '../Window';
import { useApp, focusByDay, streak, bestStreak } from '../../state/store';
import { ACHIEVEMENTS } from '../../data/achievements';
import { PixelIcon } from '../PixelIcon';
import { audio } from '../../audio/engine';

export default function StatsPanel() {
  const s = useApp();
  const week = focusByDay(s.sessions, 7);
  const max = Math.max(60, ...week.map((d) => d.minutes));
  const total = s.sessions.reduce((a, x) => a + x.minutes, 0);
  const done = s.tasks.filter((t) => t.status === 'done').length;

  // 12-week heatmap
  const days = 84;
  const byDay = new Map<string, number>();
  for (const x of s.sessions) {
    const k = new Date(x.at).toDateString();
    byDay.set(k, (byDay.get(k) ?? 0) + x.minutes);
  }
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return { d, m: byDay.get(d.toDateString()) ?? 0 };
  });
  const heat = (m: number) => (m === 0 ? '#ece0c8' : m < 25 ? '#c4e0a8' : m < 75 ? '#8cc06a' : m < 150 ? '#62a356' : '#3f7d4a');

  const claim = (id: string, reward: number) => {
    const st = useApp.getState();
    if (st.achievements.includes(id)) return;
    st.set({ achievements: [...st.achievements, id] });
    st.earn(reward, 'achievement');
    audio.sfx('success');
  };

  return (
    <Window title="Stats & Growth" icon="chart" width="lg" subtitle="Everything here is computed from your real sessions.">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['Focus time', total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}m` : `${total}m`, 'tomato'],
          ['Sessions', s.sessions.length, 'check'],
          ['Streak', `${streak(s.sessions)} days`, 'calendar'],
          ['Best streak', `${bestStreak(s.sessions)} days`, 'star'],
          ['Tasks done', done, 'check'],
          ['Tickets earned', s.ticketsEarned, 'ticket'],
          ['Books finished', s.counters.books, 'book'],
          ['Drinks ordered', s.counters.drinks, 'coffee'],
        ].map(([l, v, icon]) => (
          <div key={l as string} className="px-inset p-2 flex items-center gap-2">
            <PixelIcon name={icon as string} size={22} />
            <div className="leading-tight">
              <div className="font-bold text-[16px]">{v}</div>
              <div className="text-[11px] text-[var(--color-cocoa)]">{l}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-semibold text-[14px] mt-4 mb-1.5">This week</h3>
      <div className="px-inset p-3 flex items-end gap-2 h-[150px]">
        {week.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-[10px] tabular-nums">{d.minutes || ''}</span>
            <div className="w-full border-2 border-[var(--color-ink)]" style={{ height: `${Math.max(3, (d.minutes / max) * 100)}%`, background: d.date === new Date().toDateString() ? 'repeating-linear-gradient(0deg,#d9734e 0 4px,#c0603e 4px 6px)' : 'repeating-linear-gradient(0deg,#e2b04a 0 4px,#c89a3a 4px 6px)' }} />
            <span className="text-[11px]">{d.label}</span>
          </div>
        ))}
      </div>

      <h3 className="font-semibold text-[14px] mt-4 mb-1.5">Last 12 weeks</h3>
      <div className="px-inset p-2 overflow-x-auto">
        <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max">
          {cells.map((c, i) => (
            <div key={i} className="w-3 h-3 border border-[rgba(42,26,31,0.35)]" style={{ background: heat(c.m) }} title={`${c.d.toLocaleDateString()}: ${c.m} min`} />
          ))}
        </div>
      </div>

      <h3 className="font-semibold text-[14px] mt-4 mb-1.5">Achievements</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {ACHIEVEMENTS.map((a) => {
          const [cur, goal] = a.progress(s);
          const claimed = s.achievements.includes(a.id);
          const ready = cur >= goal && !claimed;
          return (
            <li key={a.id} className={`px-inset p-2 flex items-center gap-2 ${claimed ? 'opacity-60' : ready ? 'bg-[#fff2c4] border-[var(--color-gold)]' : ''}`}>
              <PixelIcon name={a.icon} size={22} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px]">{a.name}</div>
                <div className="text-[11px] text-[var(--color-cocoa)]">{a.desc}</div>
                <div className="px-progress mt-1 h-[8px]"><span style={{ width: `${(cur / goal) * 100}%` }} /></div>
              </div>
              {claimed ? <span className="px-chip">✓</span> : (
                <button className="px-btn px-btn-sm" disabled={!ready} onClick={() => claim(a.id, a.reward)}>+{a.reward}🎟</button>
              )}
            </li>
          );
        })}
      </ul>
    </Window>
  );
}
