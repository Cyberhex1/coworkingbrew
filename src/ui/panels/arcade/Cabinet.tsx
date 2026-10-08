import { useEffect, useRef, type ReactNode } from 'react';
import { PixelIcon } from '../../PixelIcon';
import type { Bests } from './meta';
import { sfx } from './meta';
import { C } from './pixel';
import { GAMES } from './games';
import type { GameDef, GameId } from './types';

/** Arcade cabinet chrome: marquee, CRT bezel (with scanlines) and a control deck. */
export function Cabinet({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[680px] border-[3px] border-[var(--color-ink)] p-2 sm:p-3"
      style={{
        background: `linear-gradient(90deg, #2c1a33 0 10px, #4a2d52 10px calc(100% - 10px), #2c1a33 calc(100% - 10px))`,
        boxShadow: 'inset 0 0 0 2px #6e4a7a, 0 4px 0 rgba(42,26,31,0.45)',
      }}
    >
      <Marquee compact={compact} />
      <div
        className="relative scanlines mt-2 border-[3px] border-black p-1 sm:p-3 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, #1c1626 0%, #0d0a12 100%)',
          boxShadow: 'inset 0 0 0 2px #2b2236, inset 0 0 28px rgba(143,227,196,0.12)',
        }}
      >
        {children}
      </div>
      {!compact && <ControlDeck />}
    </div>
  );
}

function Marquee({ compact }: { compact: boolean }) {
  const bulbs = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="relative border-[3px] border-[var(--color-ink)] text-center overflow-hidden" style={{ background: '#1d1226' }}>
      <div className="flex justify-between px-1.5 pt-1" aria-hidden>
        {bulbs.map((i) => (
          <span
            key={i}
            className="block w-[5px] h-[5px] px-blink"
            style={{ background: i % 2 ? C.gold2 : C.terra, animationDelay: i % 2 ? '0.5s' : '0s' }}
          />
        ))}
      </div>
      <div
        className={`font-[family-name:var(--font-pixel)] font-bold tracking-[0.12em] leading-none ${compact ? 'text-[20px] py-1' : 'text-[24px] sm:text-[30px] py-1.5'}`}
        style={{ color: C.gold2, textShadow: `2px 2px 0 ${C.tomato}, 4px 4px 0 ${C.ink}, 0 0 12px rgba(247,217,122,0.55)` }}
      >
        CAFÉ ARCADE
      </div>
      {!compact && (
        <div className="px-tiny pb-1.5" style={{ color: C.mint }}>
          ☕ insert break · win tickets ☕
        </div>
      )}
    </div>
  );
}

function ControlDeck() {
  return (
    <div
      className="mt-2 flex items-center justify-between gap-3 border-[3px] border-[var(--color-ink)] px-3 py-2"
      style={{ background: 'linear-gradient(#5a3a63, #3e2647)' }}
      aria-hidden
    >
      <div className="flex items-end gap-3">
        {/* joystick */}
        <div className="relative w-[26px] h-[26px]">
          <span className="absolute left-[10px] top-[9px] w-[6px] h-[12px]" style={{ background: C.grey }} />
          <span className="absolute left-[5px] top-0 w-[16px] h-[12px] border-2 border-[var(--color-ink)]" style={{ background: C.tomato }} />
          <span className="absolute left-0 bottom-0 w-[26px] h-[6px] border-2 border-[var(--color-ink)]" style={{ background: C.ink2 }} />
        </div>
        {[C.gold, C.leaf2, C.sky].map((c) => (
          <span key={c} className="block w-[14px] h-[10px] border-2 border-[var(--color-ink)]" style={{ background: c, boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.25)` }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="px-tiny" style={{ color: C.paper3 }}>1 break = 1 credit</span>
        <span className="flex items-center gap-1 border-2 border-[var(--color-ink)] px-1.5 py-1" style={{ background: '#1d1226' }}>
          <span className="block w-[3px] h-[12px]" style={{ background: C.gold }} />
          <PixelIcon name="ticket" size={14} />
        </span>
      </div>
    </div>
  );
}

/** 64x48 pixel thumbnail drawn by the game itself. */
export function GameThumb({ def, size = 2 }: { def: GameDef; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 48);
    def.thumb(ctx);
  }, [def]);
  return (
    <canvas
      ref={ref}
      width={64}
      height={48}
      className="pixelated block border-2 border-black"
      style={{ width: 64 * size, height: 48 * size }}
      aria-hidden
    />
  );
}

export function GameSelect({ bests, onPick }: { bests: Bests; onPick: (id: GameId) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= GAMES.length) {
        e.preventDefault();
        onPick(GAMES[n - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPick]);

  return (
    <div className="text-[var(--color-paper)]">
      <div className="text-center mb-2 sm:mb-3">
        <div className="px-tiny px-blink" style={{ color: C.gold2 }}>select game</div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            className="group relative flex flex-col items-center gap-1.5 p-1.5 sm:p-2 text-center border-2 border-[#4a3a5a] hover:border-[var(--color-gold)] focus-visible:border-[var(--color-gold)] outline-none transition-colors"
            style={{ background: '#211829' }}
            onClick={() => { sfx('click'); onPick(g.id); }}
          >
            <span className="absolute left-1 top-1 px-kbd !min-w-[14px] !h-[14px] !text-[8px] hidden sm:inline-flex">{i + 1}</span>
            <span className="block group-hover:-translate-y-[2px] transition-transform">
              <span className="hidden sm:block"><GameThumb def={g} size={2} /></span>
              <span className="block sm:hidden"><GameThumb def={g} size={1.5} /></span>
            </span>
            <span className="font-[family-name:var(--font-pixel)] font-semibold text-[13px] sm:text-[15px] leading-tight" style={{ color: g.accent }}>
              {g.name}
            </span>
            <span className="hidden sm:block text-[11px] leading-snug text-[var(--color-paper-3)]">{g.tagline}</span>
            <span className="px-tiny text-[var(--color-mint)]">
              best {bests[g.id] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
