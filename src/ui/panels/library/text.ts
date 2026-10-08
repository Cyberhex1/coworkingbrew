// Fetching, cleaning and paginating Project Gutenberg plain-text books.

export const PAGE_CHARS = 1800;
const SESSION_LIMIT = 1_500_000; // chars; keeps sessionStorage well under quota
const SESSION_PREFIX = 'cb:book:';

const textCache = new Map<number, string>();
const pageCache = new Map<number, string[][]>();
const inflight = new Map<number, Promise<string>>();

export class BookFetchError extends Error {
  constructor(message: string, readonly kind: 'network' | 'missing' | 'proxy') {
    super(message);
  }
}

/** Remove the Project Gutenberg licence header and footer. */
export function stripGutenberg(raw: string): string {
  let t = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const start = /^\*{3}\s*START OF[^\n]*$/im.exec(t);
  if (start) t = t.slice(start.index + start[0].length);
  const end = /^\*{3}\s*END OF[^\n]*$/im.exec(t) ?? /^End of (the )?Project Gutenberg/im.exec(t);
  if (end) t = t.slice(0, end.index);
  return t.trim();
}

/** Split cleaned text into display paragraphs, unwrapping Gutenberg's hard line breaks. */
export function toParagraphs(text: string): string[] {
  const out: string[] = [];
  for (const block of text.split(/\n[ \t]*\n+/)) {
    const lines = block.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim().length > 0);
    if (!lines.length) continue;
    const longest = Math.max(...lines.map((l) => l.trim().length));
    const indented = lines.filter((l) => /^\s{2,}/.test(l)).length;
    // Verse, tables of contents and letter headings keep their line breaks.
    const keepBreaks = lines.length > 1 && (longest < 52 || indented > lines.length / 2);
    out.push(keepBreaks ? lines.map((l) => l.trim()).join('\n') : lines.map((l) => l.trim()).join(' ').replace(/\s{2,}/g, ' '));
  }
  return out;
}

function splitLong(p: string, target: number): string[] {
  if (p.length <= target * 1.4) return [p];
  const sentences = p.split(/(?<=[.!?;:]["'”’)]?)\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && cur.length + s.length + 1 > target) {
      chunks.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) chunks.push(cur);
  // a single monster "sentence": hard-split on whitespace
  return chunks.flatMap((c) => {
    if (c.length <= target * 1.6) return [c];
    const parts: string[] = [];
    let rest = c;
    while (rest.length > target) {
      const cut = rest.lastIndexOf(' ', target);
      const at = cut > target / 2 ? cut : target;
      parts.push(rest.slice(0, at));
      rest = rest.slice(at).trimStart();
    }
    if (rest) parts.push(rest);
    return parts;
  });
}

/** Group paragraphs into pages of roughly `target` characters, breaking on paragraph boundaries. */
export function paginate(paras: string[], target = PAGE_CHARS): string[][] {
  const pages: string[][] = [];
  let cur: string[] = [];
  let len = 0;
  for (const p of paras) {
    for (const piece of splitLong(p, target)) {
      if (cur.length && len + piece.length > target) {
        pages.push(cur);
        cur = [];
        len = 0;
      }
      cur.push(piece);
      len += piece.length;
    }
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [['(This book appears to be empty.)']];
}

function readSession(id: number): string | null {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + id);
  } catch {
    return null;
  }
}

function writeSession(id: number, text: string) {
  if (text.length > SESSION_LIMIT) return;
  try {
    sessionStorage.setItem(SESSION_PREFIX + id, text);
  } catch {
    // quota exceeded or storage blocked: the in-memory cache still works
  }
}

async function download(id: number): Promise<string> {
  // Downloads are shared between callers, so they time out on their own
  // instead of being cancelled by whichever component asked first.
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(`/api/book/${id}`, { signal: ctl.signal, headers: { Accept: 'text/plain' } });
  } catch {
    clearTimeout(timer);
    throw new BookFetchError('Could not reach the book proxy.', 'network');
  }
  if (res.status === 404) {
    clearTimeout(timer);
    throw new BookFetchError('That book has no plain-text edition.', 'missing');
  }
  if (!res.ok) {
    clearTimeout(timer);
    throw new BookFetchError(`Book proxy answered ${res.status}.`, 'proxy');
  }
  const type = res.headers.get('content-type') ?? '';
  let raw: string;
  try {
    raw = await res.text();
  } catch {
    throw new BookFetchError('The download was interrupted.', 'network');
  } finally {
    clearTimeout(timer);
  }
  // An SPA fallback (index.html) means the proxy isn't deployed.
  if (/text\/html/i.test(type) || /^\s*<(!doctype|html)/i.test(raw)) {
    throw new BookFetchError('The book proxy is not available here.', 'proxy');
  }
  const clean = stripGutenberg(raw);
  if (clean.length < 200) throw new BookFetchError('The downloaded text looks empty.', 'missing');
  return clean;
}

/** Cleaned full text for a Gutenberg id, cached in memory and (when small enough) sessionStorage. */
export async function loadBookText(id: number): Promise<string> {
  const mem = textCache.get(id);
  if (mem) return mem;
  const ses = readSession(id);
  if (ses) {
    textCache.set(id, ses);
    return ses;
  }
  let p = inflight.get(id);
  if (!p) {
    p = download(id).then(
      (t) => {
        textCache.set(id, t);
        writeSession(id, t);
        inflight.delete(id);
        return t;
      },
      (e) => {
        inflight.delete(id);
        throw e;
      },
    );
    inflight.set(id, p);
  }
  return p;
}

export async function loadBookPages(id: number): Promise<string[][]> {
  const cached = pageCache.get(id);
  if (cached) return cached;
  const text = await loadBookText(id);
  const pages = paginate(toParagraphs(text));
  pageCache.set(id, pages);
  return pages;
}
