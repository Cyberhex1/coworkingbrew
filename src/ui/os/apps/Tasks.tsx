import { useState } from 'react';
import { useApp, type Task } from '../../../state/store';
import { PixelIcon } from '../../PixelIcon';
import { audio } from '../../../audio/engine';

const TAGS = ['', 'work', 'study', 'personal', 'creative', 'admin'];
const TAG_COLOR: Record<string, string> = { work: '#5b85b8', study: '#a98ac4', personal: '#62a356', creative: '#d97a86', admin: '#c9b28c' };

/** Task list used by BrewOS and the quick Tasks panel. */
export function TaskList({ dense = false }: { dense?: boolean }) {
  const tasks = useApp((s) => s.tasks);
  const focusTask = useApp((s) => s.focus.taskId);
  const { addTask, setTaskStatus, updateTask, removeTask, setFocusTask } = useApp.getState();
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');
  const [filter, setFilter] = useState<'active' | 'done'>('active');
  const [editing, setEditing] = useState<string | null>(null);

  const visible = tasks.filter((t) => (filter === 'done' ? t.status === 'done' : t.status !== 'done'));
  const doneToday = tasks.filter((t) => t.doneAt && new Date(t.doneAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addTask(text, { tag });
          audio.sfx('pop');
          setText('');
        }}
      >
        <input className="px-input text-[13px] py-1.5" placeholder="Add a task… (e.g. Outline chapter 2)" value={text} onChange={(e) => setText(e.target.value)} maxLength={140} />
        <select className="px-input text-[12px] py-1.5 w-[92px]" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag">
          {TAGS.map((t) => <option key={t} value={t}>{t || 'no tag'}</option>)}
        </select>
        <button className="px-btn px-btn-sm px-btn-primary" aria-label="Add task"><PixelIcon name="plus" size={14} /></button>
      </form>
      <div className="flex items-center gap-1 text-[12px]">
        <button className="px-btn px-btn-sm" data-active={filter === 'active'} onClick={() => setFilter('active')}>To do ({tasks.filter((t) => t.status !== 'done').length})</button>
        <button className="px-btn px-btn-sm" data-active={filter === 'done'} onClick={() => setFilter('done')}>Done ({tasks.filter((t) => t.status === 'done').length})</button>
        <span className="ml-auto text-[var(--color-cocoa)]">{doneToday} done today</span>
      </div>
      <ul className={`flex flex-col gap-1.5 overflow-y-auto min-h-0 ${dense ? 'max-h-[300px]' : 'flex-1'}`}>
        {visible.length === 0 && (
          <li className="text-[13px] text-[var(--color-cocoa)] text-center py-6">
            {filter === 'active' ? 'Nothing here yet — add the one thing you want to finish today.' : 'No finished tasks yet. You’ve got this!'}
          </li>
        )}
        {visible.map((t) => (
          <TaskRow
            key={t.id}
            t={t}
            focused={focusTask === t.id}
            editing={editing === t.id}
            onEdit={() => setEditing(editing === t.id ? null : t.id)}
            onToggle={() => { audio.sfx(t.status === 'done' ? 'click' : 'success'); setTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done'); }}
            onFocus={() => { audio.sfx('click'); setFocusTask(focusTask === t.id ? null : t.id); }}
            onUpdate={(p) => updateTask(t.id, p)}
            onRemove={() => { audio.sfx('close'); removeTask(t.id); }}
          />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({ t, focused, editing, onEdit, onToggle, onFocus, onUpdate, onRemove }: {
  t: Task; focused: boolean; editing: boolean; onEdit: () => void; onToggle: () => void; onFocus: () => void; onUpdate: (p: Partial<Task>) => void; onRemove: () => void;
}) {
  return (
    <li className={`px-inset p-1.5 ${focused ? 'bg-[#fff2c4] border-[var(--color-gold)]' : ''}`}>
      <div className="flex items-center gap-2">
        <input type="checkbox" className="px-check" checked={t.status === 'done'} onChange={onToggle} aria-label="Done" />
        {editing ? (
          <input autoFocus className="px-input text-[13px] py-0.5" defaultValue={t.title} onBlur={(e) => { onUpdate({ title: e.target.value.trim() || t.title }); onEdit(); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        ) : (
          <button className={`flex-1 text-left text-[13px] leading-tight ${t.status === 'done' ? 'line-through opacity-60' : ''}`} onDoubleClick={onEdit} title="Double-click to rename">
            {t.title}
          </button>
        )}
        {t.tag && <span className="px-chip text-[10px] text-white" style={{ background: TAG_COLOR[t.tag] ?? '#8a8a94' }}>{t.tag}</span>}
        <span className="flex items-center text-[11px] gap-0.5" title="Pomodoros done / estimated">
          <button className="px-1 hover:bg-[var(--color-paper-3)]" onClick={() => onUpdate({ estimate: Math.max(1, t.estimate - 1) })} aria-label="Fewer pomodoros">−</button>
          <span className="tabular-nums">🍅{t.spent}/{t.estimate}</span>
          <button className="px-1 hover:bg-[var(--color-paper-3)]" onClick={() => onUpdate({ estimate: Math.min(12, t.estimate + 1) })} aria-label="More pomodoros">+</button>
        </span>
        {t.status !== 'done' && (
          <button className="px-btn px-btn-sm px-btn-icon" data-active={focused} onClick={onFocus} title={focused ? 'Unpin from timer' : 'Focus on this task'}>
            <PixelIcon name="tomato" size={14} />
          </button>
        )}
        <button className="px-btn px-btn-sm px-btn-icon" onClick={onRemove} title="Delete" aria-label="Delete task"><PixelIcon name="close" size={12} /></button>
      </div>
    </li>
  );
}

export default function TasksApp() {
  return <div className="p-2 h-full"><TaskList /></div>;
}
