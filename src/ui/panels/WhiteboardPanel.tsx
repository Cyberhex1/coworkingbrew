import { useState } from 'react';
import { Window } from '../Window';
import { useApp, type TaskStatus } from '../../state/store';
import { PixelIcon } from '../PixelIcon';
import { audio } from '../../audio/engine';

const COLS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To do', color: '#f7d97a' },
  { id: 'doing', title: 'Doing', color: '#8cb4dc' },
  { id: 'done', title: 'Done', color: '#9cc96a' },
];

export default function WhiteboardPanel() {
  const tasks = useApp((s) => s.tasks);
  const { addTask, setTaskStatus, removeTask } = useApp.getState();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [text, setText] = useState('');

  const move = (id: string, to: TaskStatus) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === to) return;
    audio.sfx(to === 'done' ? 'success' : 'pop');
    setTaskStatus(id, to);
  };

  return (
    <Window title="Sprint Whiteboard" icon="board" width="xl" subtitle="Drag sticky notes between columns — it’s the same list as your BrewOS tasks.">
      <form className="flex gap-1.5 mb-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addTask(text); audio.sfx('pop'); setText(''); } }}>
        <input className="px-input text-[13px]" placeholder="New sticky note…" value={text} onChange={(e) => setText(e.target.value)} maxLength={140} />
        <button className="px-btn px-btn-sm px-btn-primary"><PixelIcon name="plus" size={14} />Add</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8f8f4] border-2 border-[var(--color-ink)] p-2" style={{ boxShadow: 'inset 0 0 0 4px #d8d8dc' }}>
        {COLS.map((c) => {
          const list = tasks.filter((t) => t.status === c.id);
          return (
            <div
              key={c.id}
              className={`min-h-[220px] p-1.5 flex flex-col gap-2 ${over === c.id ? 'bg-[rgba(226,176,74,0.18)]' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOver(c.id); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, c.id); setDragId(null); setOver(null); }}
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#b8b8be] pb-1">
                <span className="font-semibold text-[15px]">{c.title}</span>
                <span className="px-chip" style={{ background: c.color }}>{list.length}</span>
              </div>
              {list.map((t, i) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  className="p-2 border-2 border-[var(--color-ink)] text-[13px] leading-snug cursor-grab active:cursor-grabbing"
                  style={{ background: c.color, transform: `rotate(${((i * 53) % 5) - 2}deg)`, boxShadow: '2px 3px 0 rgba(42,26,31,0.25)' }}
                >
                  <div className={t.status === 'done' ? 'line-through opacity-70' : ''}>{t.title}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[10px] opacity-70">🍅{t.spent}/{t.estimate}</span>
                    <span className="flex-1" />
                    {c.id !== 'todo' && <button className="text-[11px] px-1 border border-[var(--color-ink)] bg-[rgba(255,255,255,0.5)]" onClick={() => move(t.id, c.id === 'done' ? 'doing' : 'todo')} aria-label="Move left">◂</button>}
                    {c.id !== 'done' && <button className="text-[11px] px-1 border border-[var(--color-ink)] bg-[rgba(255,255,255,0.5)]" onClick={() => move(t.id, c.id === 'todo' ? 'doing' : 'done')} aria-label="Move right">▸</button>}
                    <button className="text-[11px] px-1 border border-[var(--color-ink)] bg-[rgba(255,255,255,0.5)]" onClick={() => { audio.sfx('close'); removeTask(t.id); }} aria-label="Remove">✕</button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="text-[12px] text-[#8a8a94] text-center py-4">drop notes here</div>}
            </div>
          );
        })}
      </div>
    </Window>
  );
}
