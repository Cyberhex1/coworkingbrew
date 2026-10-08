import { useState } from 'react';
import { useApp, today } from '../../../state/store';
import { audio } from '../../../audio/engine';
import { ECONOMY } from '../../../data/catalog';

const MOODS = ['😫', '😕', '😐', '🙂', '😄'];
const PROMPTS = [
  'What would make today feel like a win?',
  'What did you learn today?',
  'What’s one thing you’re proud of?',
  'What drained you, and what recharged you?',
  'What will you do differently tomorrow?',
];

export default function JournalApp() {
  const journal = useApp((s) => s.journal);
  const saveJournal = useApp((s) => s.saveJournal);
  const existing = journal.find((j) => j.date === today());
  const [mood, setMood] = useState(existing?.mood ?? 4);
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '');
  const [text, setText] = useState(existing?.text ?? '');
  const [view, setView] = useState<'write' | 'past'>('write');
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <div className="p-2 flex flex-col gap-2 h-full min-h-0">
      <div className="flex gap-1">
        <button className="px-btn px-btn-sm" data-active={view === 'write'} onClick={() => setView('write')}>Today</button>
        <button className="px-btn px-btn-sm" data-active={view === 'past'} onClick={() => setView('past')}>Past entries ({journal.length})</button>
        {!existing?.rewarded && <span className="ml-auto text-[11px] text-[var(--color-cocoa)] self-center">+{ECONOMY.journalDaily} tickets for today’s entry</span>}
      </div>
      {view === 'write' ? (
        <>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="px-tiny text-[var(--color-cocoa)]">Mood</span>
            {MOODS.map((m, i) => (
              <button key={i} className={`text-[20px] w-9 h-9 border-2 ${mood === i + 1 ? 'border-[var(--color-ink)] bg-[var(--color-gold-2)]' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setMood(i + 1)} aria-label={`Mood ${i + 1}`}>{m}</button>
            ))}
          </div>
          <input className="px-input text-[13px]" placeholder="I’m grateful for…" value={gratitude} onChange={(e) => setGratitude(e.target.value)} maxLength={200} />
          <textarea className="px-input text-[14px] flex-1 min-h-[140px] resize-none leading-relaxed" placeholder={prompt} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
          <button className="px-btn px-btn-primary self-end" onClick={() => { audio.sfx('success'); saveJournal({ date: today(), mood, gratitude, text }); }}>Save entry</button>
        </>
      ) : (
        <ul className="flex flex-col gap-1.5 overflow-y-auto min-h-0">
          {journal.length === 0 && <li className="text-[13px] text-[var(--color-cocoa)] text-center py-6">No entries yet.</li>}
          {journal.map((j) => (
            <li key={j.date} className="px-inset p-2 text-[13px]">
              <div className="flex items-center gap-2 font-semibold">{MOODS[j.mood - 1]} {new Date(j.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              {j.gratitude && <div className="italic text-[var(--color-cocoa)]">Grateful for: {j.gratitude}</div>}
              {j.text && <p className="whitespace-pre-wrap mt-1 leading-snug">{j.text}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
