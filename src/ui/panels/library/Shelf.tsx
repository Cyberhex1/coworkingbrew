import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../state/store';
import { BOOKS, GENRES, gutenbergUrl, type Genre } from '../../../data/books';
import { PixelIcon } from '../../PixelIcon';
import { Empty } from '../../Window';
import { BookCover } from './Cover';
import { curatedToShelf, finishBook, gxToShelf, progressOf, searchGutendex, sfx, wantBook, type GxBook, type ShelfBook } from './common';

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; count: number; results: GxBook[] };

const STATUS_LABEL = { want: 'Want', reading: 'Reading', done: 'Finished' } as const;

export function Shelf({
  query,
  setQuery,
  genre,
  setGenre,
  detail,
  setDetail,
  onRead,
}: {
  query: string;
  setQuery: (q: string) => void;
  genre: Genre | 'All';
  setGenre: (g: Genre | 'All') => void;
  detail: ShelfBook | null;
  setDetail: (b: ShelfBook | null) => void;
  onRead: (b: ShelfBook) => void;
}) {
  if (detail) return <BookDetail book={detail} onBack={() => setDetail(null)} onRead={onRead} />;
  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Search Project Gutenberg</span>
        <input
          className="px-input pr-9"
          type="search"
          value={query}
          placeholder="Search 70,000+ free books by title or author…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query) {
              e.stopPropagation();
              setQuery('');
            }
          }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
          <PixelIcon name="book" size={16} />
        </span>
      </label>
      {query.trim().length >= 2 ? (
        <SearchResults query={query.trim()} onOpen={setDetail} />
      ) : (
        <CuratedGrid genre={genre} setGenre={setGenre} onOpen={setDetail} />
      )}
    </div>
  );
}

function CuratedGrid({ genre, setGenre, onOpen }: { genre: Genre | 'All'; setGenre: (g: Genre | 'All') => void; onOpen: (b: ShelfBook) => void }) {
  const library = useApp((s) => s.library);
  const books = genre === 'All' ? BOOKS : BOOKS.filter((b) => b.genre === genre);
  return (
    <>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by genre">
        {(['All', ...GENRES] as const).map((g) => (
          <button
            key={g}
            type="button"
            className="px-chip cursor-pointer"
            aria-pressed={genre === g}
            style={genre === g ? { background: 'var(--color-gold-2)' } : undefined}
            onClick={() => {
              sfx('click');
              setGenre(g);
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="px-inset px-2 py-3 sm:px-3">
        <ul className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-6 gap-y-4">
          {books.map((b) => {
            const entry = library.find((x) => x.id === b.id);
            const sb = curatedToShelf(b.id)!;
            return (
              <li key={b.id} className="flex flex-col items-stretch">
                <button
                  type="button"
                  className="group relative self-center flex flex-col items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2"
                  onClick={() => {
                    sfx('click');
                    onOpen(sb);
                  }}
                  aria-label={`${b.title} by ${b.author}${entry ? ` (${STATUS_LABEL[entry.status]})` : ''}`}
                  title={`${b.title} · ${b.author}`}
                >
                  <span className="block transition-transform duration-75 group-hover:-translate-y-1">
                    <BookCover title={b.title} cover={b.cover} />
                  </span>
                  {entry && (
                    <span
                      className="px-tiny absolute -top-1.5 -right-1.5 px-1 py-0.5 border-2 border-[var(--color-ink)]"
                      style={{
                        background: entry.status === 'done' ? 'var(--color-leaf-2)' : entry.status === 'reading' ? 'var(--color-gold-2)' : 'var(--color-paper)',
                        color: entry.status === 'done' ? '#fff' : 'var(--color-ink)',
                      }}
                    >
                      {entry.status === 'done' ? '✓' : entry.status === 'reading' ? `${Math.round(progressOf(entry) * 100)}%` : '♥'}
                    </span>
                  )}
                </button>
                {/* wooden shelf plank: adjacent items join into one board */}
                <span aria-hidden className="block h-[8px] bg-[var(--color-cocoa-2)] border-y-2 border-[var(--color-cocoa)] shadow-[0_3px_0_rgba(42,26,31,0.25)]" />
                <span aria-hidden className="mt-1.5 px-1 text-center text-[11px] leading-tight text-[var(--color-cocoa)] truncate">{b.author}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-[12px] text-[var(--color-cocoa)]">
        All books are public domain via Project Gutenberg. Search above to find more.
      </p>
    </>
  );
}

function SearchResults({ query, onOpen }: { query: string; onOpen: (b: ShelfBook) => void }) {
  const [state, setState] = useState<SearchState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState({ kind: 'loading' });
    const ctl = new AbortController();
    const t = setTimeout(() => {
      searchGutendex(query, ctl.signal)
        .then((r) => setState({ kind: 'done', ...r }))
        .catch((e: unknown) => {
          if ((e as Error)?.name === 'AbortError') return;
          setState({ kind: 'error', message: 'The Gutenberg catalogue did not answer. It can be slow; try again in a moment.' });
        });
    }, 400);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, attempt]);

  const results = useMemo(() => (state.kind === 'done' ? state.results.map(gxToShelf) : []), [state]);

  if (state.kind === 'loading' || state.kind === 'idle') {
    return (
      <div className="px-inset p-4 flex items-center gap-2 text-sm" role="status">
        <PixelIcon name="book" size={20} className="px-bob" /> Searching the stacks for “{query}”…
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="px-inset p-4 flex flex-col items-start gap-2 text-sm" role="alert">
        <span>{state.message}</span>
        <button type="button" className="px-btn px-btn-sm" onClick={() => setAttempt((n) => n + 1)}>
          <PixelIcon name="reset" size={14} /> Retry
        </button>
      </div>
    );
  }
  if (!results.length) return <Empty icon="book">No books matched “{query}”. Try an author's surname.</Empty>;
  return (
    <div className="flex flex-col gap-2">
      <div className="px-tiny text-[var(--color-cocoa)]">
        {state.count.toLocaleString()} result{state.count === 1 ? '' : 's'}
        {state.count > results.length ? ` · showing top ${results.length}` : ''}
      </div>
      <ul className="flex flex-col gap-1.5">
        {results.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              className="w-full flex items-center gap-3 p-2 text-left px-inset hover:bg-[#fff8e8] cursor-pointer"
              onClick={() => {
                sfx('click');
                onOpen(b);
              }}
            >
              <BookCover title={b.title} cover={b.cover} size="xs" />
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold leading-tight truncate">{b.title}</span>
                <span className="block text-[12px] text-[var(--color-cocoa)] truncate">{b.author}</span>
              </span>
              <span className="px-tiny shrink-0 text-[var(--color-cocoa)] text-right" title="Downloads in the last 30 days">
                ⬇ {(b.downloads ?? 0).toLocaleString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookDetail({ book, onBack, onRead }: { book: ShelfBook; onBack: () => void; onRead: (b: ShelfBook) => void }) {
  const entry = useApp((s) => s.library.find((x) => x.id === book.id));
  const pct = entry ? Math.round(progressOf(entry) * 100) : 0;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <button type="button" className="px-btn px-btn-sm" onClick={onBack}>
          ← Back to shelf
        </button>
      </div>
      <div className="flex flex-col min-[420px]:flex-row gap-4 items-center min-[420px]:items-start">
        <BookCover title={book.title} author={book.author} cover={book.cover} size="lg" />
        <div className="flex-1 min-w-0 flex flex-col gap-2 w-full">
          <div>
            <h3 className="px-title !text-[20px] leading-tight">{book.title}</h3>
            <div className="text-[14px] text-[var(--color-cocoa)] mt-1">{book.author}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {book.genre && <span className="px-chip">{book.genre}</span>}
            {book.year && <span className="px-chip">{book.year}</span>}
            {typeof book.downloads === 'number' && <span className="px-chip">⬇ {book.downloads.toLocaleString()}</span>}
            {entry && (
              <span className="px-chip" style={{ background: entry.status === 'done' ? 'var(--color-leaf-2)' : 'var(--color-gold-2)', color: entry.status === 'done' ? '#fff' : undefined }}>
                {entry.status === 'done' ? 'Finished ✓' : entry.status === 'reading' ? `Reading · ${pct}%` : 'On your list'}
              </span>
            )}
          </div>
          {book.blurb && <p className="text-[14px] leading-snug font-[var(--font-read)] line-clamp-6" style={{ WebkitFontSmoothing: 'antialiased' }}>{book.blurb}</p>}
          {book.subjects && book.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.subjects.map((s) => (
                <span key={s} className="px-tiny px-1.5 py-1 bg-[var(--color-paper-2)] border border-[var(--color-paper-4)] normal-case">
                  {s}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-1">
            <button type="button" className="px-btn px-btn-primary" onClick={() => onRead(book)}>
              <PixelIcon name="play" size={14} /> {entry && entry.position > 0 && entry.status !== 'done' ? 'Continue reading' : 'Read now'}
            </button>
            <button type="button" className="px-btn" onClick={() => wantBook(book)} disabled={entry?.status === 'want'}>
              <PixelIcon name="heart" size={14} /> {entry?.status === 'want' ? 'On your list' : 'Want to read'}
            </button>
            <button type="button" className="px-btn px-btn-green" onClick={() => finishBook(book)} disabled={entry?.status === 'done'}>
              <PixelIcon name="check" size={14} /> {entry?.status === 'done' ? 'Finished' : 'Mark finished'}
            </button>
          </div>
          <a className="text-[13px] underline text-[var(--color-cocoa)] hover:text-[var(--color-terra)] self-start" href={gutenbergUrl(book.id)} target="_blank" rel="noopener noreferrer">
            View on gutenberg.org ↗
          </a>
        </div>
      </div>
    </div>
  );
}
