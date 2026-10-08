import { useState } from 'react';
import { Window, Tickets } from '../Window';
import { AvatarPreview } from '../AvatarPreview';
import { useApp, defaultPetName } from '../../state/store';
import { toast } from '../../state/ui';
import { SHOP_ITEMS, isUnlocked } from '../../data/catalog';
import { game } from '../../engine/gameRef';
import { audio } from '../../audio/engine';
import type { PetKind } from '../../engine/avatarTypes';
import { PixelIcon } from '../PixelIcon';

const LINES: Record<string, string[]> = {
  cat: ['*purrs on your keyboard*', 'Mrrp! 🐾', '*slow blink of approval*'],
  shiba: ['Woof! 🐕', '*happy zoomies*', '*tippy taps*'],
  bunny: ['*nose wiggle*', '*binky!*', '*munches a tiny carrot*'],
  duck: ['Quack! 🦆', 'Have you tried explaining it to me?', '*waddles proudly*'],
  frog: ['Ribbit 🐸', '*sits like a tiny king*', 'Croak of encouragement!'],
  ghost: ['Boo! 👻', '*floats supportively*', 'Deadlines can’t scare you'],
  capybara: ['*unbothered* 🧘', '*chews thoughtfully*', 'Ok I pull up'],
  dragon: ['Rawr! 🔥', '*guards your completed tasks*', '*tiny smoke puff*'],
};

export default function PetPanel() {
  const pet = useApp((s) => s.pet);
  const petName = useApp((s) => s.petName);
  const avatar = useApp((s) => s.avatar);
  const unlocked = useApp((s) => s.unlocked);
  const tickets = useApp((s) => s.tickets);
  const [name, setName] = useState(petName);
  const pets = SHOP_ITEMS.filter((i) => i.category === 'pet');

  const choose = (kind: PetKind, id: string, price: number) => {
    if (!isUnlocked(unlocked, id)) {
      if (tickets < price) { audio.sfx('error'); toast(`Adopting needs ${price} tickets`, 'error'); return; }
      if (!useApp.getState().buy(id)) return;
      audio.sfx('coin');
    } else audio.sfx('pop');
    const nm = defaultPetName(kind);
    useApp.getState().set({ pet: kind, petName: nm });
    setName(nm);
  };

  return (
    <Window title="Pet Corner" icon="paw" width="lg" subtitle="Your companion follows you around the café and naps by your desk.">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col items-center gap-2">
          <AvatarPreview avatar={avatar} pet={pet} size={200} pixel={4} />
          {pet !== 'none' && (
            <>
              <label className="w-full text-[12px]">
                <span className="px-tiny text-[var(--color-cocoa)]">Name</span>
                <div className="flex gap-1">
                  <input className="px-input text-[14px] py-1" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
                  <button className="px-btn px-btn-sm" onClick={() => { useApp.getState().set({ petName: name.trim() || petName }); audio.sfx('click'); toast('Name saved', 'success'); }}>Save</button>
                </div>
              </label>
              <div className="flex gap-1.5">
                <button className="px-btn px-btn-sm" onClick={() => { audio.sfx('pop'); const l = LINES[pet] ?? ['💛']; game()?.say('me', `${petName}: ${l[Math.floor(Math.random() * l.length)]}`, 3500); }}>
                  <PixelIcon name="heart" size={14} />Pet {petName}
                </button>
                <button className="px-btn px-btn-sm" onClick={() => { audio.sfx('click'); useApp.getState().set({ pet: 'none' }); }}>Send home</button>
              </div>
            </>
          )}
        </div>
        <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 content-start">
          {pets.map((p) => {
            const owned = isUnlocked(unlocked, p.id);
            const active = pet === p.value;
            return (
              <li key={p.id}>
                <button className={`w-full text-left px-inset p-2 hover:bg-[#fff8e8] ${active ? 'border-[var(--color-terra)] bg-[#fff2e4]' : ''}`} onClick={() => choose(p.value as PetKind, p.id, p.price)}>
                  <div className="flex items-center gap-2">
                    <PixelIcon name="paw" size={18} />
                    <span className="font-semibold text-[14px] flex-1">{p.name}</span>
                    {active ? <span className="px-chip bg-[var(--color-mint)]">with you</span> : owned ? <span className="px-chip">owned</span> : <Tickets n={p.price} size={14} />}
                  </div>
                  <p className="text-[11px] text-[var(--color-cocoa)] mt-0.5">{p.desc}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Window>
  );
}
