# CoworkingBrew ☕

A cozy **3D pixel-art coworking café**. You walk your voxel avatar into a warm little café, sit at a cubicle desk, and get real work done next to other people (and a few friendly regulars).

Every feature lives somewhere physical in the room:

| Spot | What it does |
| --- | --- |
| **8 cubicle desks** | Sit at any free desk to claim it. Your desk opens **BrewOS**, a retro desktop with a Focus Timer, Tasks, Day Planner, Journal, a scratchpad and Customize (wallpapers, accent color, desk decor). |
| **Espresso bar** | Order drinks from Bea the barista with tickets. Each drink gives a 1-hour boost to the tickets you earn from focusing, and your avatar carries the cup. |
| **Vending machine** | Snacks, sodas and fortune cookies, bought by typing a code on the keypad. |
| **Water cooler** | Hydration tracker, room chat, and a community notes board. |
| **Whiteboard** | Kanban board with drag-and-drop sticky notes, sharing one task list with BrewOS. |
| **Copier** | Prints a daily plan, a weekly focus report or a motivational poster. |
| **Library** | 29 curated Project Gutenberg classics plus search across 70k+ books, with a full-text reader that saves your progress. |
| **Record player** | 5 lo-fi stations generated live in the browser, plus an ambience mixer. Music gets louder as you walk closer. |
| **Arcade cabinet** | 4 break-time mini-games: Bean Catcher, Latte Art Memory, Snake Brew and Plant Stack. |
| **Wardrobe mirror** | Voxel avatar editor covering hair, face, outfits, hats, glasses, tails and wings. |
| **Pet corner** | Companions that follow you around: cat, shiba, bunny, duck, frog, ghost, capybara and dragon. |
| **Door** | The room lobby: 9 themed rooms, each with 3 servers (**Silicon, Haven, Sakura**). |

**The focus loop:**
1. Press **Start focus** (or **F**). Your avatar walks to its desk and starts typing, with a timer bubble overhead that everyone can see.
2. When the session ends you hear a chime and earn tickets.
3. Breaks nudge you toward coffee, the arcade or a book.

Tickets buy drinks, outfits, pets, desk decor and wallpapers. Your stats and achievements are computed from your real sessions.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows, or click the floor | Walk |
| E / Space, or click an object | Use the spot in front of you |
| Q / R | Rotate the camera |
| + / − / mouse wheel | Pixel size (zoom) |
| F | Start / pause focus |
| G | Walk to your desk |
| T | Tasks |
| M | Music on/off |
| Enter | Chat |
| Esc | Close the current window |

## Running it

```bash
npm install        # or: bun install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
npm run lint       # type-check
```

## Deploying (Cloudflare Pages)

- Build command: `npm run build`. Output directory: `dist`.
- `functions/api/book/[id].ts` is a Pages Function that proxies Project Gutenberg's plain-text files, because gutenberg.org doesn't send CORS headers. Pages deploys it automatically from the `functions/` folder. In dev, `vite.config.ts` proxies the same path.
- **Firebase** is optional and lazy-loaded. It uses the existing `firestore.rules`, which need no changes. To use Google sign-in on a domain, add that domain to **Firebase console → Authentication → Settings → Authorized domains** (for example `coworkingbrew.pages.dev`).

## How it's built

```
src/
  engine/   three.js world rendered as 3D pixel art
            - pipeline.ts : low-res render + depth/normal outlines + texel-snapped camera
            - room.ts     : the shared café layout (desks, coffee bar, library…) built from voxels
            - themes.ts   : 9 room themes (materials, palette, light, window view)
            - avatar.ts   : voxel chibi avatars + procedural animation
            - pets.ts, particles.ts, nav.ts (A* click-to-move), textures.ts (procedural pixel textures)
            - Game.ts     : loop, camera, input, NPCs, remote players, labels/bubbles
  audio/    procedural lo-fi generator, ambience layers, SFX, chimes (Web Audio, no files)
  state/    zustand stores (persisted to localStorage): profile, economy, tasks, focus timer…
  ui/       React overlay: HUD, dock, pixel-window kit, BrewOS, one lazy chunk per panel
  net/      Firebase (lazy): auth, presence with positions, room chat, DMs, notes board, profile sync
  data/     drinks, snacks, shop catalog, wallpapers, books, achievements
functions/  Cloudflare Pages Function for Gutenberg texts
```

All art is drawn in code: voxel furniture, pixel textures, icons and wallpapers. Nothing is loaded from image files.

See [`docs/REBUILD_PLAN.md`](docs/REBUILD_PLAN.md) for the design rationale behind the rebuild.
