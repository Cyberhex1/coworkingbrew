import { useState } from 'react';
import { useApp, today } from '../../../state/store';
import { useNow } from '../../HUD';
import { PixelIcon } from '../../PixelIcon';
import { audio } from '../../../audio/engine';

const COLORS = ['#d9734e', '#e2b04a', '#62a356', '#5b85b8', '#a98ac4', '#d97a86'];
const START = 7, END = 23;
const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + (m || 0); };
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function PlannerApp() {
  const blocks = useApp((s) => s.blocks);
  const { addBlock, removeBlock } = useApp.getState();
  const [day, setDay] = useState(today());
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(() => { const d = new Date(); return `${String(Math.min(22, d.getHours() + 1)).padStart(2, '0')}:00`; });
  const [end, setEnd] = useState(() => { const d = new Date(); return `${String(Math.min(23, d.getHours() + 2)).padStart(2, '0')}:00`; });
  const [color, setColor] = useState(COLORS[0]);
  const now = useNow(60_000);
  const dayBlocks = blocks.filter((b) => b.date === day).sort((a, b) => toMin(a.start) - toMin(b.start));
  const H = 28; // px per hour
  const nowD = new Date(now);
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  const shift = (n: number) => { const d = new Date(day + 'T12:00'); d.setDate(d.getDate() + n); setDay(dateKey(d)); };
  const label = new Date(day + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="p-2 flex flex-col gap-2 h-full min-h-0">
      <div className="flex items-center gap-1">
        <button className="px-btn px-btn-sm" onClick={() => shift(-1)} aria-label="Previous day">◂</button>
        <div className="flex-1 text-center font-semibold text-[14px]">{label}{day === today() && <span className="px-chip ml-2 bg-[var(--color-gold-2)]">today</span>}</div>
        <button className="px-btn px-btn-sm" onClick={() => shift(1)} aria-label="Next day">▸</button>
      </div>
      <form
        className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || toMin(end) <= toMin(start)) return;
          addBlock({ date: day, start, end, title: title.trim().slice(0, 60), color });
          audio.sfx('pop');
          setTitle('');
        }}
      >
        <input className="px-input text-[13px] py-1" placeholder="Block title (e.g. Deep work)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="time" className="px-input text-[12px] py-1 w-[86px]" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start" />
        <input type="time" className="px-input text-[12px] py-1 w-[86px]" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="End" />
        <button className="px-btn px-btn-sm px-btn-primary" aria-label="Add block"><PixelIcon name="plus" size={14} /></button>
        <div className="col-span-4 flex gap-1">
          {COLORS.map((c) => (
            <button type="button" key={c} className="w-5 h-5 border-2 border-[var(--color-ink)]" style={{ background: c, outline: c === color ? '2px solid var(--color-ink)' : 'none', outlineOffset: 1 }} onClick={() => setColor(c)} aria-label="Block color" />
          ))}
        </div>
      </form>
      <div className="relative overflow-y-auto min-h-0 flex-1 px-inset">
        <div className="relative" style={{ height: (END - START) * H }}>
          {Array.from({ length: END - START }).map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-dashed border-[var(--color-paper-4)] text-[10px] text-[var(--color-cocoa)] pl-1" style={{ top: i * H }}>
              {String(START + i).padStart(2, '0')}:00
            </div>
          ))}
          {dayBlocks.map((b) => {
            const top = ((toMin(b.start) - START * 60) / 60) * H;
            const h = Math.max(14, ((toMin(b.end) - toMin(b.start)) / 60) * H - 2);
            return (
              <div key={b.id} className="absolute left-11 right-1 border-2 border-[var(--color-ink)] px-1.5 text-[12px] text-white flex items-start justify-between overflow-hidden" style={{ top, height: h, background: b.color }}>
                <span className="font-semibold truncate">{b.title} <span className="opacity-80 font-normal">{b.start}–{b.end}</span></span>
                <button className="opacity-80 hover:opacity-100" onClick={() => { audio.sfx('close'); removeBlock(b.id); }} aria-label="Remove block">✕</button>
              </div>
            );
          })}
          {day === today() && nowMin >= START * 60 && nowMin <= END * 60 && (
            <div className="absolute left-0 right-0 h-[2px] bg-[var(--color-tomato)]" style={{ top: ((nowMin - START * 60) / 60) * H }}>
              <span className="absolute -left-0 -top-1.5 w-2.5 h-2.5 bg-[var(--color-tomato)] border border-[var(--color-ink)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
