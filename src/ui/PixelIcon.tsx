import { memo } from 'react';

// Hand-authored 12x12 pixel icons. Each character maps to a palette colour;
// '.' is transparent. Rendered as crisp SVG rects (horizontal runs merged).

const PAL: Record<string, string> = {
  k: '#2a1a1f', w: '#ffffff', c: '#fbf1dc', p: '#e6cf9f', b: '#8a5234', B: '#5e3626', r: '#d9573f', o: '#d9734e',
  y: '#e2b04a', Y: '#f7d97a', g: '#62a356', G: '#3f7d4a', m: '#8fe3c4', s: '#5b85b8', S: '#8cb4dc', l: '#a98ac4',
  n: '#f0a8a8', x: '#8a8a94', X: '#c9ccd2', v: '#2e3a5e', t: '#4a9a8f',
};

const ICONS: Record<string, string[]> = {
  coffee: [
    '...y..y.....', '..y..y......', '...y..y.....', '.kkkkkkkk...', '.kccccccckk.', '.kcBBBBBck.k',
    '.kccccccck.k', '.kccccccckk.', '.kccccccck..', '..kccccck...', 'kkkkkkkkkkk.', '.kkkkkkkkk..',
  ],
  tomato: [
    '.....gg.....', '...gGgGg....', '..kkkgkkk...', '.krrrrrrrk..', 'krrwrrrrrrk.', 'krwrrrrrrrk.',
    'krrrrrrrrrk.', 'krrrrrrrrrk.', 'krrrrrrrrrk.', '.krrrrrrrk..', '..kkkkkkk...', '............',
  ],
  check: [
    '.kkkkkkkkkk.', '.kcccccccck.', '.kcgkcccckk.', '.kcGgccccck.', '.kccccccckk.', '.kcgkcppppk.',
    '.kcGgccccck.', '.kccccccckk.', '.kcxkcppppk.', '.kcxxccccck.', '.kcccccccck.', '.kkkkkkkkkk.',
  ],
  calendar: [
    '..k....k....', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.kcpcpcpcck.',
    '.kcccccccck.', '.kcpcpcypck.', '.kcccccyyck.', '.kcpcpcpcck.', '.kcccccccck.', '.kkkkkkkkkk.',
  ],
  book: [
    '............', '.kkkkk.kkkk.', 'kssssskcccck', 'ksSSsskcppck', 'ksssssskccck', 'ksSSssskppck',
    'ksssssskccck', 'ksSSssskppck', 'ksssssskccck', 'kkkkkkkkkkkk', '.kyyyyyyyyk.', '..kkkkkkkk..',
  ],
  notes: [
    '.........kk.', '........kyyk', '.kkkkkkkkyk.', '.kccccckyyk.', '.kccccky.kk.', '.kpppkyykk..',
    '.kccckyykck.', '.kpppkkkpck.', '.kcccccccck.', '.kppppppcck.', '.kcccccccck.', '.kkkkkkkkkk.',
  ],
  music: [
    '.....kkkkkk.', '.....kllllk.', '.....kkkklk.', '.....k...kk.', '.....k....k.', '.....k....k.',
    '..kkkk..kkk.', '.kllllk.klk.', 'klllllk.kkk.', 'kllllk......', '.kkkk.......', '............',
  ],
  shirt: [
    '...kk..kk...', '.kkoko.okkk.', 'kooookkooook', 'kooooooooook', 'kkooooooookk', '.kkooooookk.',
    '..koooooook.', '..kooyyoook.', '..koooooook.', '..koooooook.', '..kkkkkkkkk.', '............',
  ],
  bag: [
    '....kkkk....', '...k....k...', '...k....k...', '.kkkkkkkkkk.', '.kyyyyyyyyk.', 'kyyyyyyyyyyk',
    'kyyyyrryyyyk', 'kyyyrrrryyyk', 'kyyyyrryyyyk', 'kyyyyyyyyyyk', 'kYYYYYYYYYYk', '.kkkkkkkkkk.',
  ],
  chart: [
    '..........k.', '.........kgk', '....kk...kgk', '...kook..kgk', '...kook..kgk', 'kk.kook..kgk',
    'ksk.kook.kgk', 'ksk.kook.kgk', 'ksk.kook.kgk', 'ksk.kook.kgk', 'kkkkkkkkkkkk', '............',
  ],
  door: [
    '..kkkkkkkk..', '..kBBBBBBk..', '..kBbbbbBk..', '..kBbbbbBk..', '..kBbbbbBk..', '..kBbbbbBk..',
    '..kBbbbyBk..', '..kBbbbbBk..', '..kBbbbbBk..', '..kBbbbbBk..', '..kBBBBBBk..', 'kkkkkkkkkkkk',
  ],
  gear: [
    '.....kk.....', '..k.kXXk.k..', '.kXkXXXXkXk.', '..kXXkkXXk..', '.kXXk..kXXk.', 'kXXk....kXXk',
    'kXXk....kXXk', '.kXXk..kXXk.', '..kXXkkXXk..', '.kXkXXXXkXk.', '..k.kXXk.k..', '.....kk.....',
  ],
  ticket: [
    '............', '............', 'kkkkkkkkkkkk', 'kyyykyyyyyyk', '.yyykyrryyy.', 'kyyy.yrryyyk',
    'kyyykyyyyyyk', '.yyykyyyyyy.', 'kYYYkYYYYYYk', 'kkkkkkkkkkkk', '............', '............',
  ],
  chat: [
    '............', '.kkkkkkkkkk.', 'kcccccccccck', 'kcckkcckkcck', 'kcccccccccck', 'kcckkkkkkcck',
    'kcccccccccck', '.kkkcckkkkk.', '...kck......', '...kk.......', '............', '............',
  ],
  user: [
    '....kkkk....', '...kBBBBk...', '..kBBBBBBk..', '..kBnnnnBk..', '..knkknkknk.', '..knnnnnnk..',
    '...knnnnk...', '....kkkk....', '..kkssssk...', '.kssssssssk.', '.kssssssssk.', '.kkkkkkkkkk.',
  ],
  paw: [
    '............', '..kk....kk..', '.kbbk..kbbk.', '.kbbk..kbbk.', 'kk.kk..kk.kk', 'kbk......kbk',
    'kbk.kkkk.kbk', '.k.kbbbbk.k.', '...kbbbbbk..', '..kbbbbbbk..', '..kbbkkbbk..', '...kk..kk...',
  ],
  desk: [
    '.kkkkkkkkkk.', '.kXXXXXXXXk.', '.kXmmmmmmXk.', '.kXmkmmmmXk.', '.kXmmmkmmXk.', '.kXmmmmmmXk.',
    '.kXXXXXXXXk.', '.kkkkXXkkkk.', '....kXXk....', 'kkkkkkkkkkkk', 'kbbbbbbbbbbk', 'kk........kk',
  ],
  water: [
    '.....kk.....', '.....kk.....', '....kSSk....', '....kSSk....', '...kSSSSk...', '..kSSwSSSk..',
    '..kSwSSSSk..', '.kSSwSSSSSk.', '.kSSSSSSSSk.', '.kSSSSSSSsk.', '..kSSSSssk..', '...kkkkkk...',
  ],
  joystick: [
    '.....kk.....', '....krrk....', '....krrk....', '.....kk.....', '.....kk.....', '.....kk.....',
    '.kkkkkkkkkk.', 'kvvvvvvvvvvk', 'kvvgvvvvvrvk', 'kvvvvvvvvvvk', 'kkkkkkkkkkkk', '............',
  ],
  printer: [
    '...kkkkkk...', '...kccccck..', '...kcpppck..', '.kkkkkkkkkk.', 'kXXXXXXXXXXk', 'kXXXXXXXgXXk',
    'kXXXXXXXXXXk', 'kxxkkkkkkxxk', '.kkkccccckk.', '...kcpppk...', '...kcccck...', '...kkkkkk...',
  ],
  board: [
    'kkkkkkkkkkkk', 'kcccccccccck', 'kcYYcSScnnck', 'kcYYcSScnnck', 'kcccccccccck', 'kcYYcSScccck',
    'kcYYcSScccck', 'kcccccccccck', 'kkkkkkkkkkkk', '..k......k..', '.k........k.', 'k..........k',
  ],
  snack: [
    '....kkkk....', '...kXXXXk...', '...kggggk...', '..kggggggk..', '..kgwgggGk..', '..kgwgggGk..',
    '..kggggggk..', '..kccccccsk.', '..kggggggk..', '..kggggggk..', '...kXXXXk...', '....kkkk....',
  ],
  soundOn: [
    '............', '....k...k...', '...kk....k..', '..kck..k..k.', 'kkkck...k.k.', 'kccck...k.k.',
    'kccck...k.k.', 'kkkck...k.k.', '..kck..k..k.', '...kk....k..', '....k...k...', '............',
  ],
  soundOff: [
    '............', '....k.......', '...kk.......', '..kck.......', 'kkkck.k...k.', 'kccck..k.k..',
    'kccck...k...', 'kkkck..k.k..', '..kck.k...k.', '...kk.......', '....k.......', '............',
  ],
  play: [
    '............', '...kk.......', '...kgk......', '...kggk.....', '...kgggk....', '...kggggk...',
    '...kggggk...', '...kgggk....', '...kggk.....', '...kgk......', '...kk.......', '............',
  ],
  pause: [
    '............', '..kkk..kkk..', '..kyk..kyk..', '..kyk..kyk..', '..kyk..kyk..', '..kyk..kyk..',
    '..kyk..kyk..', '..kyk..kyk..', '..kyk..kyk..', '..kyk..kyk..', '..kkk..kkk..', '............',
  ],
  skip: [
    '............', '.kk...kk.kk.', '.kck..kckkk.', '.kcck.kcckk.', '.kccckkccckk', '.kcccckccckk',
    '.kcccckccckk', '.kccckkccckk', '.kcck.kcckk.', '.kck..kckkk.', '.kk...kk.kk.', '............',
  ],
  reset: [
    '............', '...kkkkk.k..', '..kcccccckk.', '.kck...kcck.', '.kk...kcccck', '.k.....kkkk.',
    'kk.........k', 'kck.......kk', '.kck.....kck', '..kccccccck.', '...kkkkkkk..', '............',
  ],
  close: [
    '............', '.kk......kk.', '.krk....krk.', '..krk..krk..', '...krkkrk...', '....krrk....',
    '....krrk....', '...krkkrk...', '..krk..krk..', '.krk....krk.', '.kk......kk.', '............',
  ],
  star: [
    '.....kk.....', '.....kyk....', '....kyyk....', 'kkkkkyYkkkkk', 'kyyyyyYyyyyk', '.kyyyyyyyyk.',
    '..kyyyyyyk..', '..kyyyyyyk..', '.kyyykkyyyk.', '.kyyk..kyyk.', 'kyk......kyk', 'kk........kk',
  ],
  heart: [
    '............', '.kkk...kkk..', 'krrrk.krrrk.', 'krwrrkrrrrk.', 'krrrrrrrrrk.', 'krrrrrrrrrk.',
    '.krrrrrrrk..', '..krrrrrk...', '...krrrk....', '....krk.....', '.....k......', '............',
  ],
  rotL: [
    '............', '...k........', '..kk........', '.kckkkkkk...', 'kccccccccck.', '.kckkkkkkck.',
    '..kk.....kck', '...k.....kck', '.........kck', '........kck.', '.....kkkkk..', '............',
  ],
  rotR: [
    '............', '........k...', '........kk..', '...kkkkkkck.', '.kccccccccck', '.kckkkkkkck.',
    'kck.....kk..', 'kck.....k...', 'kck.........', '.kck........', '..kkkkk.....', '............',
  ],
  plus: [
    '............', '....kkkk....', '....kcck....', '....kcck....', '.kkkkcckkkk.', '.kcccccccck.',
    '.kcccccccck.', '.kkkkcckkkk.', '....kcck....', '....kcck....', '....kkkk....', '............',
  ],
  minus: [
    '............', '............', '............', '............', '.kkkkkkkkkk.', '.kcccccccck.',
    '.kcccccccck.', '.kkkkkkkkkk.', '............', '............', '............', '............',
  ],
  sparkle: [
    '.....k......', '.....k......', '....kYk.....', 'kkkkYwYkkkk.', '....kYk.....', '.....k...k..',
    '.....k..kYk.', '........kYk.', '.......kYwYk', '........kYk.', '.........k..', '............',
  ],
  mail: [
    '............', '............', 'kkkkkkkkkkkk', 'kckcccccckck', 'kcckcccckcck', 'kccckcckccck',
    'kcccckkcccck', 'kckcccccckck', 'kkccccccccck', 'kcccccccccck', 'kkkkkkkkkkkk', '............',
  ],
  help: [
    '...kkkkkk...', '..kYYYYYYk..', '.kYYkkkkYYk.', '.kYk....kYk.', '.kkk...kYYk.', '......kYYk..',
    '.....kYYk...', '.....kYYk...', '.....kkkk...', '.....kYYk...', '.....kYYk...', '.....kkkk...',
  ],
  moon: [
    '....kkkk....', '..kkYYYk....', '.kYYYYk.....', '.kYYYk......', 'kYYYYk......', 'kYYYYk......',
    'kYYYYYk.....', 'kYYYYYYk..k.', '.kYYYYYYkk..', '.kkYYYYYYYk.', '..kkYYYYkk..', '....kkkk....',
  ],
  sun: [
    '.....k......', '.k...k...k..', '..k.kkk.k...', '...kYYYk....', '..kYYYYYk...', 'kkkYYYYYkkk.',
    '..kYYYYYk...', '...kYYYk....', '..k.kkk.k...', '.k...k...k..', '.....k......', '............',
  ],
  map: [
    '............', 'kkkk.kkkk.kk', 'kgGkkcpckkgk', 'kGgkcppckkGk', 'kgGkcpccrkgk', 'kGgkcpcrrkGk',
    'kgGkcppckkgk', 'kGgkcpcckkGk', 'kgGkcppckkgk', 'kkkk.kkkk.kk', '............', '............',
  ],
  logout: [
    '.kkkkkk.....', '.kccccck....', '.kc....k....', '.kc..k......', '.kc..kk.....', '.kckkkkk....',
    '.kcccccck...', '.kckkkkk....', '.kc..kk.....', '.kc..k......', '.kc....k....', '.kkkkkkk....',
  ],
  wave: [
    '.....kk.....', '..kk.knk....', '.knk.knk.kk.', '.knkkknkknk.', '.knknknknk..', '.knnnnnnnk..',
    'kknnnnnnnk..', 'knknnnnnnk..', 'knnnnnnnk...', '.knnnnnnk...', '..knnnnk....', '...kkkk.....',
  ],
};

export type IconName = keyof typeof ICONS;

function runs(rows: string[]) {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || !PAL[ch]) { x++; continue; }
      let w = 1;
      while (row[x + w] === ch) w++;
      out.push({ x, y, w, c: PAL[ch] });
      x += w;
    }
  });
  return out;
}

const cache = new Map<string, ReturnType<typeof runs>>();

export const PixelIcon = memo(function PixelIcon({ name, size = 24, className, title }: { name: IconName | string; size?: number; className?: string; title?: string }) {
  const rows = ICONS[name] ?? ICONS.help;
  let r = cache.get(name);
  if (!r) { r = runs(rows); cache.set(name, r); }
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden={!title} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {r.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={1} fill={p.c} />)}
    </svg>
  );
});

export const ICON_NAMES = Object.keys(ICONS);
