import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * requestAnimationFrame loop. `cb(dt, t)` gets a clamped delta (seconds) and
 * the absolute time (seconds). Stops while the tab is hidden and on unmount.
 */
export function useGameLoop(cb: (dt: number, t: number) => void, active = true) {
  const cbRef = useRef(cb);
  useLayoutEffect(() => {
    cbRef.current = cb;
  });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let alive = true;
    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      cbRef.current(dt, now / 1000);
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && alive) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active]);
}

/**
 * Largest integer scale at which a `w`x`h` canvas fits the container width
 * (and `maxH` px of height). Falls back to a fractional fit below 2x so tiny
 * phones still get a usable screen.
 */
export function usePixelScale(ref: RefObject<HTMLElement | null>, w: number, h: number, maxH = 440) {
  const [scale, setScale] = useState(3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth;
      if (!avail) return;
      // leave room for the window chrome, banner and cabinet around the screen
      const limitH = Math.max(h, Math.min(maxH, window.innerHeight * 0.86 - 300));
      const fit = Math.min(avail / w, limitH / h);
      setScale(fit >= 2 ? Math.floor(fit) : Math.max(1, Math.floor(fit * 4) / 4));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref, w, h, maxH]);
  return scale;
}

/** Set up a crisp low-res 2D context on a canvas. */
export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (ctx) ctx.imageSmoothingEnabled = false;
  return ctx;
}
