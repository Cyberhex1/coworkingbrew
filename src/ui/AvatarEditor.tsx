import { useState } from 'react';
import type { AvatarConfig, HairStyle, EyeStyle, TopStyle, HatStyle, GlassesStyle, ExtraStyle } from '../engine/avatarTypes';
import { SKIN_TONES, HAIR_COLORS, CLOTH_COLORS } from '../engine/palette';
import { SHOP_BY_ID, isUnlocked } from '../data/catalog';
import { PixelIcon } from './PixelIcon';
import { audio } from '../audio/engine';

const HAIRS: [HairStyle, string][] = [
  ['short', 'Short'], ['bob', 'Bob'], ['long', 'Long'], ['bun', 'Bun'], ['ponytail', 'Ponytail'],
  ['afro', 'Afro'], ['curly', 'Curly'], ['braids', 'Braids'], ['spiky', 'Spiky'], ['buzz', 'Buzz'],
];
const EYES: [EyeStyle, string][] = [['dot', 'Bright'], ['happy', 'Happy'], ['sparkle', 'Sparkle'], ['sleepy', 'Sleepy'], ['wink', 'Wink']];
const TOPS: TopStyle[] = ['tee', 'hoodie', 'sweater', 'overalls', 'cardigan', 'apron', 'kimono'];
const HATS: HatStyle[] = ['none', 'beanie', 'cap', 'headphones', 'bow', 'flower', 'catears', 'beret', 'frog', 'wizard', 'crown'];
const GLASSES: GlassesStyle[] = ['none', 'round', 'square', 'sun', 'visor'];
const EXTRAS: ExtraStyle[] = ['none', 'scarf', 'backpack', 'cattail', 'foxtail', 'wings'];
const BOTTOMS = ['#2e3a5e', '#3a3a44', '#5a3424', '#4a5a3a', '#6e4a7a', '#c9b28c', '#8a2f2f', '#fbf1dc'];
const SHOES = ['#fbf1dc', '#2a1a1f', '#b5463b', '#5a5a66', '#e2b04a', '#5b85b8'];

type Section = 'face' | 'hair' | 'outfit' | 'accessories';

export function AvatarEditor({
  value,
  onChange,
  unlocked,
  onLocked,
  compact = false,
}: {
  value: AvatarConfig;
  onChange: (a: AvatarConfig) => void;
  unlocked: string[];
  onLocked?: (itemId: string) => void;
  compact?: boolean;
}) {
  const [section, setSection] = useState<Section>('hair');
  const set = (p: Partial<AvatarConfig>) => { audio.sfx('click'); onChange({ ...value, ...p }); };
  const choose = (cat: string, v: string, apply: () => void) => {
    const id = `${cat}:${v}`;
    if (!isUnlocked(unlocked, id)) {
      if (onLocked) onLocked(id);
      else audio.sfx('error');
      return;
    }
    apply();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 flex-wrap">
        {(['hair', 'face', 'outfit', 'accessories'] as Section[]).map((s) => (
          <button key={s} className="px-btn px-btn-sm capitalize" data-active={section === s} onClick={() => setSection(s)}>{s}</button>
        ))}
      </div>

      {section === 'face' && (
        <>
          <Row label="Skin">
            {SKIN_TONES.map((c) => <Swatch key={c} color={c} active={value.skin === c} onClick={() => set({ skin: c })} />)}
          </Row>
          <Row label="Eyes">
            {EYES.map(([v, l]) => <Opt key={v} active={value.eyes === v} onClick={() => set({ eyes: v })}>{l}</Opt>)}
          </Row>
          <Row label="Glasses">
            {GLASSES.map((v) => <Opt key={v} active={value.glasses === v} price={price(`glasses:${v}`, unlocked)} onClick={() => choose('glasses', v, () => set({ glasses: v }))}>{SHOP_BY_ID[`glasses:${v}`]?.name ?? v}</Opt>)}
          </Row>
        </>
      )}

      {section === 'hair' && (
        <>
          <Row label="Style">
            {HAIRS.map(([v, l]) => <Opt key={v} active={value.hair === v} onClick={() => set({ hair: v })}>{l}</Opt>)}
          </Row>
          <Row label="Color">
            {HAIR_COLORS.map((c) => <Swatch key={c} color={c} active={value.hairColor === c} onClick={() => set({ hairColor: c })} />)}
          </Row>
        </>
      )}

      {section === 'outfit' && (
        <>
          <Row label="Top">
            {TOPS.map((v) => <Opt key={v} active={value.top === v} price={price(`top:${v}`, unlocked)} onClick={() => choose('top', v, () => set({ top: v }))}>{SHOP_BY_ID[`top:${v}`]?.name ?? v}</Opt>)}
          </Row>
          <Row label="Top color">
            {CLOTH_COLORS.map((c) => <Swatch key={c} color={c} active={value.topColor === c} onClick={() => set({ topColor: c })} />)}
          </Row>
          <Row label="Bottoms">
            {BOTTOMS.map((c) => <Swatch key={c} color={c} active={value.bottomColor === c} onClick={() => set({ bottomColor: c })} />)}
          </Row>
          {!compact && (
            <Row label="Shoes">
              {SHOES.map((c) => <Swatch key={c} color={c} active={value.shoeColor === c} onClick={() => set({ shoeColor: c })} />)}
            </Row>
          )}
        </>
      )}

      {section === 'accessories' && (
        <>
          <Row label="Hat">
            {HATS.map((v) => <Opt key={v} active={value.hat === v} price={price(`hat:${v}`, unlocked)} onClick={() => choose('hat', v, () => set({ hat: v }))}>{SHOP_BY_ID[`hat:${v}`]?.name ?? v}</Opt>)}
          </Row>
          <Row label="Hat / accent color">
            {CLOTH_COLORS.map((c) => <Swatch key={c} color={c} active={value.hatColor === c} onClick={() => set({ hatColor: c })} />)}
          </Row>
          <Row label="Extra">
            {EXTRAS.map((v) => <Opt key={v} active={value.extra === v} price={price(`extra:${v}`, unlocked)} onClick={() => choose('extra', v, () => set({ extra: v }))}>{SHOP_BY_ID[`extra:${v}`]?.name ?? v}</Opt>)}
          </Row>
          <Row label="Extra color">
            {CLOTH_COLORS.map((c) => <Swatch key={c} color={c} active={value.extraColor === c} onClick={() => set({ extraColor: c })} />)}
          </Row>
        </>
      )}
    </div>
  );
}

function price(id: string, unlocked: string[]) {
  return isUnlocked(unlocked, id) ? 0 : SHOP_BY_ID[id]?.price ?? 0;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-tiny mb-1.5 text-[var(--color-cocoa)]">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className="w-7 h-7 border-2 border-[var(--color-ink)]"
      style={{ background: color, boxShadow: active ? '0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-terra)' : 'inset 0 -3px 0 rgba(0,0,0,0.18)' }}
      onClick={onClick}
      aria-label={`Color ${color}`}
      aria-pressed={active}
    />
  );
}

function Opt({ active, onClick, children, price = 0 }: { active: boolean; onClick: () => void; children: React.ReactNode; price?: number }) {
  return (
    <button className={`px-btn px-btn-sm ${price ? 'opacity-80' : ''}`} data-active={active} onClick={onClick} aria-pressed={active}>
      {children}
      {price > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] bg-[var(--color-gold-2)] px-1 -mr-1 border border-[var(--color-ink)]">
          <PixelIcon name="ticket" size={10} />{price}
        </span>
      )}
    </button>
  );
}
