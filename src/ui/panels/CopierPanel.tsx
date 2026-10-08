import { useMemo, useState } from 'react';
import { Window } from '../Window';
import { useApp, today, focusByDay } from '../../state/store';
import { toast } from '../../state/ui';
import { audio } from '../../audio/engine';
import { PixelIcon } from '../PixelIcon';

type Tpl = 'plan' | 'report' | 'poster';
const QUOTES = [
  'Slow progress is still progress.',
  'Make it exist first. Make it good later.',
  'You don’t need more time — you need to begin.',
  'Small steps. Big coffee.',
  'Focus is a superpower.',
  'One task at a time.',
];

export default function CopierPanel() {
  const [tpl, setTpl] = useState<Tpl>('plan');
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const s = useApp();
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  const sheet = useMemo(() => {
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (tpl === 'plan') {
      const blocks = s.blocks.filter((b) => b.date === today()).sort((a, b) => a.start.localeCompare(b.start));
      const open = s.tasks.filter((t) => t.status !== 'done');
      return {
        title: `Daily Plan — ${date}`,
        lines: [
          'SCHEDULE',
          ...(blocks.length ? blocks.map((b) => `  ${b.start}–${b.end}  ${b.title}`) : ['  (no time blocks yet — add some in the BrewOS planner)']),
          '',
          'TASKS',
          ...(open.length ? open.slice(0, 12).map((t) => `  [ ] ${t.title}  (${t.spent}/${t.estimate} 🍅)`) : ['  (nothing on the list — enjoy!)']),
        ],
      };
    }
    if (tpl === 'report') {
      const week = focusByDay(s.sessions, 7);
      const done = s.tasks.filter((t) => t.doneAt && Date.now() - t.doneAt < 7 * 86_400_000);
      return {
        title: `Focus Report — week of ${date}`,
        lines: [
          'FOCUS MINUTES',
          ...week.map((d) => `  ${d.label.padEnd(3)} ${'█'.repeat(Math.round(d.minutes / 10)).padEnd(14, '·')} ${d.minutes}m`),
          '',
          `TOTAL: ${week.reduce((a, d) => a + d.minutes, 0)} min · ${done.length} tasks done`,
          ...done.slice(0, 8).map((t) => `  ✓ ${t.title}`),
        ],
      };
    }
    return { title: 'POSTER', lines: [quote] };
  }, [tpl, s.blocks, s.tasks, s.sessions, quote]);

  const text = `${sheet.title}\n\n${sheet.lines.join('\n')}`;

  const print = () => {
    if (printing) return;
    setPrinting(true);
    setPrinted(false);
    audio.sfx('print');
    setTimeout(() => {
      setPrinting(false);
      setPrinted(true);
      const app = useApp.getState();
      app.set({ counters: { ...app.counters, prints: app.counters.prints + 1 } });
    }, 1400);
  };

  return (
    <Window title="Copier" icon="printer" width="lg" subtitle="Print a daily plan, a weekly focus report, or a motivational poster.">
      <div className="flex gap-1.5 mb-3">
        {([['plan', 'Daily plan'], ['report', 'Focus report'], ['poster', 'Poster']] as [Tpl, string][]).map(([id, l]) => (
          <button key={id} className="px-btn px-btn-sm" data-active={tpl === id} onClick={() => { audio.sfx('click'); setTpl(id); setPrinted(false); }}>{l}</button>
        ))}
      </div>
      <div className="relative bg-[#d8d8dc] border-2 border-[var(--color-ink)] p-3 overflow-hidden min-h-[300px]">
        <div className="absolute left-0 right-0 top-0 h-3 bg-[#8a8a94] border-b-2 border-[var(--color-ink)]" />
        <div
          id="print-sheet"
          className={`relative mx-auto mt-2 w-full max-w-[480px] bg-white border border-[#b8b8be] p-4 ${printing ? 'animate-[px-in_1.4s_steps(10)_both]' : ''}`}
          style={{ boxShadow: '2px 3px 0 rgba(0,0,0,0.2)', fontFamily: tpl === 'poster' ? 'var(--font-pixel)' : 'var(--font-term)' }}
        >
          {tpl === 'poster' ? (
            <div className="aspect-[3/4] flex flex-col items-center justify-center text-center gap-4 bg-[var(--color-paper)] border-4 border-[var(--color-ink)] p-6">
              <PixelIcon name="coffee" size={72} />
              <div className="text-[30px] leading-tight font-bold">{quote}</div>
              <div className="text-[12px] tracking-widest">— COWORKINGBREW —</div>
            </div>
          ) : (
            <>
              <div className="text-[22px] leading-none mb-2">{sheet.title}</div>
              <pre className="text-[17px] leading-[1.1] whitespace-pre-wrap">{sheet.lines.join('\n')}</pre>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button className="px-btn px-btn-primary" onClick={print} disabled={printing}><PixelIcon name="printer" size={16} />{printing ? 'Printing…' : 'Print'}</button>
        <button className="px-btn" onClick={() => { void navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard', 'success')); audio.sfx('click'); }}>Copy text</button>
        <button className="px-btn" onClick={() => {
          const w = window.open('', '_blank', 'width=640,height=800');
          if (!w) return;
          w.document.write(`<title>${sheet.title}</title><pre style="font:16px/1.3 monospace;white-space:pre-wrap;padding:24px">${text.replace(/</g, '&lt;')}</pre>`);
          w.document.close();
          w.focus();
          w.print();
        }}>Print on paper</button>
        {printed && <span className="self-center text-[13px] text-[var(--color-leaf)]">✓ Fresh off the copier!</span>}
      </div>
    </Window>
  );
}
