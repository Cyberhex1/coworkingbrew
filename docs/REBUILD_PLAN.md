# CoworkingBrew rebuild plan

## Sources for the vision

1. **Your direct answer (Oct 8):** the art direction is **3D pixel art**. It's a real 3D world rendered at
   low resolution and upscaled with crisp pixels, with toon shading and outlines.
2. **`chat_transcript.txt`** (only the last two turns were captured):
   - every room has **8 desks**: desk 0 for the room's study bot, desks 1–7 for people
   - every room has a **coffee area, vending machine, library, whiteboard, copier and water cooler**
   - every room has 3 servers: **Silicon, Haven, Sakura**, with no regions
   - the project title is "Virtual **3D Pixel** Co-Working Space"
3. **The app description:** "A cozy 3D pixelated virtual co-working space featuring cubicle desks,
   interactive voxel avatars, customizable OS workstation, Pomodoro focus rooms, lofi audio, task
   planner, bookshelf reader, and companion pets."
4. **The "Antigravity And AI Studio Guide" doc (Scenario B):**
   - spatial presence like **Gather.town / WorkAdventure**
   - one unified rendered world instead of "a collection of decoupled HTML containers"
   - a cozy café look: mahogany, brass espresso machines, amber lamps, monstera, CRT monitors
   - avatars with walk cycles, typing and coffee-sipping poses
   - procedural lo-fi audio with proximity
   - a cohesive Pomodoro focus loop
   - simulation decoupled from rendering
5. **The previous code**, which shows the full feature set asked for along the way: the 9 room themes,
   the ticket economy, drinks, pets, break games, Firebase auth, DMs and presence.

## What was wrong with the old build

- **The world is boxed in.** It's a small diorama, with a dense purple dashboard of cards stacked
  underneath. Timer, tasks and planner aren't spatial at all.
- **Too many overlays.** There are 20+ modals and four "display modes".
- **The visual language is mixed.** Voxels, glassmorphism, emoji and gradients don't add up to a
  coherent pixel-art style.
- **Bugs:**
  - the shop is free, because the customizer ignores what you've unlocked
  - stats are faked
  - "send a round" lets you mint tickets
  - presence writes fire while you're signed out, and get rebuilt on every edit
- **Bundle:** everything ships as one 2 MB file.

## The new design

**The world fills the screen. You walk into a cozy 3D pixel-art café and get work done.** Every
feature lives at a physical spot in the room. You walk up to it and press **E**, or just click it.

| Spot (in every room) | What it does |
| --- | --- |
| **Your desk** (one of 8 cubicle desks) | Sit to open **BrewOS**, the customizable retro workstation: Focus Timer, Tasks, Planner, Journal, Notes, Wallpapers, Desk decor |
| **Coffee area** (espresso bar + barista) | Order drinks with tickets, and your avatar carries the cup |
| **Vending machine** | Snacks and sodas, with a quick slot animation |
| **Library** | Browse Project Gutenberg, read full books in-app, track progress, earn tickets |
| **Whiteboard** | Sprint kanban that shares tasks with BrewOS |
| **Copier** | Print a daily summary / poster of your plan and tasks |
| **Water cooler** | Hydration tracker + room chat |
| **Record player** | Lo-fi stations + ambient mixer. Music gets louder as you approach |
| **Arcade cabinet** | Break mini-games |
| **Wardrobe mirror** | Avatar customizer (voxel chibi) |
| **Pet bed** | Companion pet that follows you |

**The focus loop:**
1. Press **Start focus** in the HUD or at your desk. Your avatar walks to its desk, sits and starts
   typing, and a timer bubble floats overhead.
2. When the session ends you get a chime and earn tickets.
3. The break nudges you to the coffee bar or the arcade.

**Rooms:** the same 9 themes, each with Silicon / Haven / Sakura servers. Every theme reuses the same
café layout with its own palette, materials, window view, time of day and a few theme props.

**Rendering:**
- three.js renders at 1/3 resolution through a pixel post-process: depth/normal outlines and crisp
  nearest-neighbor upscaling
- the camera is snapped to the pixel grid so nothing shimmers
- isometric orthographic camera that rotates in 90° steps (Q / E)
- toon lighting, hard pixel shadows, warm lamp lights and day/night by theme

**Presence:**
- the room study bot sits at desk 0
- optional "café regulars" NPCs (clearly marked as bots) keep the room lively when you're alone
- when you sign in, real people sync through the existing Firestore `room_presences` collection, with
  position fields added (the security rules don't need changes)

## Architecture

```
src/
  engine/   three.js world: pixel pipeline, vox builder, room builder + themes, avatars, pets,
            nav grid + A*, input, camera, sim (fixed step), overlay labels
  audio/    procedural lo-fi + ambience + proximity + UI blips
  state/    zustand stores (persisted): profile & economy, tasks/planner/journal, focus session, UI
  ui/       React overlays: HUD, dock, prompts, toasts, pixel windows, BrewOS, amenity panels
  data/     rooms, drinks, snacks, shop catalog, books
  net/      presence (Firebase) + NPC brains
functions/  Cloudflare Pages Function that proxies Gutenberg text (gutenberg.org has no CORS)
```
