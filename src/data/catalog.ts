import type { HatStyle, GlassesStyle, ExtraStyle, TopStyle, PetKind } from '../engine/avatarTypes';

// ---------------------------------------------------------------- drinks (espresso bar)
export interface Drink {
  id: string;
  name: string;
  price: number;
  cup: string; // cup body colour
  lid: string; // drink colour on top
  iced?: boolean;
  desc: string;
  notes: string;
  boost: number; // focus ticket multiplier bonus for 60 min (0.1 = +10%)
}

export const DRINKS: Drink[] = [
  { id: 'drip', name: 'House Drip', price: 3, cup: '#fbf1dc', lid: '#4a2a1e', desc: 'Bottomless diner-style brew.', notes: 'Toasty · nutty', boost: 0.1 },
  { id: 'latte', name: 'Oat Latte', price: 5, cup: '#fbf1dc', lid: '#c98b5a', desc: 'Velvety oat milk, double shot, a tiny heart.', notes: 'Creamy · caramel', boost: 0.15 },
  { id: 'mocha', name: 'Midnight Mocha', price: 6, cup: '#5e3626', lid: '#3e2418', desc: 'Dark cocoa, espresso, sea-salt foam.', notes: 'Chocolate · salt', boost: 0.2 },
  { id: 'matcha', name: 'Ceremonial Matcha', price: 6, cup: '#fbf1dc', lid: '#7cb85a', desc: 'Whisked to order. Calm, steady focus.', notes: 'Grassy · sweet', boost: 0.2 },
  { id: 'coldbrew', name: 'Nitro Cold Brew', price: 6, cup: '#d8eef0', lid: '#2a1810', iced: true, desc: 'Steeped 18 hours, poured over a cascade of nitro.', notes: 'Bold · smooth', boost: 0.25 },
  { id: 'earlgrey', name: 'Lavender Earl Grey', price: 4, cup: '#e8e0f4', lid: '#a98ac4', desc: 'Bergamot and lavender with a splash of milk.', notes: 'Floral · citrus', boost: 0.1 },
  { id: 'yuzu', name: 'Iced Yuzu Tonic', price: 5, cup: '#d8eef0', lid: '#f7d97a', iced: true, desc: 'Espresso over yuzu tonic. Bright and fizzy.', notes: 'Citrus · sparkling', boost: 0.15 },
  { id: 'cocoa', name: 'Marshmallow Cocoa', price: 4, cup: '#d9734e', lid: '#fbf1dc', desc: 'For rainy afternoons and cozy reading.', notes: 'Rich · fluffy', boost: 0.05 },
  { id: 'chai', name: 'Spiced Chai', price: 5, cup: '#fbf1dc', lid: '#b07a3a', desc: 'Cardamom, cinnamon, clove, black tea.', notes: 'Warm · spicy', boost: 0.15 },
];

// ---------------------------------------------------------------- snacks (vending machine)
export interface Snack {
  id: string;
  code: string;
  name: string;
  price: number;
  color: string;
  desc: string;
}

export const SNACKS: Snack[] = [
  { id: 'pocky', code: 'A1', name: 'Matcha Pocky', price: 3, color: '#62a356', desc: 'Crunchy sticks for crunchy deadlines.' },
  { id: 'onigiri', code: 'A2', name: 'Salmon Onigiri', price: 4, color: '#fbf1dc', desc: 'Perfect triangle of comfort.' },
  { id: 'melonsoda', code: 'A3', name: 'Melon Soda', price: 3, color: '#9cc96a', desc: 'Neon green fizz. Retro vibes.' },
  { id: 'chips', code: 'B1', name: 'Sea Salt Chips', price: 2, color: '#e2b04a', desc: 'Kettle-cooked. Do not eat near keyboard.' },
  { id: 'mochi', code: 'B2', name: 'Strawberry Mochi', price: 4, color: '#f0a8a8', desc: 'Squishy, sweet, perfect.' },
  { id: 'bar', code: 'B3', name: 'Honey Oat Bar', price: 3, color: '#c98b5a', desc: 'Slow-release energy for the long haul.' },
  { id: 'gum', code: 'C1', name: 'Bubble Gum', price: 1, color: '#f0a8c8', desc: 'Blow a bubble. Feel nine years old.' },
  { id: 'ramune', code: 'C2', name: 'Ramune', price: 3, color: '#8cb4dc', desc: 'Pop the marble. Hear the fizz.' },
  { id: 'fortune', code: 'C3', name: 'Fortune Cookie', price: 2, color: '#e6cf9f', desc: 'Contains a tiny piece of wisdom.' },
];

export const FORTUNES = [
  'Small steps every day add up to big things.',
  'The best time to start was earlier. The next best time is now.',
  'Rest is part of the work.',
  'A finished draft beats a perfect plan.',
  'Your future self is cheering for you.',
  'One page. Then another.',
  'Drink some water. Seriously.',
  'Focus is a muscle — you are training it right now.',
  'Done is a lovely word.',
  'The coffee is warm and so is this room.',
];

// ---------------------------------------------------------------- shop (cosmetics & decor)
export type ShopCategory = 'hat' | 'glasses' | 'extra' | 'top' | 'pet' | 'decor' | 'wallpaper';

export interface ShopItem {
  id: string; // e.g. "hat:wizard"
  category: ShopCategory;
  value: string;
  name: string;
  price: number; // 0 = free starter
  desc?: string;
}

const hat = (value: HatStyle, name: string, price: number): ShopItem => ({ id: `hat:${value}`, category: 'hat', value, name, price });
const glasses = (value: GlassesStyle, name: string, price: number): ShopItem => ({ id: `glasses:${value}`, category: 'glasses', value, name, price });
const extra = (value: ExtraStyle, name: string, price: number): ShopItem => ({ id: `extra:${value}`, category: 'extra', value, name, price });
const top = (value: TopStyle, name: string, price: number): ShopItem => ({ id: `top:${value}`, category: 'top', value, name, price });
const pet = (value: PetKind, name: string, price: number, desc: string): ShopItem => ({ id: `pet:${value}`, category: 'pet', value, name, price, desc });
const decor = (value: string, name: string, price: number, desc: string): ShopItem => ({ id: `decor:${value}`, category: 'decor', value, name, price, desc });

export const SHOP_ITEMS: ShopItem[] = [
  hat('none', 'No hat', 0), hat('beanie', 'Beanie', 0), hat('cap', 'Ball cap', 0), hat('headphones', 'Headphones', 0),
  hat('bow', 'Hair bow', 0), hat('flower', 'Flower clip', 0),
  hat('catears', 'Cat ears', 25), hat('beret', 'Painter beret', 25), hat('frog', 'Frog hat', 30),
  hat('wizard', 'Wizard hat', 45), hat('crown', 'Golden crown', 80),
  glasses('none', 'No glasses', 0), glasses('round', 'Round glasses', 0), glasses('square', 'Square frames', 0),
  glasses('sun', 'Sunglasses', 20), glasses('visor', 'Cyber visor', 35),
  extra('none', 'Nothing', 0), extra('scarf', 'Cozy scarf', 0), extra('backpack', 'Backpack', 20),
  extra('cattail', 'Cat tail', 30), extra('foxtail', 'Fox tail', 30), extra('wings', 'Angel wings', 60),
  top('tee', 'T-shirt', 0), top('hoodie', 'Hoodie', 0), top('sweater', 'Striped sweater', 0), top('overalls', 'Overalls', 0),
  top('cardigan', 'Cardigan', 0), top('apron', 'Barista apron', 20), top('kimono', 'Kimono', 40),
  pet('cat', 'Cat', 0, 'A sleepy tabby who loves warm laptops.'),
  pet('shiba', 'Shiba', 0, 'Very good. Very fluffy. Very loyal.'),
  pet('bunny', 'Bunny', 0, 'Quiet, curious, excellent study buddy.'),
  pet('duck', 'Duck', 40, 'Rubber-duck debugging, literally.'),
  pet('frog', 'Frog', 40, 'Ribbits encouragingly at your progress.'),
  pet('ghost', 'Ghost', 50, 'A friendly spirit of finished deadlines.'),
  pet('capybara', 'Capybara', 60, 'Unbothered. Moisturized. Focused.'),
  pet('dragon', 'Dragon', 100, 'Hoards completed tasks instead of gold.'),
  decor('mug', 'Coffee mug', 0, 'Your trusty desk mug.'),
  decor('books', 'Book stack', 10, 'A tidy stack of to-reads.'),
  decor('succulent', 'Succulent', 15, 'Hard to kill. Like your motivation.'),
  decor('lamp', 'Desk lamp', 20, 'Warm amber glow for night owls.'),
  decor('catfig', 'Cat figurine', 25, 'A tiny black cat watches you work.'),
  decor('bonsai', 'Bonsai', 25, 'Patience, in plant form.'),
  decor('lava', 'Lava lamp', 35, 'Groovy pink blobs.'),
  decor('gameboy', 'Handheld console', 40, 'For break time only. Promise.'),
  decor('crystal', 'Focus crystals', 45, 'Purely decorative. Probably.'),
  decor('neon', 'Neon sign', 50, 'A pink neon strip for your cubicle.'),
];

export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));

export const STARTER_UNLOCKS = SHOP_ITEMS.filter((i) => i.price === 0).map((i) => i.id);

export function isUnlocked(unlocked: string[], id: string) {
  const it = SHOP_BY_ID[id];
  return !it || it.price === 0 || unlocked.includes(id);
}

// ---------------------------------------------------------------- BrewOS wallpapers (procedural pixel art)
export interface Wallpaper {
  id: string;
  name: string;
  price: number;
  stops: string[]; // sky gradient
  scene: 'hills' | 'city' | 'sea' | 'forest' | 'stars' | 'sakura' | 'desert' | 'grid';
  ground: string[];
}

export const WALLPAPERS: Wallpaper[] = [
  { id: 'meadow', name: 'Morning Meadow', price: 0, stops: ['#8cc8f0', '#bfe4f4', '#f4f0d8'], scene: 'hills', ground: ['#62a356', '#3f7d4a'] },
  { id: 'dusk', name: 'City Dusk', price: 0, stops: ['#3a2a5e', '#c8507a', '#ffb070'], scene: 'city', ground: ['#3a2440', '#24182c'] },
  { id: 'lagoon', name: 'Calm Lagoon', price: 10, stops: ['#5ab0e0', '#a8dcf0', '#e8f8f8'], scene: 'sea', ground: ['#2f8ab0', '#1d6a90'] },
  { id: 'pines', name: 'Pine Forest', price: 10, stops: ['#ffcf9a', '#ffe8c4', '#f4f0e0'], scene: 'forest', ground: ['#2f5a2a', '#1f3d1d'] },
  { id: 'sakura', name: 'Sakura Hill', price: 15, stops: ['#f8d8e4', '#fde8ee', '#fff6f0'], scene: 'sakura', ground: ['#9cc96a', '#62a356'] },
  { id: 'starry', name: 'Starry Night', price: 20, stops: ['#0c1030', '#1d2a5e', '#3a4a8e'], scene: 'stars', ground: ['#1a2440', '#0c1424'] },
  { id: 'dunes', name: 'Desert Dunes', price: 20, stops: ['#f4b870', '#f8d8a0', '#fcecd0'], scene: 'desert', ground: ['#d9a060', '#b07a3a'] },
  { id: 'synth', name: 'Synthwave', price: 30, stops: ['#140f30', '#4a1e6e', '#ff3fb4'], scene: 'grid', ground: ['#140f20', '#00e5ff'] },
];

// ---------------------------------------------------------------- economy rules (kept in one place)
export const ECONOMY = {
  startingTickets: 30,
  focusTicketsPer5Min: 2, // 25 min focus => 10 tickets
  taskComplete: 2,
  taskDailyCap: 20,
  journalDaily: 5,
  glassOfWater: 1,
  glassesPerDay: 8,
  bookFinished: 15,
  gameDailyCap: 30,
};
