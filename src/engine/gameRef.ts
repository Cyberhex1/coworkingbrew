import type { Game } from './Game';

// The single live Game instance, so UI panels can poke the world
// (speech bubbles, held items, walking somewhere) without prop drilling.
let current: Game | null = null;

export function setGame(g: Game | null) {
  current = g;
}

export function game(): Game | null {
  return current;
}
