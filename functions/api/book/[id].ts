// Cloudflare Pages Function: GET /api/book/:id
// Proxies the plain-text edition of a Project Gutenberg book so the in-café
// reader can fetch it (gutenberg.org does not send CORS headers).

interface Ctx {
  params: { id?: string | string[] };
}

const HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=86400',
  'Access-Control-Allow-Origin': '*',
};

function sources(id: string) {
  return [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
  ];
}

function looksLikeText(body: string, contentType: string | null) {
  if (contentType && /text\/html/i.test(contentType)) return false;
  return body.length > 200 && !/^\s*</.test(body);
}

export async function onRequestGet(context: Ctx): Promise<Response> {
  const raw = context.params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || !/^\d{1,7}$/.test(id)) {
    return new Response('Invalid book id', { status: 400, headers: { ...HEADERS, 'Cache-Control': 'no-store' } });
  }

  for (const url of sources(id)) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CoworkingBrew-Library/1.0 (+https://coworkingbrew)', Accept: 'text/plain' },
        redirect: 'follow',
      });
      if (!res.ok) continue;
      const body = await res.text();
      if (!looksLikeText(body, res.headers.get('content-type'))) continue;
      return new Response(body, { status: 200, headers: HEADERS });
    } catch {
      // try the next mirror path
    }
  }

  return new Response('Book not found', { status: 404, headers: { ...HEADERS, 'Cache-Control': 'public, max-age=300' } });
}
