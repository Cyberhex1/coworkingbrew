import { Window } from '../Window';
import { useApp } from '../../state/store';
import { useUI } from '../../state/ui';
import { STATIONS, AMBIENCES, audio, type AmbienceId } from '../../audio/engine';
import { THEME_BY_ID } from '../../engine/themes';
import { PixelIcon } from '../PixelIcon';

export default function RecordPanel() {
  const settings = useApp((s) => s.settings);
  const theme = useApp((s) => s.theme);
  const setSettings = useApp((s) => s.setSettings);
  const unlocked = useUI((s) => s.audioUnlocked);
  const t = THEME_BY_ID[theme];
  const station = STATIONS.find((s) => s.id === settings.station) ?? STATIONS[0];

  return (
    <Window title="Record Player" icon="music" width="lg" subtitle="Procedural lo-fi, generated live. It gets louder as you walk closer.">
      <div className="grid sm:grid-cols-[220px_1fr] gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-[180px] h-[180px] bg-[#3a2a24] border-[3px] border-[var(--color-ink)] grid place-items-center" style={{ boxShadow: 'inset 0 -6px 0 #2a1d18' }}>
            <div className={`w-[150px] h-[150px] rounded-full border-2 border-[var(--color-ink)] grid place-items-center ${settings.musicOn ? 'animate-spin' : ''}`} style={{ animationDuration: '2.4s', background: 'repeating-radial-gradient(#1d1d24 0 3px, #2a2a30 3px 5px)' }}>
              <div className="w-[52px] h-[52px] rounded-full border-2 border-[var(--color-ink)] grid place-items-center text-[9px] font-bold text-center leading-none" style={{ background: t.rug[0], color: '#fff' }}>
                {station.name.split(' ')[0]}
              </div>
            </div>
            <div className="absolute right-3 top-3 w-3 h-3 bg-[#c9ccd2] border border-[var(--color-ink)]" />
            <div className="absolute right-4 top-5 w-1.5 h-[80px] bg-[#c9ccd2] border border-[var(--color-ink)] origin-top" style={{ transform: `rotate(${settings.musicOn ? 22 : 8}deg)` }} />
          </div>
          <button
            className={`px-btn w-full ${settings.musicOn ? '' : 'px-btn-green'}`}
            onClick={() => { void audio.unlock(); audio.sfx('click'); setSettings({ musicOn: !settings.musicOn }); }}
          >
            <PixelIcon name={settings.musicOn ? 'pause' : 'play'} size={16} />{settings.musicOn ? 'Stop the record' : 'Drop the needle'}
          </button>
          {!unlocked && <p className="text-[11px] text-[var(--color-cocoa)] text-center">Audio starts after your first click (browser rule).</p>}
          <label className="w-full text-[12px]">
            <span className="px-tiny text-[var(--color-cocoa)]">Music volume</span>
            <input type="range" className="px-range" min={0} max={1} step={0.01} value={settings.music} onChange={(e) => setSettings({ music: Number(e.target.value) })} />
          </label>
          <label className="w-full text-[12px]">
            <span className="px-tiny text-[var(--color-cocoa)]">Master volume</span>
            <input type="range" className="px-range" min={0} max={1} step={0.01} value={settings.master} onChange={(e) => setSettings({ master: Number(e.target.value) })} />
          </label>
        </div>
        <div className="flex flex-col gap-3">
          <section>
            <h3 className="font-semibold text-[14px] mb-1.5">Stations</h3>
            <ul className="flex flex-col gap-1.5">
              {STATIONS.map((s) => (
                <li key={s.id}>
                  <button
                    className={`w-full text-left px-inset p-2 flex items-center gap-2 hover:bg-[#fff8e8] ${settings.station === s.id ? 'border-[var(--color-terra)] bg-[#fff2e4]' : ''}`}
                    onClick={() => { void audio.unlock(); audio.sfx('click'); setSettings({ station: s.id, musicOn: true }); }}
                  >
                    <PixelIcon name={settings.station === s.id && settings.musicOn ? 'soundOn' : 'music'} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px]">{s.name}</div>
                      <div className="text-[11px] text-[var(--color-cocoa)] truncate">{s.description}</div>
                    </div>
                    <span className="px-chip">{s.bpm} bpm</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-semibold text-[14px]">Ambience mixer</h3>
              <button className="px-btn px-btn-sm" onClick={() => { audio.sfx('click'); setSettings({ ambience: { ...settings.ambience, rain: 0, cafe: 0, fire: 0, birds: 0, crickets: 0, water: 0, vinyl: 0, ...t.ambience } }); }} title="Use this room's suggested ambience">
                Room preset
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {AMBIENCES.map((a) => (
                <label key={a.id} className="text-[12px] flex items-center gap-2">
                  <span className="w-[70px] shrink-0">{a.name}</span>
                  <input type="range" className="px-range" min={0} max={1} step={0.01} value={settings.ambience[a.id as AmbienceId] ?? 0} onChange={(e) => { void audio.unlock(); setSettings({ ambience: { ...settings.ambience, [a.id]: Number(e.target.value) } }); }} />
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Window>
  );
}
