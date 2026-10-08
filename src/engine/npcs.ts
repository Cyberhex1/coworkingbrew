import { rng } from './pixel';
import { SKIN_TONES, HAIR_COLORS, CLOTH_COLORS } from './palette';
import type { AvatarConfig, HairStyle, TopStyle, HatStyle, GlassesStyle, EyeStyle } from './avatarTypes';

const HAIRS: HairStyle[] = ['short', 'long', 'bob', 'bun', 'ponytail', 'afro', 'spiky', 'braids', 'buzz', 'curly'];
const TOPS: TopStyle[] = ['tee', 'hoodie', 'sweater', 'overalls', 'cardigan'];
const HATS: HatStyle[] = ['none', 'none', 'none', 'beanie', 'headphones', 'cap', 'bow', 'flower', 'beret'];
const GLASSES: GlassesStyle[] = ['none', 'none', 'round', 'square'];
const EYES: EyeStyle[] = ['dot', 'dot', 'happy', 'sparkle', 'sleepy'];

export function randomAvatar(seed: number): AvatarConfig {
  const r = rng(seed * 9973 + 17);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  return {
    skin: pick(SKIN_TONES),
    hair: pick(HAIRS),
    hairColor: pick(HAIR_COLORS),
    eyes: pick(EYES),
    top: pick(TOPS),
    topColor: pick(CLOTH_COLORS),
    bottomColor: pick(['#2e3a5e', '#3a3a44', '#5a3424', '#4a5a3a', '#6e4a7a', '#c9b28c']),
    shoeColor: pick(['#fbf1dc', '#2a1a1f', '#b5463b', '#5a5a66']),
    hat: pick(HATS),
    hatColor: pick(CLOTH_COLORS),
    glasses: pick(GLASSES),
    extra: 'none',
    extraColor: pick(CLOTH_COLORS),
  };
}

export const NPC_PROFILES = [
  { name: 'Mika', status: 'Thesis, chapter 3', lines: ['Refill time ☕', 'Brain needs water', 'Okay, one more section!'] },
  { name: 'Jules', status: 'Debugging the API', lines: ['It works?? 🎉', 'Stretch break', 'Rubber duck consult…'] },
  { name: 'Noor', status: 'Designing a zine', lines: ['Ooh, new book!', 'Color palette done ✨', 'Snack o’clock'] },
  { name: 'Theo', status: 'Learning Japanese', lines: ['がんばって!', 'Flashcards break', 'Need a matcha'] },
  { name: 'Ivy', status: 'Writing a novel', lines: ['Plot twist found', 'Words: 1,200 ✍️', 'Walk & think'] },
  { name: 'Sam', status: 'Studying anatomy', lines: ['Quiz tomorrow 😬', 'Coffee, please', 'Back in 5'] },
  { name: 'Rafa', status: 'Editing a podcast', lines: ['Ears need a rest', 'Cut, cut, cut', 'Vending run!'] },
];
