import { useEffect, useRef } from 'react';
import { Game, type GameEvent } from '../engine/Game';
import { setGame } from '../engine/gameRef';
import { useApp } from '../state/store';
import { useUI, toast, type PanelId } from '../state/ui';
import { audio } from '../audio/engine';
import type { InteractKind } from '../engine/room';

const PANEL_FOR: Partial<Record<InteractKind, PanelId>> = {
  coffee: 'coffee',
  vending: 'vending',
  cooler: 'cooler',
  whiteboard: 'whiteboard',
  copier: 'copier',
  library: 'library',
  record: 'record',
  arcade: 'arcade',
  wardrobe: 'wardrobe',
  petbed: 'pet',
  door: 'rooms',
};

/** Hosts the 3D café and keeps it in sync with app state. */
export function WorldView() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const g = new Game(el);
    setGame(g);
    const s = useApp.getState();
    g.loadRoom(s.theme);
    g.setZoom(window.innerWidth < 640 ? 2 : s.settings.zoom);
    g.setNpcsEnabled(s.settings.npcs);
    g.setPlayer({ name: s.name || 'You', avatar: s.avatar, pet: s.pet, petName: s.petName, deskIndex: s.deskIndex ?? undefined });
    g.setDeskDecor(s.deskIndex ?? undefined, s.deskDecor);
    g.setHeld(s.held && s.held.until > Date.now() ? s.held.kind : null);
    syncWhiteboard(g);

    const off = g.on((e: GameEvent) => handleEvent(g, e));

    // store -> world
    const unsub = useApp.subscribe((st, prev) => {
      if (st.theme !== prev.theme) {
        g.loadRoom(st.theme);
        g.setDeskDecor(st.deskIndex ?? undefined, st.deskDecor);
        syncWhiteboard(g);
      }
      if (st.avatar !== prev.avatar || st.pet !== prev.pet || st.name !== prev.name || st.deskIndex !== prev.deskIndex || st.petName !== prev.petName) {
        g.setPlayer({ name: st.name || 'You', avatar: st.avatar, pet: st.pet, petName: st.petName, deskIndex: st.deskIndex ?? undefined });
      }
      if (st.deskDecor !== prev.deskDecor || st.deskIndex !== prev.deskIndex) g.setDeskDecor(st.deskIndex ?? undefined, st.deskDecor);
      if (st.tasks !== prev.tasks) syncWhiteboard(g);
      if (st.held !== prev.held) g.setHeld(st.held && st.held.until > Date.now() ? st.held.kind : null);
      if (st.settings.npcs !== prev.settings.npcs) g.setNpcsEnabled(st.settings.npcs);
      if (st.settings.zoom !== prev.settings.zoom) g.setZoom(st.settings.zoom);
    });

    // panels block world keyboard input (except the desk OS, which has its own Esc)
    const unsubUI = useUI.subscribe((u, prev) => {
      if (u.panel !== prev.panel) {
        g.setInputEnabled(u.panel === null);
        if (prev.panel === 'brewos' && u.panel === null && g.player?.seatId?.startsWith('desk-')) {
          // leaving the OS leaves you seated; standing happens on movement
        }
      }
    });

    // held drinks expire
    const heldTimer = setInterval(() => {
      const h = useApp.getState().held;
      if (h && h.until < Date.now()) useApp.getState().set({ held: null });
    }, 15_000);

    g.start();
    return () => {
      off();
      unsub();
      unsubUI();
      clearInterval(heldTimer);
      setGame(null);
      g.dispose();
    };
  }, []);

  return <div ref={ref} className="cb-world" />;
}

function syncWhiteboard(g: Game) {
  const tasks = useApp.getState().tasks;
  const col = (st: string) => tasks.filter((t) => t.status === st).map((t) => t.title);
  g.updateWhiteboard([
    { title: 'TODO', cards: col('todo') },
    { title: 'DOING', cards: col('doing') },
    { title: 'DONE', cards: col('done') },
  ]);
}

function handleEvent(g: Game, e: GameEvent) {
  const ui = useUI.getState();
  switch (e.type) {
    case 'near':
      ui.set({ near: e.target });
      break;
    case 'zone':
      ui.set({ zone: e.zone });
      break;
    case 'proximity':
      audio.setProximity({ music: e.music, cafe: e.cafe, fire: e.fire });
      audio.setFocusMuffle(e.focus && useApp.getState().focus.running && useApp.getState().focus.mode === 'focus');
      break;
    case 'interact': {
      const t = e.target;
      if (t.kind === 'desk' && t.deskIndex != null) {
        const owner = g.deskOwner(t.deskIndex);
        if (owner) {
          toast(`${t.name} belongs to ${owner.name}. Pick a free desk!`, 'info');
          audio.sfx('error');
          g.say(owner.id, owner.kind === 'bot' ? 'Bzzt — this is my desk 🤖' : 'Oh, hi! This one’s mine 🙂', 2500);
        }
        return;
      }
      if (t.kind === 'seat') {
        audio.sfx('sit');
        return;
      }
      const p = PANEL_FOR[t.kind];
      if (p) {
        audio.sfx(t.kind === 'door' ? 'whoosh' : 'open');
        ui.openPanel(p);
        if (t.kind === 'coffee') g.say('barista', pickOne(['Hi there! What can I get you? ☕', 'Welcome in! The matcha is lovely today.', 'Back for more? I like your style.']), 3500);
      }
      break;
    }
    case 'sat': {
      ui.set({ seatId: e.seatId, sittingDesk: e.deskIndex ?? null });
      audio.sfx('sit');
      if (e.deskIndex != null) {
        const app = useApp.getState();
        if (app.deskIndex !== e.deskIndex) {
          app.set({ deskIndex: e.deskIndex });
          toast(`Desk ${e.deskIndex + 1} is yours now ✨`, 'success');
        }
        ui.openPanel('brewos');
      }
      break;
    }
    case 'stood':
      ui.set({ seatId: null, sittingDesk: null });
      if (ui.panel === 'brewos') ui.closePanel();
      break;
    case 'actorClick':
      if (e.kind === 'player') return;
      ui.openPanel('person', { id: e.actorId, name: e.name, kind: e.kind });
      break;
  }
}

function pickOne<T>(a: T[]) {
  return a[Math.floor(Math.random() * a.length)];
}
