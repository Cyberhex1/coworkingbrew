import { useApp } from '../../../state/store';
import { useUI } from '../../../state/ui';
import { SHOP_ITEMS, WALLPAPERS, isUnlocked } from '../../../data/catalog';
import { wallpaperURL } from '../wallpaper';
import { PixelIcon } from '../../PixelIcon';
import { audio } from '../../../audio/engine';

const ACCENTS = ['#d9734e', '#3f7d4a', '#5b85b8', '#6e4a7a', '#d97a86', '#2a1a1f', '#c08a2e', '#2f6b6b'];

export default function CustomizeApp() {
  const unlocked = useApp((s) => s.unlocked);
  const decor = useApp((s) => s.deskDecor);
  const wallpaper = useApp((s) => s.wallpaper);
  const accent = useApp((s) => s.osAccent);
  const tickets = useApp((s) => s.tickets);
  const app = useApp.getState();
  const decorItems = SHOP_ITEMS.filter((i) => i.category === 'decor');

  return (
    <div className="p-3 flex flex-col gap-4 text-[13px]">
      <section>
        <h3 className="font-semibold mb-1.5">Wallpaper</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WALLPAPERS.map((w) => {
            const owned = w.price === 0 || unlocked.includes(`wallpaper:${w.id}`);
            return (
              <button
                key={w.id}
                className={`border-2 border-[var(--color-ink)] text-left ${wallpaper === w.id ? 'outline outline-2 outline-offset-2 outline-[var(--color-terra)]' : ''}`}
                onClick={() => {
                  if (!owned) {
                    if (tickets < w.price) { audio.sfx('error'); return; }
                    if (!app.spend(w.price)) return;
                    app.set({ unlocked: [...app.unlocked, `wallpaper:${w.id}`] });
                    audio.sfx('coin');
                  } else audio.sfx('click');
                  app.set({ wallpaper: w.id });
                }}
              >
                <img src={wallpaperURL(w.id)} alt="" className="pixelated w-full aspect-video object-cover" />
                <div className="px-1.5 py-1 flex items-center justify-between bg-[var(--color-paper)] text-[11px]">
                  <span className="truncate">{w.name}</span>
                  {!owned && <span className="flex items-center gap-0.5"><PixelIcon name="ticket" size={11} />{w.price}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h3 className="font-semibold mb-1.5">Window accent</h3>
        <div className="flex gap-1.5">
          {ACCENTS.map((c) => (
            <button key={c} className="w-7 h-7 border-2 border-[var(--color-ink)]" style={{ background: c, boxShadow: accent === c ? '0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-ink)' : undefined }} onClick={() => { audio.sfx('click'); app.set({ osAccent: c }); }} aria-label="Accent color" />
          ))}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold">Desk decor <span className="font-normal text-[var(--color-cocoa)]">(shows on your desk in the café)</span></h3>
          <button className="px-btn px-btn-sm" onClick={() => useUI.getState().openPanel('shop', 'decor')}><PixelIcon name="bag" size={14} />Shop</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {decorItems.map((d) => {
            const owned = isUnlocked(unlocked, d.id);
            const on = decor.includes(d.value);
            return (
              <label key={d.id} className={`px-inset p-1.5 flex items-center gap-2 ${owned ? 'cursor-pointer' : 'opacity-55'}`}>
                <input type="checkbox" className="px-check" disabled={!owned} checked={on} onChange={() => { audio.sfx('pop'); app.equip(d); }} />
                <span className="flex-1">{d.name}</span>
                {!owned && <span className="flex items-center gap-0.5 text-[11px]"><PixelIcon name="ticket" size={11} />{d.price}</span>}
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
