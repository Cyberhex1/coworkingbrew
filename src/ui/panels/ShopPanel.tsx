import { useState } from 'react';
import { Window, Tickets } from '../Window';
import { AvatarPreview } from '../AvatarPreview';
import { useApp } from '../../state/store';
import { useUI } from '../../state/ui';
import { SHOP_ITEMS, WALLPAPERS, isUnlocked, ECONOMY, type ShopItem } from '../../data/catalog';
import { wallpaperURL } from '../os/wallpaper';
import { audio } from '../../audio/engine';
import { PixelIcon } from '../PixelIcon';
import type { AvatarConfig, PetKind } from '../../engine/avatarTypes';

type Tab = 'outfits' | 'pets' | 'decor' | 'wallpapers';

export default function ShopPanel() {
  const arg = useUI((s) => s.panelArg) as string | null;
  const [tab, setTab] = useState<Tab>(arg === 'decor' ? 'decor' : 'outfits');
  const tickets = useApp((s) => s.tickets);
  const unlocked = useApp((s) => s.unlocked);
  const avatar = useApp((s) => s.avatar);
  const pet = useApp((s) => s.pet);
  const deskDecor = useApp((s) => s.deskDecor);
  const wallpaper = useApp((s) => s.wallpaper);
  const [hover, setHover] = useState<ShopItem | null>(null);

  const items = SHOP_ITEMS.filter((i) =>
    tab === 'outfits' ? ['hat', 'glasses', 'extra', 'top'].includes(i.category) && i.price > 0 : tab === 'pets' ? i.category === 'pet' : tab === 'decor' ? i.category === 'decor' : false,
  );

  const tryOn: AvatarConfig = hover && ['hat', 'glasses', 'extra', 'top'].includes(hover.category) ? { ...avatar, [hover.category]: hover.value } : avatar;
  const tryPet: PetKind = hover?.category === 'pet' ? (hover.value as PetKind) : pet;

  const buyEquip = (i: ShopItem) => {
    const owned = isUnlocked(unlocked, i.id);
    if (!owned) {
      if (!useApp.getState().buy(i.id)) { audio.sfx('error'); return; }
      audio.sfx('coin');
    } else audio.sfx('click');
    useApp.getState().equip(i);
  };

  const equipped = (i: ShopItem) =>
    i.category === 'pet' ? pet === i.value : i.category === 'decor' ? deskDecor.includes(i.value) : (avatar as unknown as Record<string, string>)[i.category] === i.value;

  return (
    <Window
      title="Ticket Shop"
      icon="bag"
      width="xl"
      subtitle={<>You have <b>{tickets}</b> tickets · earn ~{(25 / 5) * ECONOMY.focusTicketsPer5Min} per 25-min focus session</>}
      tabs={[{ id: 'outfits', label: 'Outfits', icon: 'shirt' }, { id: 'pets', label: 'Pets', icon: 'paw' }, { id: 'decor', label: 'Desk decor', icon: 'desk' }, { id: 'wallpapers', label: 'Wallpapers', icon: 'sparkle' }]}
      tab={tab}
      onTab={(t) => { setTab(t as Tab); setHover(null); }}
    >
      <div className="grid sm:grid-cols-[1fr_220px] gap-3">
        {tab === 'wallpapers' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WALLPAPERS.map((w) => {
              const owned = w.price === 0 || unlocked.includes(`wallpaper:${w.id}`);
              return (
                <button key={w.id} className={`border-2 border-[var(--color-ink)] text-left ${wallpaper === w.id ? 'outline outline-2 outline-offset-2 outline-[var(--color-terra)]' : ''}`} onClick={() => {
                  const app = useApp.getState();
                  if (!owned) { if (!app.spend(w.price)) { audio.sfx('error'); return; } app.set({ unlocked: [...app.unlocked, `wallpaper:${w.id}`] }); audio.sfx('coin'); }
                  app.set({ wallpaper: w.id });
                }}>
                  <img src={wallpaperURL(w.id)} alt="" className="pixelated w-full aspect-video object-cover" />
                  <div className="px-1.5 py-1 flex items-center justify-between bg-[var(--color-paper)] text-[12px]">
                    <span className="truncate">{w.name}</span>
                    {owned ? (wallpaper === w.id ? <span className="px-chip bg-[var(--color-mint)]">on</span> : <span className="px-chip">owned</span>) : <Tickets n={w.price} size={12} />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 content-start">
            {items.map((i) => {
              const owned = isUnlocked(unlocked, i.id);
              const on = equipped(i);
              return (
                <li key={i.id} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                  <button className={`w-full text-left px-inset p-2 flex items-center gap-2 hover:bg-[#fff8e8] ${on ? 'border-[var(--color-leaf-2)] bg-[#eaf6e4]' : ''}`} onClick={() => buyEquip(i)}>
                    <PixelIcon name={i.category === 'pet' ? 'paw' : i.category === 'decor' ? 'desk' : i.category === 'glasses' ? 'star' : 'shirt'} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px]">{i.name}</div>
                      {i.desc && <div className="text-[11px] text-[var(--color-cocoa)] truncate">{i.desc}</div>}
                    </div>
                    {on ? <span className="px-chip bg-[var(--color-mint)]">{i.category === 'decor' ? 'on desk' : 'wearing'}</span> : owned ? <span className="px-chip">equip</span> : (
                      <span className={`px-chip flex items-center gap-1 ${tickets < i.price ? 'opacity-60' : 'bg-[var(--color-gold-2)]'}`}><PixelIcon name="ticket" size={12} />{i.price}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <aside className="hidden sm:flex flex-col items-center gap-2 px-inset p-2 self-start">
          <div className="px-tiny text-[var(--color-cocoa)]">Try-on preview</div>
          <AvatarPreview avatar={tryOn} pet={tryPet} size={190} pixel={4} />
          <p className="text-[11px] text-center leading-snug">{hover ? <><b>{hover.name}</b>{hover.desc ? ` — ${hover.desc}` : ''}</> : 'Hover an item to try it on.'}</p>
          {tab === 'decor' && <p className="text-[11px] text-center text-[var(--color-cocoa)]">Decor appears on your desk in the café.</p>}
        </aside>
      </div>
    </Window>
  );
}
