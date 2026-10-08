import { Window } from '../Window';
import { useApp } from '../../state/store';
import { toast } from '../../state/ui';
import { audio, type ChimeKind } from '../../audio/engine';

export default function SettingsPanel() {
  const settings = useApp((s) => s.settings);
  const set = useApp((s) => s.setSettings);
  const notifState = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  return (
    <Window title="Settings" icon="gear" width="md">
      <div className="flex flex-col gap-4 text-[13px]">
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-[14px]">Sound</h3>
          {([['master', 'Master volume'], ['music', 'Music volume']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-3">
              <span className="w-[110px]">{l}</span>
              <input type="range" className="px-range" min={0} max={1} step={0.01} value={settings[k]} onChange={(e) => set({ [k]: Number(e.target.value) })} />
            </label>
          ))}
          <label className="flex items-center gap-3">
            <span className="w-[110px]">Session chime</span>
            <select className="px-input py-1 text-[13px] w-auto" value={settings.chime} onChange={(e) => set({ chime: e.target.value as ChimeKind })}>
              {['kalimba', 'bell', 'gong', 'digital'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="px-btn px-btn-sm" onClick={() => { void audio.unlock().then(() => audio.chime(settings.chime)); }}>Test</button>
          </label>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-[14px]">Café</h3>
          <label className="flex items-center gap-2"><input type="checkbox" className="px-check" checked={settings.npcs} onChange={(e) => set({ npcs: e.target.checked })} />Show café regulars (NPC coworkers) when the room is quiet</label>
          <label className="flex items-center gap-3">
            <span className="w-[110px]">Pixel size</span>
            <input type="range" className="px-range" min={2} max={6} step={1} value={settings.zoom} onChange={(e) => set({ zoom: Number(e.target.value) })} />
            <span className="w-6 text-right">{settings.zoom}×</span>
          </label>
          <label className="flex items-center gap-2">
            Desktop notifications when a session ends:
            <b>{notifState}</b>
            {notifState === 'default' && <button className="px-btn px-btn-sm" onClick={() => void Notification.requestPermission().then(() => toast('Notifications updated', 'info'))}>Enable</button>}
          </label>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-[14px]">Pomodoro</h3>
          <div className="grid grid-cols-2 gap-2">
            {([['focusMin', 'Focus (min)', 5, 90], ['shortMin', 'Short break', 1, 30], ['longMin', 'Long break', 5, 60], ['longEvery', 'Long break every', 2, 8]] as const).map(([k, l, min, max]) => (
              <label key={k} className="flex items-center justify-between gap-2">
                {l}
                <input type="number" className="px-input w-[64px] py-0.5" min={min} max={max} value={settings[k]} onChange={(e) => set({ [k]: Math.max(min, Math.min(max, Number(e.target.value) || min)) })} />
              </label>
            ))}
            <label className="flex items-center gap-2"><input type="checkbox" className="px-check" checked={settings.autoStartBreaks} onChange={(e) => set({ autoStartBreaks: e.target.checked })} />Auto-start breaks</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="px-check" checked={settings.autoStartFocus} onChange={(e) => set({ autoStartFocus: e.target.checked })} />Auto-start focus</label>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-[14px]">Your data</h3>
          <p className="text-[12px] text-[var(--color-cocoa)]">Everything is saved in this browser. Sign in to sync tickets, outfits and unlocks across devices.</p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-btn px-btn-sm" onClick={() => {
              const blob = new Blob([localStorage.getItem('coworkingbrew:v2') ?? '{}'], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `coworkingbrew-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}>Export backup</button>
            <button className="px-btn px-btn-sm" onClick={() => { useApp.getState().set({ onboarded: false }); }}>Replay intro</button>
            <button className="px-btn px-btn-sm" onClick={() => {
              if (confirm('Erase all local CoworkingBrew data (tasks, tickets, journal, unlocks)? This cannot be undone.')) {
                localStorage.removeItem('coworkingbrew:v2');
                location.reload();
              }
            }}>Reset everything</button>
          </div>
        </section>
      </div>
    </Window>
  );
}
