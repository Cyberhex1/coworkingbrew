import { useApp, type BookEntry } from '../../../state/store';
import { toast } from '../../../state/ui';
import { game } from '../../../engine/gameRef';
import { audio } from '../../../audio/engine';
import { BOOK_BY_ID, fmtYear } from '../../../data/books';

/** Anything the library can show: a curated classic or a Gutendex search hit. */
export interface ShelfBook {
  id: number;
  title: string;
  author: string;
  cover: [string, string];
  year?: string;
  genre?: string;
  blurb?: string;
  subjects?: string[];
  downloads?: number;
}

const FALLBACK_COVERS: [string, string][] = [
  ['#5b85b8', '#fbf1dc'], ['#d9734e', '#2a1a1f'], ['#3f7d4a', '#f7d97a'], ['#6e4a7a', '#f4e4c1'],
  ['#7a4830', '#f7d97a'], ['#4a9a8f', '#fbf1dc'], ['#d97a86', '#2a1a1f'], ['#2e3a5e', '#e2b04a'],
];

export function coverFor(id: number): [string, string] {
  return BOOK_BY_ID[id]?.cover ?? FALLBACK_COVERS[Math.abs(id * 2654435761) % FALLBACK_COVERS.length];
}

/** Readable text colour for a background hex. */
export function inkOn(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#2a1a1f' : '#fbf1dc';
}

export function curatedToShelf(id: number): ShelfBook | null {
  const b = BOOK_BY_ID[id];
  if (!b) return null;
  return { id: b.id, title: b.title, author: b.author, cover: b.cover, year: fmtYear(b.year), genre: b.genre, blurb: b.blurb };
}

export function entryToShelf(e: BookEntry): ShelfBook {
  return curatedToShelf(e.id) ?? { id: e.id, title: e.title, author: e.author, cover: coverFor(e.id) };
}

// ------------------------------------------------------------------ Gutendex

export interface GxBook {
  id: number;
  title: string;
  authors: { name: string; birth_year: number | null; death_year: number | null }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  download_count: number;
  media_type?: string;
  summaries?: string[];
}

/** "Shelley, Mary Wollstonecraft" -> "Mary Wollstonecraft Shelley" */
export function prettyAuthor(name: string) {
  const m = /^([^,]+),\s*(.+)$/.exec(name);
  return m ? `${m[2]} ${m[1]}`.replace(/\s*\(.*?\)\s*/g, ' ').trim() : name;
}

export function gxToShelf(b: GxBook): ShelfBook {
  const curated = curatedToShelf(b.id);
  const a = b.authors[0];
  const years = a && (a.birth_year || a.death_year) ? `${a.birth_year ?? '?'}–${a.death_year ?? '?'}` : undefined;
  const summary = b.summaries?.[0]?.replace(/\s*\(This is an automatically generated summary\.\)\s*$/i, '');
  return {
    id: b.id,
    title: b.title.replace(/\s*\$[a-z]\s*/g, ' ').trim(),
    author: b.authors.length ? b.authors.map((x) => prettyAuthor(x.name)).join(', ') : 'Anonymous',
    cover: coverFor(b.id),
    year: curated?.year ?? (years ? `author ${years}` : undefined),
    genre: curated?.genre,
    blurb: curated?.blurb ?? summary,
    subjects: [...new Set([...b.subjects, ...b.bookshelves].map((s) => s.replace(/^(Browsing|Category): /, '').split(' -- ')[0]))].slice(0, 8),
    downloads: b.download_count,
  };
}

const searchCache = new Map<string, { count: number; results: GxBook[] }>();

export async function searchGutendex(q: string, signal: AbortSignal) {
  const key = q.trim().toLowerCase();
  const hit = searchCache.get(key);
  if (hit) return hit;
  const res = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(key)}`, { signal });
  if (!res.ok) throw new Error(`Gutendex ${res.status}`);
  const data = (await res.json()) as { count: number; results: GxBook[] };
  const out = { count: data.count ?? 0, results: (data.results ?? []).filter((b) => !b.media_type || b.media_type === 'Text') };
  searchCache.set(key, out);
  return out;
}

// ------------------------------------------------------------------ library actions

function sfx(name: 'click' | 'open' | 'success' | 'pop') {
  try {
    audio.sfx(name);
  } catch {
    // audio is optional
  }
}

function say(text: string) {
  try {
    game()?.say('me', text);
  } catch {
    // world may not be mounted
  }
}

export function entryOf(id: number) {
  return useApp.getState().library.find((b) => b.id === id);
}

export function wantBook(b: ShelfBook) {
  const ex = entryOf(b.id);
  useApp.getState().upsertBook({ id: b.id, title: b.title, author: b.author, status: 'want' });
  sfx('pop');
  toast(ex ? `"${b.title}" moved to Want to read` : `Added "${b.title}" to your shelf`, 'success');
}

/** Ensures the book is in the library with status 'reading' (finished books stay finished). */
export function startReading(b: ShelfBook) {
  const ex = entryOf(b.id);
  useApp.getState().upsertBook({ id: b.id, title: b.title, author: b.author, status: ex?.status === 'done' ? 'done' : 'reading' });
  sfx('open');
  say(ex && ex.position > 0 ? `Back to "${b.title}" 📖` : `Starting "${b.title}" 📖`);
}

export function finishBook(b: Pick<ShelfBook, 'id' | 'title' | 'author'>) {
  const store = useApp.getState();
  const ex = entryOf(b.id);
  if (ex?.status === 'done') {
    toast(`Already finished "${b.title}"`, 'info');
    return;
  }
  // upsertBook only awards on an update, so make sure the entry exists first.
  if (!ex) store.upsertBook({ id: b.id, title: b.title, author: b.author, status: 'reading' });
  const pages = entryOf(b.id)?.pages;
  useApp.getState().upsertBook({ id: b.id, status: 'done', ...(pages ? { position: pages - 1 } : {}) });
  if (ex?.claimed) toast(`Finished "${b.title}" again 🎉`, 'success');
  sfx('success');
  say(`Finished "${b.title}"! 🎉`);
}

export function removeBook(id: number) {
  const ex = entryOf(id);
  useApp.getState().removeBook(id);
  sfx('click');
  if (ex) toast(`Removed "${ex.title}"`, 'info');
}

export function progressOf(e: BookEntry) {
  if (e.status === 'done') return 1;
  if (!e.pages) return 0;
  return Math.min(1, (e.position + 1) / e.pages);
}

export { sfx };
