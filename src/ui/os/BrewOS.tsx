import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { useApp } from '../../state/store';
import { useUI } from '../../state/ui';
import { PixelIcon } from '../PixelIcon';
import { wallpaperURL } from './wallpaper';
import { useNow } from '../HUD';
import { game } from '../../engine/gameRef';
import { audio } from '../../audio/engine';

type AppId = 'timer' | 'tasks' | 'planner' | 'journal' | 'notes' | 'customize';

const APPS: Record<AppId, { title: string; icon: string; w: number; h: number; C: LazyExoticComponent<ComponentType> }> = {
  timer: { title: 'Focus Timer', icon: 'tomato', w: 330, h: 520, C: lazy(() => import('./apps/Timer')) },
  tasks: { title: 'Tasks', icon: 'check', w: 440, h: 420, C: lazy(() => import('./apps/Tasks')) },
  planner: { title: 'Day Planner', icon: 'calendar', w: 400, h: 460, C: lazy(() => import('./apps/Planner')) },
  journal: { title: 'Journal', icon: 'notes', w: 420, h: 440, C: lazy(() => import('./apps/Journal')) },
  notes: { title: 'scratchpad.txt', icon: 'desk', w: 380, h: 300, C: lazy(() => import('./apps/Notes')) },
  customize: { title: 'Customize', icon: 'sparkle', w: 520, h: 460, C: lazy(() => import('./apps/Customize')) },
};

interface Win { id: AppId; x: number; y: number; w: number; h: number; z: number; min: boolean }

const LS_KEY = 'cb:brewos-windows-v2';

function loadWins(): Win[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Win[];
  } catch { /* ignore */ }
  return [
    { id: 'timer', x: 100, y: 16, w: APPS.timer.w, h: APPS.timer.h, z: 2, min: false },
    { id: 'tasks', x: 446, y: 16, w: APPS.tasks.w, h: APPS.tasks.h, z: 3, min: false },
  ];
}

export default function BrewOS() {
  const wallpaper = useApp((s) => s.wallpaper);
  const accent = useApp((s) => s.osAccent);
  const name = useApp((s) => s.name);
  const tickets = useApp((s) => s.tickets);
  const focus = useApp((s) => s.focus);
  const [wins, setWins] = useState<Win[]>(loadWins);
  const [startOpen, setStartOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const screenRef = useRef<HTMLDivElement>(null);
  const now = useNow(10_000);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 700;

  useEffect(() => {
    audio.sfx('open');
    const t = setTimeout(() => setBooting(false), 650);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(wins)); } catch { /* ignore */ }
  }, [wins]);

  const topZ = Math.max(1, ...wins.map((w) => w.z));
  const open = (id: AppId) => {
    audio.sfx('click');
    setStartOpen(false);
    setWins((ws) => {
      const ex = ws.find((w) => w.id === id);
      if (ex) return ws.map((w) => (w.id === id ? { ...w, min: false, z: topZ + 1 } : w));
      const n = ws.length;
      return [...ws, { id, x: 110 + n * 26, y: 24 + n * 22, w: APPS[id].w, h: APPS[id].h, z: topZ + 1, min: false }];
    });
  };
  const close = (id: AppId) => { audio.sfx('close'); setWins((ws) => ws.filter((w) => w.id !== id)); };
  const focusWin = (id: AppId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: topZ + 1 } : w)));
  const minimize = (id: AppId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, min: !w.min, z: topZ + 1 } : w)));

  const drag = (id: AppId, e: React.PointerEvent) => {
    if (mobile) return;
    const win = wins.find((w) => w.id === id)!;
    const sx = e.clientX, sy = e.clientY, ox = win.x, oy = win.y;
    const rect = screenRef.current!.getBoundingClientRect();
    focusWin(id);
    const move = (ev: PointerEvent) => {
      const nx = Math.max(-win.w + 80, Math.min(rect.width - 80, ox + ev.clientX - sx));
      const ny = Math.max(0, Math.min(rect.height - 60, oy + ev.clientY - sy));
      setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x: nx, y: ny } : w)));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const exit = () => { audio.sfx('close'); useUI.getState().closePanel(); };
  const standUp = () => { exit(); game()?.playerStand(); };
  const visible = wins.filter((w) => !w.min);
  const mobileTop = mobile ? [...visible].sort((a, b) => b.z - a.z)[0] : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-4 bg-[rgba(20,14,18,0.55)]" onPointerDown={(e) => { if (e.target === e.currentTarget) exit(); }}>
      {/* monitor bezel */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-[1180px] sm:aspect-[16/10] bg-[#e6dcc8] sm:border-[3px] border-[var(--color-ink)] sm:p-4 sm:pb-9 flex flex-col px-in" style={{ boxShadow: 'inset 0 -6px 0 #c9b8a0, inset 0 4px 0 #fff8ec, 0 8px 0 rgba(0,0,0,0.35)' }}>
        <div ref={screenRef} className="relative flex-1 min-h-0 overflow-hidden border-[3px] border-[var(--color-ink)] bg-[#20303a]" style={{ boxShadow: 'inset 0 0 0 3px #3d2830' }}>
          {/* wallpaper */}
          <img src={wallpaperURL(wallpaper)} alt="" className="absolute inset-0 w-full h-full object-cover pixelated" draggable={false} />
          <div className="absolute inset-0 scanlines pointer-events-none opacity-60" />

          {booting ? (
            <div className="absolute inset-0 bg-[#1d2a24] flex flex-col items-center justify-center text-[#8fe3c4]" style={{ fontFamily: 'var(--font-term)' }}>
              <div className="text-[44px] leading-none">BrewOS</div>
              <div className="text-[20px] mt-1">starting up for {name || 'you'}… <span className="px-blink">_</span></div>
            </div>
          ) : (
            <>
              {/* desktop icons */}
              <div className="absolute left-2 top-2 bottom-12 flex flex-col flex-wrap gap-1 content-start">
                {(Object.keys(APPS) as AppId[]).map((id) => (
                  <button key={id} className="group w-[76px] flex flex-col items-center gap-1 p-1 text-white text-[11px] hover:bg-[rgba(255,255,255,0.18)]" onClick={() => open(id)} onDoubleClick={() => open(id)}>
                    <span className="bg-[rgba(251,241,220,0.9)] border-2 border-[var(--color-ink)] p-1"><PixelIcon name={APPS[id].icon} size={28} /></span>
                    <span className="px-1 bg-[rgba(42,26,31,0.65)] leading-tight text-center">{APPS[id].title}</span>
                  </button>
                ))}
              </div>

              {/* windows */}
              {(mobile ? (mobileTop ? [mobileTop] : []) : visible).map((w) => {
                const A = APPS[w.id];
                const active = w.z === topZ;
                return (
                  <section
                    key={w.id}
                    className="absolute flex flex-col bg-[var(--color-paper)] border-2 border-[var(--color-ink)]"
                    style={mobile ? { inset: 4, bottom: 44, zIndex: w.z } : { left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z, boxShadow: '4px 4px 0 rgba(42,26,31,0.45)' }}
                    onPointerDown={() => !active && focusWin(w.id)}
                  >
                    <header
                      className="flex items-center gap-1.5 px-1.5 py-1 text-white select-none cursor-grab active:cursor-grabbing"
                      style={{ background: active ? accent : '#8a8a94', backgroundImage: active ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 3px)' : undefined }}
                      onPointerDown={(e) => drag(w.id, e)}
                    >
                      <PixelIcon name={A.icon} size={16} />
                      <span className="flex-1 text-[13px] font-semibold truncate">{A.title}</span>
                      <button className="w-5 h-5 bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-ink)] leading-none text-[12px]" onPointerDown={(e) => e.stopPropagation()} onClick={() => minimize(w.id)} aria-label="Minimize">_</button>
                      <button className="w-5 h-5 bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-ink)] leading-none text-[12px]" onPointerDown={(e) => e.stopPropagation()} onClick={() => close(w.id)} aria-label="Close">✕</button>
                    </header>
                    <div className="flex-1 min-h-0 overflow-auto">
                      <Suspense fallback={<div className="p-3 px-blink text-[13px]">Loading…</div>}>
                        <A.C />
                      </Suspense>
                    </div>
                  </section>
                );
              })}

              {/* start menu */}
              {startOpen && (
                <div className="absolute left-1 bottom-10 z-[999] w-[220px] bg-[var(--color-paper)] border-2 border-[var(--color-ink)] flex" style={{ boxShadow: '4px 4px 0 rgba(42,26,31,0.45)' }}>
                  <div className="w-6 flex items-end justify-center pb-2 text-white text-[13px] font-bold" style={{ background: accent, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>BrewOS</div>
                  <div className="flex-1 py-1">
                    {(Object.keys(APPS) as AppId[]).map((id) => (
                      <button key={id} className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] hover:bg-[var(--color-paper-3)]" onClick={() => open(id)}>
                        <PixelIcon name={APPS[id].icon} size={18} />{APPS[id].title}
                      </button>
                    ))}
                    <div className="border-t-2 border-dashed border-[var(--color-paper-4)] my-1" />
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] hover:bg-[var(--color-paper-3)]" onClick={exit}><PixelIcon name="close" size={18} />Close BrewOS</button>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] hover:bg-[var(--color-paper-3)]" onClick={standUp}><PixelIcon name="logout" size={18} />Stand up from desk</button>
                  </div>
                </div>
              )}

              {/* taskbar */}
              <footer className="absolute left-0 right-0 bottom-0 h-9 z-[998] flex items-center gap-1 px-1 bg-[var(--color-paper-2)] border-t-2 border-[var(--color-ink)]">
                <button className="px-btn px-btn-sm font-bold" data-active={startOpen} onClick={() => { audio.sfx('click'); setStartOpen((v) => !v); }}>
                  <PixelIcon name="coffee" size={16} />Brew
                </button>
                <div className="flex-1 flex gap-1 overflow-x-auto">
                  {wins.map((w) => (
                    <button key={w.id} className="px-btn px-btn-sm max-w-[150px] shrink-0" data-active={!w.min && w.z === topZ} onClick={() => (w.min || w.z !== topZ ? (setWins((ws) => ws.map((x) => (x.id === w.id ? { ...x, min: false, z: topZ + 1 } : x)))) : minimize(w.id))}>
                      <PixelIcon name={APPS[w.id].icon} size={14} /><span className="truncate hidden sm:inline">{APPS[w.id].title}</span>
                    </button>
                  ))}
                </div>
                {focus.running && <span className="px-chip bg-[#fff2c4] hidden sm:inline">{focus.mode === 'focus' ? '🍅 focusing' : '☕ break'}</span>}
                <span className="px-chip flex items-center gap-1"><PixelIcon name="ticket" size={12} />{tickets}</span>
                <span className="px-chip tabular-nums">{new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              </footer>
            </>
          )}
        </div>
        {/* bezel details */}
        <div className="hidden sm:flex absolute left-0 right-0 bottom-1.5 px-5 items-center justify-between text-[12px] text-[#8a7a64]">
          <span className="font-bold tracking-widest">BREWOS 95</span>
          <div className="flex items-center gap-3">
            <button className="px-btn px-btn-sm" onClick={exit}>Close <span className="px-kbd">Esc</span></button>
            <button className="px-btn px-btn-sm" onClick={standUp}>Stand up</button>
            <span className="w-2.5 h-2.5 bg-[#62e356] border border-[var(--color-ink)]" title="Power" />
          </div>
        </div>
        {/* mobile close */}
        <button className="sm:hidden absolute right-2 top-2 z-[1000] px-btn px-btn-sm" onClick={exit} aria-label="Close BrewOS"><PixelIcon name="close" size={14} /></button>
      </div>
    </div>
  );
}
