import { useState } from 'react';
import { Window, Tickets } from '../Window';
import { SNACKS, FORTUNES, type Snack } from '../../data/catalog';
import { useApp } from '../../state/store';
import { toast } from '../../state/ui';
import { game } from '../../engine/gameRef';
import { audio } from '../../audio/engine';

export default function VendingPanel() {
  const tickets = useApp((s) => s.tickets);
  const [code, setCode] = useState('');
  const [dropping, setDropping] = useState<Snack | null>(null);
  const [got, setGot] = useState<{ snack: Snack; fortune?: string } | null>(null);
  const selected = SNACKS.find((s) => s.code === code);

  const press = (k: string) => {
    audio.sfx('type');
    setGot(null);
    if (k === 'C') return setCode('');
    setCode((c) => (c.length >= 2 ? k : c + k));
  };

  const buy = () => {
    if (!selected || dropping) { audio.sfx('error'); return; }
    if (!useApp.getState().spend(selected.price)) { audio.sfx('error'); return; }
    audio.sfx('vend');
    setDropping(selected);
    setTimeout(() => {
      const fortune = selected.id === 'fortune' ? FORTUNES[Math.floor(Math.random() * FORTUNES.length)] : undefined;
      setGot({ snack: selected, fortune });
      setDropping(null);
      setCode('');
      const app = useApp.getState();
      app.set({ counters: { ...app.counters, snacks: app.counters.snacks + 1 } });
      if (['melonsoda', 'ramune'].includes(selected.id)) app.holdItem(`cup:${selected.color}:${selected.color}`, selected.name, 10);
      game()?.say('me', fortune ? `🥠 “${fortune}”` : `Mmm, ${selected.name}!`, 4000);
      toast(`Got ${selected.name}!`, 'success');
    }, 1300);
  };

  return (
    <Window title="Vending Machine" icon="snack" width="md" subtitle="Snacks for the long haul. Enter a code on the keypad.">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* machine */}
        <div className="flex-1 bg-[#b5463b] border-[3px] border-[var(--color-ink)] p-2" style={{ boxShadow: 'inset 0 -5px 0 #8a2f2f' }}>
          <div className="bg-[#ffe9a0] border-2 border-[var(--color-ink)] text-center text-[12px] font-bold tracking-widest mb-2">· SNACK TIME ·</div>
          <div className="bg-[#1d2440] border-2 border-[var(--color-ink)] p-1.5 grid grid-cols-3 gap-1.5 relative overflow-hidden" style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)' }}>
            {SNACKS.map((s) => (
              <button
                key={s.id}
                className={`flex flex-col items-center gap-1 p-1 border border-[#3a4a6e] ${code === s.code ? 'bg-[rgba(255,255,255,0.15)]' : ''}`}
                onClick={() => { audio.sfx('click'); setCode(s.code); setGot(null); }}
                title={s.desc}
              >
                <span className={`block w-8 h-10 border-2 border-[var(--color-ink)] ${dropping?.id === s.id ? 'translate-y-[60px] transition-transform duration-[1200ms] ease-in' : ''}`} style={{ background: s.color, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.2), inset 3px 0 0 rgba(255,255,255,0.3)' }} />
                <span className="text-[10px] text-[#ffe9a0] font-bold">{s.code} · {s.price}🎟</span>
              </button>
            ))}
          </div>
          <div className="mt-2 h-8 bg-[#2a2a30] border-2 border-[var(--color-ink)] flex items-center justify-center text-[12px] text-[#8fe3c4]">
            {got ? `▼ ${got.snack.name} ▼` : dropping ? '…clunk…' : 'PUSH'}
          </div>
        </div>
        {/* keypad */}
        <div className="w-full sm:w-[170px] flex flex-col gap-2">
          <div className="bg-[#1d2a24] border-2 border-[var(--color-ink)] text-[#8fe3c4] text-[26px] text-center py-1" style={{ fontFamily: 'var(--font-term)' }}>
            {code || '--'}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {['A', 'B', 'C', '1', '2', '3'].map((k) => <button key={k} className="px-btn px-btn-sm" onClick={() => press(k)}>{k}</button>)}
            <button className="px-btn px-btn-sm col-span-3" onClick={() => press('C')}>Clear</button>
          </div>
          <div className="px-inset p-2 text-[12px] min-h-[86px]">
            {got ? (
              <>
                <div className="font-semibold">{got.snack.name}</div>
                <p className="leading-snug">{got.fortune ? <>Your fortune: <i>“{got.fortune}”</i></> : got.snack.desc}</p>
              </>
            ) : selected ? (
              <>
                <div className="font-semibold">{selected.name}</div>
                <p className="leading-snug">{selected.desc}</p>
              </>
            ) : (
              <p className="text-[var(--color-cocoa)]">Pick a snack or type its code.</p>
            )}
          </div>
          <button className="px-btn px-btn-primary" disabled={!selected || !!dropping || tickets < (selected?.price ?? 0)} onClick={buy}>
            Buy {selected && <Tickets n={selected.price} size={14} />}
          </button>
        </div>
      </div>
    </Window>
  );
}
