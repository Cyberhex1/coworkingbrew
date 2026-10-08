import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../../state/store';
import { gutenbergUrl } from '../../../data/books';
import { PixelIcon } from '../../PixelIcon';
import { BookFetchError, loadBookPages } from './text';
import { entryOf, finishBook, sfx, type ShelfBook } from './common';

type FontSize = 'S' | 'M' | 'L';
type Theme = 'paper' | 'sepia' | 'night';

const FONT_PX: Record<FontSize, number> = { S: 15, M: 17, L: 20 };
const THEMES: Record<Theme, { bg: string; fg: string; muted: string; label: string }> = {
  paper: { bg: '#fffaf0', fg: '#2a1a1f', muted: '#7a6a5a', label: 'Paper' },
  sepia: { bg: '#f1e0bf', fg: '#4a3022', muted: '#86684c', label: 'Sepia' },
  night: { bg: '#1d2033', fg: '#e8dcc4', muted: '#9a93a8', label: 'Night' },
};
const PREFS_KEY = 'cb:reader-prefs';

function loadPrefs(): { size: FontSize; theme: Theme } {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { size?: FontSize; theme?: Theme };
    return { size: p.size && p.size in FONT_PX ? p.size : 'M', theme: p.theme && p.theme in THEMES ? p.theme : 'paper' };
  } catch {
    return { size: 'M', theme: 'paper' };
  }
}

type LoadState = { kind: 'loading' } | { kind: 'ready'; pages: string[][] } | { kind: 'error'; message: string; reason: BookFetchError['kind'] };

export function Reader({ book, onBack }: { book: ShelfBook; onBack: () => void }) {
  const entry = useApp((s) => s.library.find((b) => b.id === book.id));
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [prefs, setPrefs] = useState(loadPrefs);
  const rootRef = useRef<HTMLDivElement>(null);

  const updatePrefs = (p: Partial<typeof prefs>) => {
    sfx('click');
    setPrefs((cur) => {
      const next = { ...cur, ...p };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // per-viewer nicety only
      }
      return next;
    });
  };

  // fetch + paginate
  useEffect(() => {
    let alive = true;
    setState({ kind: 'loading' });
    loadBookPages(book.id)
      .then((pages) => {
        if (!alive) return;
        const e = entryOf(book.id);
        let start = 0;
        if (e && e.status !== 'done' && e.pages) {
          // rescale if the saved position came from a different pagination
          start = e.pages === pages.length ? e.position : Math.round((e.position / e.pages) * pages.length);
        }
        setPage(Math.max(0, Math.min(pages.length - 1, start)));
        setState({ kind: 'ready', pages });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const reason = err instanceof BookFetchError ? err.kind : 'network';
        setState({ kind: 'error', reason, message: err instanceof Error ? err.message : 'Something went wrong.' });
      });
    return () => {
      alive = false;
    };
  }, [book.id, attempt]);

  const total = state.kind === 'ready' ? state.pages.length : 0;

  // auto-save position
  useEffect(() => {
    if (state.kind !== 'ready') return;
    const e = entryOf(book.id);
    const status = e?.status === 'done' ? 'done' : 'reading';
    if (e && e.position === page && e.pages === total && e.status === status) return;
    useApp.getState().upsertBook({ id: book.id, title: book.title, author: book.author, position: page, pages: total, status });
  }, [page, total, state.kind, book.id, book.title, book.author]);

  const go = useCallback(
    (delta: number) => {
      if (!total) return;
      setPage((p) => {
        const n = Math.max(0, Math.min(total - 1, p + delta));
        if (n !== p) sfx('click');
        return n;
      });
    },
    [total],
  );

  // back to the top of the page when turning
  useEffect(() => {
    rootRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 });
  }, [page]);

  // ← → while the reader is open; capture phase so the world never sees them
  useEffect(() => {
    if (state.kind !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const delta = e.key === 'ArrowRight' || e.key === 'PageDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'PageUp' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      e.stopPropagation();
      go(delta);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [state.kind, go]);

  // simple swipe for touch screens
  const touch = useRef<{ x: number; y: number } | null>(null);

  const theme = THEMES[prefs.theme];
  const done = entry?.status === 'done';

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="px-btn px-btn-sm" onClick={onBack}>
          ← My books
        </button>
        <div className="flex-1 min-w-[140px]">
          <div className="text-[14px] font-semibold leading-tight truncate">{book.title}</div>
          <div className="text-[12px] text-[var(--color-cocoa)] truncate">{book.author}</div>
        </div>
        <div className="flex gap-1" role="group" aria-label="Text size">
          {(['S', 'M', 'L'] as FontSize[]).map((s) => (
            <button key={s} type="button" className="px-btn px-btn-sm min-w-[30px]" data-active={prefs.size === s} aria-pressed={prefs.size === s} aria-label={`Text size ${s === 'S' ? 'small' : s === 'M' ? 'medium' : 'large'}`} onClick={() => updatePrefs({ size: s })}>
              <span style={{ fontSize: s === 'S' ? 10 : s === 'M' ? 13 : 16 }}>A</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label="Reading theme">
          {(Object.keys(THEMES) as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              className="px-btn px-btn-sm"
              data-active={prefs.theme === t}
              aria-pressed={prefs.theme === t}
              aria-label={`${THEMES[t].label} theme`}
              title={THEMES[t].label}
              onClick={() => updatePrefs({ theme: t })}
            >
              <span className="inline-block w-3.5 h-3.5 border-2 border-[var(--color-ink)]" style={{ background: THEMES[t].bg }} />
              <span className="hidden sm:inline">{THEMES[t].label}</span>
            </button>
          ))}
        </div>
      </div>

      {state.kind === 'loading' && (
        <div className="px-inset p-6 flex flex-col items-center gap-2 text-sm" role="status">
          <PixelIcon name="book" size={32} className="px-bob" />
          Fetching the book from the stacks…
        </div>
      )}

      {state.kind === 'error' && <Fallback book={book} reason={state.reason} message={state.message} onRetry={() => setAttempt((n) => n + 1)} />}

      {state.kind === 'ready' && (
        <>
          <article
            aria-label={`${book.title}, page ${page + 1} of ${total}`}
            aria-live="polite"
            className="border-2 border-[var(--color-ink)] px-4 py-5 sm:px-8 sm:py-7 min-h-[300px]"
            style={{
              background: theme.bg,
              color: theme.fg,
              fontFamily: 'var(--font-read)',
              fontSize: FONT_PX[prefs.size],
              lineHeight: 1.65,
              WebkitFontSmoothing: 'antialiased',
              boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.04), 0 3px 0 rgba(42,26,31,0.3)',
            }}
            onTouchStart={(e) => {
              const p = e.touches[0];
              touch.current = { x: p.clientX, y: p.clientY };
            }}
            onTouchEnd={(e) => {
              const s = touch.current;
              touch.current = null;
              if (!s) return;
              const p = e.changedTouches[0];
              const dx = p.clientX - s.x;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(p.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1);
            }}
          >
            {state.pages[page].map((p, i) => (
              <Fragment key={`${page}-${i}`}>
                <Para text={p} muted={theme.muted} />
              </Fragment>
            ))}
          </article>

          <div className="flex items-center gap-2">
            <div className="px-progress flex-1" role="progressbar" aria-label="Reading progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={page + 1}>
              <span style={{ width: `${((page + 1) / total) * 100}%` }} />
            </div>
            <span className="px-tiny whitespace-nowrap">{Math.round(((page + 1) / total) * 100)}%</span>
          </div>

          {page === total - 1 && (
            <div className="px-inset p-3 flex flex-wrap items-center gap-2">
              <PixelIcon name={done ? 'star' : 'sparkle'} size={20} />
              <span className="flex-1 text-[14px]">{done ? 'You finished this book. Lovely!' : 'The end! Mark it finished to earn your tickets.'}</span>
              {!done && (
                <button type="button" className="px-btn px-btn-green" onClick={() => finishBook(book)}>
                  Mark as finished 🎉
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button type="button" className="px-btn" onClick={() => go(-1)} disabled={page === 0} aria-label="Previous page">
              ← Prev
            </button>
            <div className="text-center">
              <div className="text-[14px] font-semibold">
                Page {page + 1} of {total}
              </div>
              <div className="hidden sm:flex items-center justify-center gap-1 px-tiny text-[var(--color-cocoa)] mt-1">
                <span className="px-kbd">←</span>
                <span className="px-kbd">→</span> to turn
              </div>
            </div>
            <button type="button" className="px-btn px-btn-primary" onClick={() => go(1)} disabled={page >= total - 1} aria-label="Next page">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const HEADING = /^(chapter|book|part|stave|letter|volume|act|scene|section)\b[^\n]{0,50}$|^[IVXLC]+\.?$/i;

function Para({ text, muted }: { text: string; muted: string }) {
  const isHeading = text.length < 70 && !text.includes('\n') && (HEADING.test(text) || (text === text.toUpperCase() && /[A-Z]/.test(text)));
  if (isHeading) {
    return <h4 className="text-center font-bold tracking-wide mt-4 mb-3" style={{ fontSize: '1.05em' }}>{italics(text)}</h4>;
  }
  const verse = text.includes('\n');
  return (
    <p
      className="mb-[0.8em]"
      style={{ whiteSpace: verse ? 'pre-line' : undefined, textIndent: verse ? 0 : '1.2em', paddingLeft: verse ? '1em' : 0, color: /^\[.*\]$/.test(text) ? muted : undefined }}
    >
      {italics(text)}
    </p>
  );
}

/** Gutenberg marks italics as _word_. */
function italics(text: string): ReactNode {
  if (!text.includes('_')) return text;
  return text.split(/(_[^_\n]+_)/g).map((part, i) => (/^_[^_\n]+_$/.test(part) ? <em key={i}>{part.slice(1, -1)}</em> : part));
}

function Fallback({ book, reason, message, onRetry }: { book: ShelfBook; reason: BookFetchError['kind']; message: string; onRetry: () => void }) {
  const entry = useApp((s) => s.library.find((b) => b.id === book.id));
  const pct = entry?.status === 'done' ? 100 : entry?.pages ? Math.round(((entry.position + 1) / entry.pages) * 100) : 0;
  const setPct = (v: number) => {
    const e = entryOf(book.id);
    useApp.getState().upsertBook({ id: book.id, title: book.title, author: book.author, status: e?.status === 'done' ? 'done' : 'reading', pages: 100, position: Math.max(0, Math.min(99, v - 1)) });
  };
  return (
    <div className="px-inset p-4 flex flex-col gap-3" role="alert">
      <div className="flex items-start gap-3">
        <PixelIcon name="book" size={32} />
        <div className="text-[14px] leading-snug">
          <div className="font-semibold mb-1">This book won't open in the café right now.</div>
          <div className="text-[var(--color-cocoa)]">
            {reason === 'missing' ? 'Project Gutenberg has no plain-text edition we can show for it.' : 'The book shelf proxy could not fetch the text.'} You can still read it on gutenberg.org and track your progress here.
          </div>
          <div className="px-tiny mt-1 opacity-60 normal-case">{message}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="px-btn px-btn-primary" href={gutenbergUrl(book.id)} target="_blank" rel="noopener noreferrer">
          Read on gutenberg.org ↗
        </a>
        <button type="button" className="px-btn" onClick={onRetry}>
          <PixelIcon name="reset" size={14} /> Try again
        </button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold">How far along are you? {pct}%</span>
        <input type="range" className="px-range" min={0} max={100} step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label="Reading progress percent" disabled={entry?.status === 'done'} />
      </label>
      <div>
        <button type="button" className="px-btn px-btn-green" onClick={() => finishBook(book)} disabled={entry?.status === 'done'}>
          <PixelIcon name="check" size={14} /> {entry?.status === 'done' ? 'Finished ✓' : 'Mark as finished 🎉'}
        </button>
      </div>
    </div>
  );
}
