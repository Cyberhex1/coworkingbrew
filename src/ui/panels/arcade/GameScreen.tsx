import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { PixelIcon } from '../../PixelIcon';
import { useApp } from '../../../state/store';
import { isOnBreak, loadBests, saveBest, sfx, ticketsFor } from './meta';
import { C } from './pixel';
import { setupCanvas, useGameLoop, usePixelScale } from './useGameLoop';
import { ARCADE_H, ARCADE_W, type GameApi, type GameDef, type GameInstance, type SwipeDir } from './types';

type Phase = 'title' | 'playing' | 'paused' | 'over';

interface RunResult {
  score: number;
  best: number;
  newBest: boolean;
  details: string[];
  base: number;
  asked: number;
  given: number;
  onBreak: boolean;
}

/** Keys we always swallow while a game is running (no page scrolling). */
const GAME_KEYS = new Set([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D']);

export function KeyCaps({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex gap-1">
      {keys.map((k) => (
        <kbd key={k} className="px-kbd">{k}</kbd>
      ))}
    </span>
  );
}

export function GameScreen({ def, onBack, onScore }: { def: GameDef; onBack: () => void; onScore?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gameRef = useRef<GameInstance | null>(null);
  const phaseRef = useRef<Phase>('title');
  const endedRef = useRef(false);
  const pointer = useRef<{ id: number; ax: number; ay: number; swiped: boolean } | null>(null);
  const [phase, setPhaseState] = useState<Phase>('title');
  const [result, setResult] = useState<RunResult | null>(null);
  const [best, setBest] = useState(() => loadBests()[def.id] ?? 0);
  const scale = usePixelScale(wrapRef, ARCADE_W, ARCADE_H);
  const onScoreRef = useRef(onScore);
  useEffect(() => {
    onScoreRef.current = onScore;
  });

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const finish = useCallback(
    (score: number, details: string[] = []) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const prevBest = loadBests()[def.id] ?? 0;
      const newBest = saveBest(def.id, score);
      const onBreak = isOnBreak();
      const base = def.reward(score);
      const asked = ticketsFor(base, onBreak);
      let given = 0;
      try {
        given = useApp.getState().awardGame(asked, def.name);
      } catch {
        given = 0;
      }
      setBest(Math.max(prevBest, score));
      setResult({ score, best: Math.max(prevBest, score), newBest, details, base, asked, given, onBreak });
      setPhase('over');
      sfx(newBest || given > 0 ? 'success' : 'whoosh');
      onScoreRef.current?.();
    },
    [def, setPhase],
  );

  const makeGame = useCallback(() => {
    const api: GameApi = { end: finish, sfx, best: loadBests()[def.id] ?? 0 };
    gameRef.current = def.create(api);
  }, [def, finish]);

  // A fresh instance doubles as the attract-mode backdrop of the title screen.
  useEffect(() => {
    makeGame();
    return () => {
      gameRef.current = null;
    };
  }, [makeGame]);

  useEffect(() => {
    const c = canvasRef.current;
    if (c) ctxRef.current = setupCanvas(c, ARCADE_W, ARCADE_H);
  }, []);

  const start = useCallback(() => {
    endedRef.current = false;
    makeGame();
    setResult(null);
    setPhase('playing');
    sfx('coin');
    const el = document.activeElement;
    if (el instanceof HTMLElement) el.blur();
    canvasRef.current?.focus({ preventScroll: true });
  }, [makeGame, setPhase]);

  const pause = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    setPhase('paused');
    sfx('click');
  }, [setPhase]);

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    setPhase('playing');
    sfx('click');
    canvasRef.current?.focus({ preventScroll: true });
  }, [setPhase]);

  useGameLoop((dt, t) => {
    const g = gameRef.current;
    const ctx = ctxRef.current;
    if (!g || !ctx) return;
    if (phaseRef.current === 'playing') g.update(dt);
    ctx.imageSmoothingEnabled = false;
    g.draw(ctx, t);
  });

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tgt = e.target instanceof HTMLElement ? e.target : null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT' || tgt.isContentEditable)) return;
      const ph = phaseRef.current;
      if (ph === 'playing') {
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          pause();
          return;
        }
        const isTrigger = e.key === ' ' || e.key === 'Enter';
        const used = e.repeat && isTrigger ? true : (gameRef.current?.keyDown?.(e.key) ?? false);
        if (used || GAME_KEYS.has(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      const onButton = !!tgt?.closest('button, a');
      if ((e.key === ' ' || e.key === 'Enter') && !onButton && !e.repeat) {
        e.preventDefault();
        if (ph === 'paused') resume();
        else start();
      } else if (ph === 'paused' && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        resume();
      }
    };
    const up = (e: KeyboardEvent) => {
      // always forward releases so held keys never get stuck across pauses
      gameRef.current?.keyUp?.(e.key);
    };
    const blur = () => pause();
    const vis = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [pause, resume, start]);

  // pointer / touch
  const toGame = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.floor(((e.clientX - r.left) / r.width) * ARCADE_W),
      y: Math.floor(((e.clientY - r.top) / r.height) * ARCADE_H),
    };
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'playing') return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    pointer.current = { id: e.pointerId, ax: e.clientX, ay: e.clientY, swiped: false };
    const p = toGame(e);
    gameRef.current?.pointerDown?.(p.x, p.y);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'playing') return;
    const p = toGame(e);
    const ptr = pointer.current;
    const down = !!ptr && ptr.id === e.pointerId;
    gameRef.current?.pointerMove?.(p.x, p.y, down);
    if (!down || !ptr) return;
    const dx = e.clientX - ptr.ax;
    const dy = e.clientY - ptr.ay;
    const threshold = Math.max(14, scale * 6);
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    const dir: SwipeDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    gameRef.current?.swipe?.(dir);
    ptr.ax = e.clientX;
    ptr.ay = e.clientY;
    ptr.swiped = true;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ptr = pointer.current;
    pointer.current = null;
    if (phaseRef.current !== 'playing' || !ptr || ptr.id !== e.pointerId) return;
    const p = toGame(e);
    gameRef.current?.pointerUp?.(p.x, p.y);
    if (!ptr.swiped) gameRef.current?.tap?.(p.x, p.y);
  };

  const cssW = Math.round(ARCADE_W * scale);
  const cssH = Math.round(ARCADE_H * scale);
  const compact = cssW < 420;

  const maxReward = useMemo(() => def.reward(1e9), [def]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button className="px-btn px-btn-dark px-btn-sm" onClick={() => { sfx('click'); onBack(); }}>
          <span aria-hidden>◀</span> Games
        </button>
        <div className="flex-1 min-w-0 text-center truncate font-[family-name:var(--font-tiny)] text-[11px] uppercase tracking-wider" style={{ color: def.accent }}>
          {def.name}
        </div>
        <span className="hidden sm:inline px-tiny text-[var(--color-paper-4)]">Best {best}</span>
        {phase === 'playing' || phase === 'paused' ? (
          <button
            className="px-btn px-btn-dark px-btn-sm px-btn-icon"
            onClick={() => (phase === 'playing' ? pause() : resume())}
            aria-label={phase === 'playing' ? 'Pause' : 'Resume'}
            title={phase === 'playing' ? 'Pause (P)' : 'Resume (P)'}
          >
            <PixelIcon name={phase === 'playing' ? 'pause' : 'play'} size={14} />
          </button>
        ) : (
          <span className="w-[30px]" />
        )}
      </div>

      <div ref={wrapRef} className="w-full flex justify-center">
        <div className="relative" style={{ width: cssW, height: cssH }}>
          <canvas
            ref={canvasRef}
            width={ARCADE_W}
            height={ARCADE_H}
            tabIndex={-1}
            aria-label={`${def.name} game screen`}
            className="pixelated block outline-none select-none"
            style={{ width: cssW, height: cssH, touchAction: 'none', background: C.night }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { pointer.current = null; }}
            onContextMenu={(e) => e.preventDefault()}
          />

          {phase === 'title' && (
            <Overlay compact={compact}>
              <div className="px-title text-[var(--color-gold-2)]" style={{ textShadow: `2px 2px 0 ${C.ink}` }}>{def.name}</div>
              <div className="text-[12px] text-[var(--color-paper-3)] mt-0.5">{def.tagline}</div>
              {!compact && (
                <ul className="mt-2 text-[12px] leading-snug text-left max-w-[380px] space-y-0.5">
                  {def.howTo.map((l) => (
                    <li key={l} className="flex gap-1.5"><span className="text-[var(--color-gold)]">▸</span><span>{l}</span></li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px]">
                {def.controls.map(([keys, label]) => (
                  <span key={label + keys.join()} className="inline-flex items-center gap-1.5"><KeyCaps keys={keys} /> {label}</span>
                ))}
              </div>
              <div className="mt-2 px-tiny text-[var(--color-mint)]">
                Best {best} · up to {maxReward} tickets
              </div>
              <button className="px-btn px-btn-primary mt-3" onClick={start} autoFocus>
                <PixelIcon name="play" size={14} /> Start
              </button>
              {!compact && <div className="mt-2 px-tiny text-[var(--color-paper-4)] px-blink">press space</div>}
            </Overlay>
          )}

          {phase === 'paused' && (
            <Overlay compact={compact}>
              <div className="px-title text-[var(--color-gold-2)]">Paused</div>
              <div className="text-[12px] text-[var(--color-paper-3)] mt-1">Sip your coffee. The beans will wait.</div>
              <div className="flex gap-2 mt-3">
                <button className="px-btn px-btn-green" onClick={resume} autoFocus>
                  <PixelIcon name="play" size={14} /> Resume
                </button>
                <button className="px-btn px-btn-dark" onClick={() => { sfx('click'); start(); }}>
                  <PixelIcon name="reset" size={14} /> Restart
                </button>
              </div>
            </Overlay>
          )}

          {phase === 'over' && result && (
            <Overlay compact={compact}>
              <div className="px-tiny text-[var(--color-paper-4)]">{def.id === 'memory' ? 'order up!' : 'game over'}</div>
              <div className="font-[family-name:var(--font-pixel)] font-bold leading-none mt-1 text-[var(--color-gold-2)]" style={{ fontSize: compact ? 28 : 40, textShadow: `3px 3px 0 ${C.ink}` }}>
                {result.score}
              </div>
              <div className="px-tiny mt-1 text-[var(--color-paper-3)]">{def.scoreLabel}</div>
              {result.newBest ? (
                <div className="mt-1 px-chip !bg-[var(--color-gold-2)] !text-[var(--color-ink)] px-blink">New best!</div>
              ) : (
                <div className="mt-1 text-[12px] text-[var(--color-paper-3)]">Best: {result.best}</div>
              )}
              {!compact && result.details.length > 0 && (
                <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 px-tiny text-[var(--color-mint)]">
                  {result.details.map((d) => <span key={d}>{d}</span>)}
                </div>
              )}
              <TicketLine r={result} />
              <div className="flex gap-2 mt-3">
                <button className="px-btn px-btn-primary" onClick={start} autoFocus>
                  <PixelIcon name="reset" size={14} /> Play again
                </button>
                <button className="px-btn px-btn-dark" onClick={() => { sfx('click'); onBack(); }}>
                  Games
                </button>
              </div>
            </Overlay>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketLine({ r }: { r: RunResult }) {
  let msg: ReactNode;
  if (r.asked <= 0) {
    msg = <span className="text-[var(--color-paper-3)]">No tickets this time. Score higher to earn some!</span>;
  } else if (r.given <= 0) {
    msg = <span className="text-[var(--color-paper-3)]">Daily arcade cap reached. Playing for fun now!</span>;
  } else {
    msg = (
      <span className="inline-flex items-center gap-1.5 text-[var(--color-gold-2)] font-semibold">
        <PixelIcon name="ticket" size={16} /> +{r.given} ticket{r.given === 1 ? '' : 's'}
        {r.given < r.asked && <span className="text-[var(--color-paper-3)] font-normal text-[11px]">(daily cap reached)</span>}
      </span>
    );
  }
  return (
    <div className="mt-2 flex flex-col items-center gap-0.5 text-[13px]">
      {msg}
      {r.base > 0 && (
        <span className="px-tiny text-[var(--color-paper-4)]">
          {r.onBreak ? 'break time bonus x2 applied' : 'half value outside breaks'}
        </span>
      )}
    </div>
  );
}

function Overlay({ children, compact }: { children: ReactNode; compact: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center text-center overflow-y-auto text-[var(--color-paper)] ${compact ? 'p-2' : 'p-4'} px-in`}
      style={{ background: 'rgba(20, 13, 24, 0.8)' }}
    >
      {children}
    </div>
  );
}
