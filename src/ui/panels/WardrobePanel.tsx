import { useState } from 'react';
import { Window } from '../Window';
import { AvatarPreview } from '../AvatarPreview';
import { AvatarEditor } from '../AvatarEditor';
import { useApp } from '../../state/store';
import { useUI, toast } from '../../state/ui';
import { SHOP_BY_ID } from '../../data/catalog';
import { randomAvatar } from '../../engine/npcs';
import { game } from '../../engine/gameRef';
import { audio } from '../../audio/engine';
import { PixelIcon } from '../PixelIcon';

export default function WardrobePanel() {
  const saved = useApp((s) => s.avatar);
  const unlocked = useApp((s) => s.unlocked);
  const tickets = useApp((s) => s.tickets);
  const pet = useApp((s) => s.pet);
  const name = useApp((s) => s.name);
  const [draft, setDraft] = useState(saved);
  const [nm, setNm] = useState(name);
  const [locked, setLocked] = useState<string | null>(null);
  const item = locked ? SHOP_BY_ID[locked] : null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || nm !== name;

  const save = () => {
    audio.sfx('success');
    useApp.getState().set({ avatar: draft, name: nm.trim().slice(0, 24) || name });
    game()?.say('me', ['Looking good ✨', 'New fit, who dis?', 'Fresh look!'][Math.floor(Math.random() * 3)], 3000);
    toast('Look saved', 'success');
    useUI.getState().closePanel();
  };

  return (
    <Window
      title="Wardrobe Mirror"
      icon="shirt"
      width="lg"
      subtitle="Mix and match. Locked pieces can be bought with tickets."
      footer={
        <div className="flex items-center gap-2">
          <button className="px-btn px-btn-sm" onClick={() => setDraft({ ...randomAvatar(Math.floor(Math.random() * 1e6)), hat: draft.hat, glasses: draft.glasses, extra: draft.extra, top: draft.top })}><PixelIcon name="sparkle" size={14} />Randomize</button>
          <button className="px-btn px-btn-sm" onClick={() => setDraft(saved)} disabled={!dirty}>Undo</button>
          <span className="flex-1" />
          <button className="px-btn px-btn-primary" onClick={save} disabled={!dirty}>Save look</button>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col items-center gap-2">
          <AvatarPreview avatar={draft} pet={pet} size={210} pixel={4} />
          <span className="text-[11px] text-[var(--color-cocoa)]">drag to spin</span>
          <label className="w-full text-[12px]">
            <span className="px-tiny text-[var(--color-cocoa)]">Display name</span>
            <input className="px-input text-[14px] py-1" value={nm} maxLength={24} onChange={(e) => setNm(e.target.value)} />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <AvatarEditor value={draft} onChange={setDraft} unlocked={unlocked} onLocked={(id) => { audio.sfx('error'); setLocked(id); }} />
        </div>
      </div>
      {item && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(29,32,51,0.4)] p-4" onClick={() => setLocked(null)}>
          <div className="px-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="px-panel p-4 w-[300px] text-center flex flex-col gap-2">
              <div className="px-title">{item.name}</div>
              <p className="text-[13px]">Unlock this for <b>{item.price}</b> tickets? You have {tickets}.</p>
              <div className="flex gap-2 justify-center">
                <button className="px-btn" onClick={() => setLocked(null)}>Not now</button>
                <button
                  className="px-btn px-btn-primary"
                  disabled={tickets < item.price}
                  onClick={() => {
                    if (useApp.getState().buy(item.id)) {
                      audio.sfx('coin');
                      const k = item.category as 'hat' | 'glasses' | 'extra' | 'top';
                      setDraft((d) => ({ ...d, [k]: item.value }));
                    }
                    setLocked(null);
                  }}
                >
                  Buy · {item.price} 🎟
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Window>
  );
}
