import { useState } from 'react';
import { Window, Tickets } from '../Window';
import { DRINKS, type Drink } from '../../data/catalog';
import { useApp } from '../../state/store';
import { toast } from '../../state/ui';
import { game } from '../../engine/gameRef';
import { audio } from '../../audio/engine';
import { useNow } from '../HUD';

export function CupArt({ cup, lid, iced, size = 40 }: { cup: string; lid: string; iced?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      {!iced && <><rect x="5" y="1" width="1" height="3" fill="#e6cf9f" /><rect x="8" y="0" width="1" height="3" fill="#e6cf9f" /></>}
      <rect x="3" y="4" width="9" height="1" fill="#2a1a1f" />
      <rect x="2" y="5" width="1" height={iced ? 9 : 7} fill="#2a1a1f" />
      <rect x="12" y="5" width="1" height={iced ? 9 : 7} fill="#2a1a1f" />
      <rect x="3" y="5" width="9" height={iced ? 9 : 7} fill={cup} />
      <rect x="3" y="5" width="9" height="2" fill={lid} />
      {iced && <><rect x="4" y="8" width="2" height="2" fill="#ffffff" opacity="0.8" /><rect x="8" y="10" width="2" height="2" fill="#ffffff" opacity="0.8" /><rect x="10" y="0" width="1" height="5" fill="#d9573f" /></>}
      {!iced && <><rect x="13" y="6" width="2" height="1" fill="#2a1a1f" /><rect x="14" y="7" width="1" height="3" fill="#2a1a1f" /><rect x="13" y="10" width="2" height="1" fill="#2a1a1f" /></>}
      <rect x="3" y={iced ? 14 : 12} width="9" height="1" fill="#2a1a1f" />
      {!iced && <rect x="1" y="13" width="13" height="1" fill="#2a1a1f" />}
      <rect x="4" y={iced ? 11 : 9} width="1" height="2" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

export default function CoffeePanel() {
  const tickets = useApp((s) => s.tickets);
  const buff = useApp((s) => s.buff);
  const held = useApp((s) => s.held);
  const [brewing, setBrewing] = useState<Drink | null>(null);
  const [pick, setPick] = useState<Drink>(DRINKS[1]);
  const now = useNow(1000);
  const activeBuff = buff && buff.until > now ? DRINKS.find((d) => d.id === buff.drinkId) : null;

  const order = (d: Drink) => {
    if (brewing) return;
    if (tickets < d.price) { audio.sfx('error'); toast(`You need ${d.price} tickets for that`, 'error'); return; }
    const g = game();
    setBrewing(d);
    audio.sfx('pour');
    g?.say('barista', `One ${d.name}, coming right up!`, 2600);
    g?.walkActor('barista', 1.15, 1.35);
    setTimeout(() => g?.walkActor('barista', 2.6, 1.5), 1500);
    setTimeout(() => {
      if (!useApp.getState().orderDrink(d.id)) { setBrewing(null); return; }
      audio.sfx('success');
      g?.say('barista', ['Order up! ☕', 'Here you go — enjoy!', 'Made with love 💛'][Math.floor(Math.random() * 3)], 3000);
      g?.say('me', `Thanks, Bea! ${d.iced ? '🧊' : '☕'}`, 2500);
      toast(`${d.name} in hand · +${Math.round(d.boost * 100)}% focus tickets for 1h`, 'success');
      setBrewing(null);
    }, 2200);
  };

  return (
    <Window title="Espresso Bar" icon="coffee" width="lg" subtitle="Bea’s specialty drinks — each gives a 1-hour focus-ticket boost">
      <div className="grid sm:grid-cols-[1fr_230px] gap-3">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {DRINKS.map((d) => (
            <li key={d.id}>
              <button
                className={`w-full text-left px-inset p-2 flex gap-2 items-start hover:bg-[#fff8e8] ${pick.id === d.id ? 'border-[var(--color-terra)] bg-[#fff2e4]' : ''}`}
                onClick={() => { audio.sfx('click'); setPick(d); }}
              >
                <CupArt cup={d.cup} lid={d.lid} iced={d.iced} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] leading-tight">{d.name}</div>
                  <div className="text-[11px] text-[var(--color-cocoa)]">{d.notes}</div>
                </div>
                <Tickets n={d.price} size={14} />
              </button>
            </li>
          ))}
        </ul>
        <aside className="px-inset p-3 flex flex-col items-center text-center gap-2">
          <CupArt cup={pick.cup} lid={pick.lid} iced={pick.iced} size={88} />
          <div className="font-semibold text-[16px]">{pick.name}</div>
          <p className="text-[12px] leading-snug">{pick.desc}</p>
          <div className="px-chip bg-[var(--color-gold-2)]">+{Math.round(pick.boost * 100)}% focus tickets · 1h</div>
          <button className="px-btn px-btn-primary w-full mt-1" disabled={!!brewing || tickets < pick.price} onClick={() => order(pick)}>
            {brewing ? <span className="px-blink">Brewing…</span> : <>Order · <Tickets n={pick.price} size={14} /></>}
          </button>
          {tickets < pick.price && <div className="text-[11px] text-[var(--color-tomato)]">Finish a focus session to earn more tickets.</div>}
          {activeBuff && (
            <div className="text-[11px] text-[var(--color-cocoa)]">
              Active: {activeBuff.name} boost · {Math.max(0, Math.ceil((buff!.until - now) / 60_000))} min left
            </div>
          )}
          {held && <div className="text-[11px] text-[var(--color-cocoa)]">Holding: {held.label}</div>}
        </aside>
      </div>
    </Window>
  );
}
