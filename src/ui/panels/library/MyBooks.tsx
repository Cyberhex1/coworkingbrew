import { Fragment, useEffect, useRef, useState } from 'react';
import { useApp, type BookEntry } from '../../../state/store';
import { ECONOMY } from '../../../data/catalog';
import { gutenbergUrl } from '../../../data/books';
import { PixelIcon } from '../../PixelIcon';
import { Empty, Tickets } from '../../Window';
import { BookCover } from './Cover';
import { entryToShelf, finishBook, progressOf, removeBook, wantBook, type ShelfBook } from './common';

const GROUPS: { status: BookEntry['status']; label: string; icon: string }[] = [
  { status: 'reading', label: 'Reading', icon: 'book' },
  { status: 'want', label: 'Want to read', icon: 'heart' },
  { status: 'done', label: 'Finished', icon: 'star' },
];

export function MyBooks({ onRead, onBrowse }: { onRead: (b: ShelfBook) => void; onBrowse: () => void }) {
  const library = useApp((s) => s.library);
  const reward = ECONOMY.bookFinished;

  return (
    <div className="flex flex-col gap-4">
      <div className="px-inset px-3 py-2 flex items-center gap-2 text-[13px]">
        <PixelIcon name="sparkle" size={18} />
        <span className="flex-1">
          Earn <Tickets n={reward} size={14} /> when you finish a book.
        </span>
        <span className="px-tiny text-[var(--color-cocoa)] whitespace-nowrap">{library.filter((b) => b.status === 'done').length} finished</span>
      </div>

      {library.length === 0 ? (
        <Empty icon="book">
          <span className="block mb-3">Your shelf is empty. Pick a classic from the library wall to get started.</span>
          <button type="button" className="px-btn px-btn-primary px-btn-sm" onClick={onBrowse}>
            Browse the shelf
          </button>
        </Empty>
      ) : (
        GROUPS.map((g) => {
          const items = library.filter((b) => b.status === g.status).sort((a, b) => (g.status === 'done' ? b.addedAt - a.addedAt : 0));
          if (!items.length) return null;
          return (
            <section key={g.status} aria-label={g.label} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 font-semibold text-[15px]">
                <PixelIcon name={g.icon} size={16} /> {g.label}
                <span className="px-tiny text-[var(--color-cocoa)] ml-1">{items.length}</span>
              </h3>
              <ul className="flex flex-col gap-2">
                {items.map((e) => (
                  <Fragment key={e.id}>
                    <BookRow entry={e} onRead={onRead} />
                  </Fragment>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function BookRow({ entry, onRead }: { entry: BookEntry; onRead: (b: ShelfBook) => void }) {
  const book = entryToShelf(entry);
  const pct = Math.round(progressOf(entry) * 100);
  const [confirm, setConfirm] = useState(false);

  return (
    <li className="px-inset p-2.5 flex gap-3">
      <BookCover title={book.title} cover={book.cover} size="xs" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold leading-tight truncate" title={book.title}>{book.title}</div>
            <div className="text-[12px] text-[var(--color-cocoa)] truncate">{book.author}</div>
          </div>
          {confirm ? (
            <span className="flex gap-1 shrink-0">
              <button type="button" className="px-btn px-btn-sm px-btn-primary" onClick={() => removeBook(entry.id)}>Remove</button>
              <button type="button" className="px-btn px-btn-sm" onClick={() => setConfirm(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" className="px-btn px-btn-icon px-btn-sm shrink-0" aria-label={`Remove ${book.title} from your shelf`} title="Remove" onClick={() => setConfirm(true)}>
              <PixelIcon name="close" size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="px-progress flex-1" role="progressbar" aria-label={`${book.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="px-tiny whitespace-nowrap text-[var(--color-cocoa)]">
            {entry.status === 'done' ? 'Done ✓' : entry.pages ? `p.${entry.position + 1}/${entry.pages} · ${pct}%` : 'Not started'}
          </span>
        </div>

        <NotesField entry={entry} />

        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="px-btn px-btn-sm px-btn-primary" onClick={() => onRead(book)}>
            <PixelIcon name="play" size={12} />
            {entry.status === 'done' ? 'Reread' : entry.position > 0 ? 'Continue' : 'Start reading'}
          </button>
          {entry.status !== 'done' && (
            <button type="button" className="px-btn px-btn-sm px-btn-green" onClick={() => finishBook(book)}>
              <PixelIcon name="check" size={12} /> Finished
            </button>
          )}
          {entry.status === 'done' && (
            <button type="button" className="px-btn px-btn-sm" onClick={() => wantBook(book)}>
              <PixelIcon name="heart" size={12} /> Read again later
            </button>
          )}
          <a className="px-btn px-btn-sm" href={gutenbergUrl(entry.id)} target="_blank" rel="noopener noreferrer" aria-label={`${book.title} on gutenberg.org (opens a new tab)`}>
            gutenberg ↗
          </a>
        </div>
      </div>
    </li>
  );
}

/** Notes are edited locally and saved to the store after a short pause (and on blur). */
function NotesField({ entry }: { entry: BookEntry }) {
  const [text, setText] = useState(entry.notes);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(text);
  latest.current = text;

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const cur = useApp.getState().library.find((b) => b.id === entry.id);
    if (cur && cur.notes !== latest.current) useApp.getState().upsertBook({ id: entry.id, notes: latest.current });
    setSaved(true);
  };

  // pick up external changes (e.g. another tab) while not typing
  useEffect(() => {
    if (!timer.current) setText(entry.notes);
  }, [entry.notes]);

  // save pending edits on unmount
  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      const cur = useApp.getState().library.find((b) => b.id === entry.id);
      if (cur && cur.notes !== latest.current) useApp.getState().upsertBook({ id: entry.id, notes: latest.current });
    }
  }, [entry.id]);

  return (
    <label className="block">
      <span className="sr-only">Notes for {entry.title}</span>
      <textarea
        className="px-input !text-[13px] resize-y min-h-[52px]"
        rows={2}
        maxLength={4000}
        placeholder="Notes, favourite quotes, thoughts…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(flush, 600);
        }}
        onBlur={flush}
      />
      <span className="px-tiny text-[var(--color-cocoa)] opacity-70" aria-live="polite">{saved ? (text ? 'Saved' : '') : 'Saving…'}</span>
    </label>
  );
}
