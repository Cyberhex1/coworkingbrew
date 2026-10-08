import { NumField } from '../../NumField';
import { useApp, type FocusMode } from '../../../state/store';
import { useNow, fmt } from '../../HUD';
import { PixelIcon } from '../../PixelIcon';
import { audio } from '../../../audio/engine';

export default function TimerApp() {
  const focus = useApp((s) => s.focus);
  const settings = useApp((s) => s.settings);
  const tasks = useApp((s) => s.tasks);
  const sessions = useApp((s) => s.sessions);
  const buff = useApp((s) => s.buff);
  const now = useNow(250);
  const app = useApp.getState();
  const total = (focus.mode === 'focus' ? settings.focusMin : focus.mode === 'short' ? settings.shortMin : settings.longMin) * 60_000;
  const remaining = focus.running && focus.endsAt ? focus.endsAt - now : focus.remainingMs;
  const progress = Math.max(0, Math.min(1, 1 - remaining / total));
  const todayCount = sessions.filter((s) => new Date(s.at).toDateString() === new Date().toDateString()).length;
  const todayMin = sessions.filter((s) => new Date(s.at).toDateString() === new Date().toDateString()).reduce((a, s) => a + s.minutes, 0);
  const active = tasks.filter((t) => t.status !== 'done');
  const boost = buff && buff.until > now;

  const modes: [FocusMode, string][] = [['focus', 'Focus'], ['short', 'Short break'], ['long', 'Long break']];
  // ring segments
  const SEG = 40;

  return (
    <div className="p-3 flex flex-col gap-3 items-center">
      <div className="flex gap-1">
        {modes.map(([m, l]) => (
          <button key={m} className="px-btn px-btn-sm" data-active={focus.mode === m} onClick={() => { audio.sfx('click'); app.setFocusMode(m); }}>{l}</button>
        ))}
      </div>
      <div className="relative w-[200px] h-[200px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0" shapeRendering="crispEdges">
          {Array.from({ length: SEG }).map((_, i) => {
            const a = (i / SEG) * Math.PI * 2 - Math.PI / 2;
            const on = i / SEG < progress;
            return <rect key={i} x={50 + Math.cos(a) * 44 - 3} y={50 + Math.sin(a) * 44 - 3} width={6} height={6} fill={on ? (focus.mode === 'focus' ? '#d9573f' : '#62a356') : '#e6cf9f'} stroke="#2a1a1f" strokeWidth={1} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <PixelIcon name={focus.mode === 'focus' ? 'tomato' : 'coffee'} size={28} className={focus.running ? 'px-bob' : ''} />
          <div className="text-[40px] font-bold tabular-nums leading-none mt-1">{fmt(remaining)}</div>
          <div className="px-tiny mt-1 text-[var(--color-cocoa)]">{focus.running ? 'running' : remaining < total - 500 ? 'paused' : 'ready'}</div>
        </div>
      </div>
      <div className="flex gap-2">
        {focus.running ? (
          <button className="px-btn" onClick={() => { audio.sfx('click'); app.pauseFocus(); }}><PixelIcon name="pause" size={16} />Pause</button>
        ) : (
          <button className="px-btn px-btn-green" onClick={() => { audio.sfx('success'); app.startFocus(); }}><PixelIcon name="play" size={16} />{remaining < total - 500 ? 'Resume' : 'Start'}</button>
        )}
        <button className="px-btn" onClick={() => { audio.sfx('click'); app.resetFocus(); }}><PixelIcon name="reset" size={16} />Reset</button>
        <button className="px-btn" onClick={() => { audio.sfx('click'); app.skipFocus(); }}><PixelIcon name="skip" size={16} />Skip</button>
      </div>
      <label className="w-full text-[12px] flex flex-col gap-1">
        <span className="px-tiny text-[var(--color-cocoa)]">Working on</span>
        <select className="px-input text-[13px] py-1" value={focus.taskId ?? ''} onChange={(e) => app.setFocusTask(e.target.value || null)}>
          <option value="">— no specific task —</option>
          {active.map((t) => <option key={t.id} value={t.id}>{t.title} (🍅{t.spent}/{t.estimate})</option>)}
        </select>
      </label>
      <div className="w-full grid grid-cols-3 gap-1.5 text-center text-[12px]">
        <div className="px-inset p-1.5"><div className="font-bold text-[16px]">{todayCount}</div>sessions today</div>
        <div className="px-inset p-1.5"><div className="font-bold text-[16px]">{todayMin}</div>minutes today</div>
        <div className={`px-inset p-1.5 ${boost ? 'bg-[#fff2c4]' : ''}`}><div className="font-bold text-[16px]">{boost ? '☕ on' : '—'}</div>drink boost</div>
      </div>
      <details className="w-full text-[12px]">
        <summary className="cursor-pointer px-tiny text-[var(--color-cocoa)]">Timer settings</summary>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {([['focusMin', 'Focus (min)', 5, 90], ['shortMin', 'Short break', 1, 30], ['longMin', 'Long break', 5, 60], ['longEvery', 'Long break every', 2, 8]] as const).map(([k, l, min, max]) => (
            <label key={k} className="flex items-center justify-between gap-2">
              {l}
              <NumField value={settings[k]} min={min} max={max} onCommit={(n) => app.setSettings({ [k]: n })} />
            </label>
          ))}
          <label className="flex items-center gap-2"><input type="checkbox" className="px-check" checked={settings.autoStartBreaks} onChange={(e) => app.setSettings({ autoStartBreaks: e.target.checked })} />Auto-start breaks</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="px-check" checked={settings.autoStartFocus} onChange={(e) => app.setSettings({ autoStartFocus: e.target.checked })} />Auto-start focus</label>
        </div>
      </details>
    </div>
  );
}
