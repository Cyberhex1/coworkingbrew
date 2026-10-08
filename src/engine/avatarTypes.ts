export type HairStyle = 'short' | 'long' | 'bob' | 'bun' | 'ponytail' | 'afro' | 'spiky' | 'braids' | 'buzz' | 'curly';
export type EyeStyle = 'dot' | 'happy' | 'sleepy' | 'sparkle' | 'wink';
export type TopStyle = 'tee' | 'hoodie' | 'sweater' | 'overalls' | 'cardigan' | 'apron' | 'kimono';
export type HatStyle =
  | 'none' | 'beanie' | 'cap' | 'catears' | 'frog' | 'wizard' | 'crown' | 'headphones' | 'bow' | 'flower' | 'beret';
export type GlassesStyle = 'none' | 'round' | 'square' | 'sun' | 'visor';
export type ExtraStyle = 'none' | 'scarf' | 'backpack' | 'foxtail' | 'cattail' | 'wings';

export interface AvatarConfig {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  eyes: EyeStyle;
  top: TopStyle;
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  hat: HatStyle;
  hatColor: string;
  glasses: GlassesStyle;
  extra: ExtraStyle;
  extraColor: string;
}

export type PetKind = 'none' | 'cat' | 'shiba' | 'bunny' | 'duck' | 'capybara' | 'ghost' | 'dragon' | 'frog';

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: '#e0a878',
  hair: 'bob',
  hairColor: '#4a2e22',
  eyes: 'dot',
  top: 'hoodie',
  topColor: '#5b85b8',
  bottomColor: '#2e3a5e',
  shoeColor: '#fbf1dc',
  hat: 'none',
  hatColor: '#d9734e',
  glasses: 'none',
  extra: 'none',
  extraColor: '#d9734e',
};

export type Facing = number; // radians, rotation.y

export type AnimState = 'idle' | 'walk' | 'sit' | 'type' | 'read' | 'sip' | 'wave' | 'sleep' | 'sitIdle';
