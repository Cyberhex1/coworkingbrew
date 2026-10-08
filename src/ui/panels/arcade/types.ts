import type { Ctx } from './pixel';

export type GameId = 'beans' | 'memory' | 'snake' | 'stack';

export type SfxName = 'click' | 'coin' | 'pop' | 'error' | 'success' | 'whoosh';

export type SwipeDir = 'up' | 'down' | 'left' | 'right';

/** What a running game can ask of the arcade shell. */
export interface GameApi {
  /** Finish the run. `details` are extra lines for the game-over screen. */
  end: (score: number, details?: string[]) => void;
  sfx: (name: SfxName) => void;
  /** Current best for this game (for in-canvas HUDs). */
  best: number;
}

/** A live game instance. All coordinates are in low-res canvas pixels. */
export interface GameInstance {
  update(dt: number): void;
  draw(ctx: Ctx, t: number): void;
  /** Return true when the key was consumed. */
  keyDown?(key: string): boolean;
  keyUp?(key: string): void;
  pointerDown?(x: number, y: number): void;
  pointerMove?(x: number, y: number, down: boolean): void;
  pointerUp?(x: number, y: number): void;
  /** A quick drag gesture (fired on release instead of `tap`). */
  swipe?(dir: SwipeDir): void;
  /** Release without significant movement. */
  tap?(x: number, y: number): void;
}

export interface GameDef {
  id: GameId;
  name: string;
  tagline: string;
  /** Short how-to lines for the title screen. */
  howTo: string[];
  /** [keys, action] pairs shown as keycaps. */
  controls: [string[], string][];
  scoreLabel: string;
  /** Base (on-break) tickets for a score, roughly 0..5. */
  reward: (score: number) => number;
  create: (api: GameApi) => GameInstance;
  /** Draw a 64x48 thumbnail for the game-select screen. */
  thumb: (ctx: Ctx) => void;
  accent: string;
}

export const ARCADE_W = 192;
export const ARCADE_H = 144;
