import { inkOn } from './common';

const SIZES = {
  xs: { w: 30, h: 42, font: 0, band: 3, spine: 4 },
  sm: { w: 84, h: 118, font: 10, band: 5, spine: 7 },
  lg: { w: 120, h: 168, font: 13, band: 7, spine: 9 },
} as const;

/** A CSS pixel-art book cover: cloth block, darker spine, accent bands and a title plate. */
export function BookCover({ title, author, cover, size = 'sm' }: { title: string; author?: string; cover: [string, string]; size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  const [cloth, accent] = cover;
  return (
    <div
      aria-hidden
      className="relative shrink-0 select-none overflow-hidden"
      style={{
        width: s.w,
        height: s.h,
        background: cloth,
        border: '2px solid var(--color-ink)',
        boxShadow: `inset ${s.spine}px 0 0 rgba(0,0,0,0.28), inset ${s.spine + 2}px 0 0 rgba(255,255,255,0.12), inset -2px -3px 0 rgba(0,0,0,0.18), 3px 3px 0 rgba(42,26,31,0.35)`,
      }}
    >
      {/* top and bottom accent bands */}
      <span className="absolute" style={{ left: s.spine + 2, right: 0, top: s.band, height: s.band, background: accent }} />
      <span className="absolute" style={{ left: s.spine + 2, right: 0, bottom: s.band, height: s.band, background: accent }} />
      {s.font > 0 && (
        <span
          className="absolute flex flex-col items-center justify-center text-center overflow-hidden"
          style={{
            left: s.spine + 5,
            right: 4,
            top: s.band * 2 + 6,
            bottom: s.band * 2 + 6,
            background: accent,
            color: inkOn(accent),
            border: '2px solid var(--color-ink)',
            padding: '3px 2px',
          }}
        >
          <span
            style={{ font: `600 ${s.font}px/1.05 var(--font-pixel)`, display: '-webkit-box', WebkitLineClamp: size === 'lg' ? 5 : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}
          >
            {title}
          </span>
          {author && size === 'lg' && (
            <span className="mt-1 opacity-80" style={{ font: '400 8px/1.1 var(--font-tiny)', textTransform: 'uppercase' }}>
              {author.split(' ').slice(-1)[0]}
            </span>
          )}
        </span>
      )}
      {s.font === 0 && <span className="absolute" style={{ left: s.spine + 3, right: 3, top: '40%', height: 6, background: accent, border: '1px solid var(--color-ink)' }} />}
    </div>
  );
}
