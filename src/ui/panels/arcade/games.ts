import { beanCatcher } from './BeanCatcher';
import { latteMemory } from './LatteMemory';
import { plantStack } from './PlantStack';
import { snakeBrew } from './SnakeBrew';
import type { GameDef, GameId } from './types';

export const GAMES: readonly GameDef[] = [beanCatcher, latteMemory, snakeBrew, plantStack];

export function gameById(id: GameId) {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}
