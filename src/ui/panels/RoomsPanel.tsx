import { useState } from 'react';
import { Window } from '../Window';
import { THEMES, SERVERS, type ThemeId, type ServerId } from '../../engine/themes';
import { useApp } from '../../state/store';
import { useUI, toast } from '../../state/ui';
import { useNet } from '../../net/session';
import { audio } from '../../audio/engine';
import { PixelIcon } from '../PixelIcon';

const CATS = [
  { id: 'all', label: 'All' },
  { id: 'office', label: 'Offices' },
  { id: 'cafe', label: 'Cafés' },
  { id: 'nature', label: 'Nature' },
  { id: 'night', label: 'Night' },
];

function Swatch({ id }: { id: ThemeId }) {
  const t = THEMES.find((x) => x.id === id)!;
  // tiny isometric-ish room thumbnail from the theme palette
  return (
    <svg viewBox="0 0 48 30" className="w-full h-auto pixelated" shapeRendering="crispEdges" aria-hidden>
      <rect width="48" height="30" fill={t.bg} />
      <polygon points="4,10 24,2 44,10 24,18" fill={t.floorColors[1]} />
      <polygon points="4,10 24,18 24,26 4,18" fill={t.floorColors[0]} />
      <polygon points="24,18 44,10 44,18 24,26" fill={t.floorColors[0]} opacity="0.8" />
      <polygon points="4,10 24,2 24,-6 4,2" fill={t.wallColors.base} />
      <polygon points="24,2 44,10 44,2 24,-6" fill={t.wallColors.alt} />
      <rect x="28" y="0" width="5" height="4" fill={t.hemi.sky} />
      <rect x="14" y="9" width="6" height="3" fill={t.wood.light} />
      <rect x="25" y="8" width="5" height="3" fill={t.fabric} />
      <rect x="31" y="11" width="4" height="3" fill={t.rug[0]} />
      {t.neon && <rect x="8" y="2" width="8" height="1" fill={t.neon[0]} />}
    </svg>
  );
}

export default function RoomsPanel() {
  const theme = useApp((s) => s.theme);
  const server = useApp((s) => s.server);
  const signedIn = useNet((s) => !!s.user);
  const [cat, setCat] = useState('all');
  const list = THEMES.filter((t) => cat === 'all' || t.category === cat);

  const join = (t: ThemeId, sv: ServerId) => {
    if (t === theme && sv === server) { useUI.getState().closePanel(); return; }
    audio.sfx('whoosh');
    useApp.getState().set({ theme: t, server: sv, deskIndex: null });
    useUI.getState().closePanel();
    const info = THEMES.find((x) => x.id === t)!;
    toast(`Welcome to ${info.title} · ${SERVERS.find((s) => s.id === sv)!.name}`, 'success');
  };

  return (
    <Window
      title="Room Lobby"
      icon="door"
      width="xl"
      subtitle={signedIn ? 'Every room has 8 desks, a coffee bar, vending machine, library, whiteboard, copier and water cooler.' : 'Sign in to see and work alongside real people in each room.'}
      tabs={CATS.map((c) => ({ id: c.id, label: c.label }))}
      tab={cat}
      onTab={setCat}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((t) => {
          const here = t.id === theme;
          return (
            <article key={t.id} className={`px-inset p-2 flex flex-col gap-2 ${here ? 'border-[var(--color-terra)] bg-[#fff2e4]' : ''}`}>
              <div className="border-2 border-[var(--color-ink)]"><Swatch id={t.id} /></div>
              <div>
                <div className="flex items-center gap-1.5">
                  <PixelIcon name={t.timeOfDay === 'night' ? 'moon' : t.timeOfDay === 'rainy' ? 'water' : 'sun'} size={16} />
                  <h3 className="font-semibold text-[14px] leading-tight flex-1">{t.title}</h3>
                  <span className="px-tiny text-[var(--color-cocoa)]">{t.door}</span>
                </div>
                <p className="text-[11px] leading-snug mt-1 text-[var(--color-cocoa)]">{t.description}</p>
                <p className="text-[11px] mt-1">♪ {t.ambiance}</p>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-auto">
                {SERVERS.map((s) => {
                  const cur = here && s.id === server;
                  return (
                    <button key={s.id} className={`px-btn px-btn-sm ${cur ? 'px-btn-green' : ''}`} onClick={() => join(t.id, s.id)} title={`Join ${t.short} on server ${s.name}`}>
                      {cur ? 'Here' : s.name}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </Window>
  );
}
