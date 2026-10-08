import { lazy, Suspense, useEffect } from 'react';
import { WorldView } from './ui/WorldView';
import { RoomCard, TopRight, FocusWidget, Prompt, Dock, CameraControls, Toasts, Chat, goToMyDesk, fmt } from './ui/HUD';
import { useApp } from './state/store';
import { useUI, type PanelId } from './state/ui';
import { audio } from './audio/engine';
import { game } from './engine/gameRef';
import { initNet } from './net/session';
import { THEME_BY_ID } from './engine/themes';
import { toast } from './state/ui';

const panels: Record<PanelId, React.LazyExoticComponent<React.ComponentType>> = {
  brewos: lazy(() => import('./ui/os/BrewOS')),
  coffee: lazy(() => import('./ui/panels/CoffeePanel')),
  vending: lazy(() => import('./ui/panels/VendingPanel')),
  cooler: lazy(() => import('./ui/panels/CoolerPanel')),
  whiteboard: lazy(() => import('./ui/panels/WhiteboardPanel')),
  copier: lazy(() => import('./ui/panels/CopierPanel')),
  library: lazy(() => import('./ui/panels/LibraryPanel')),
  record: lazy(() => import('./ui/panels/RecordPanel')),
  arcade: lazy(() => import('./ui/panels/ArcadePanel')),
  wardrobe: lazy(() => import('./ui/panels/WardrobePanel')),
  pet: lazy(() => import('./ui/panels/PetPanel')),
  rooms: lazy(() => import('./ui/panels/RoomsPanel')),
  shop: lazy(() => import('./ui/panels/ShopPanel')),
  stats: lazy(() => import('./ui/panels/StatsPanel')),
  settings: lazy(() => import('./ui/panels/SettingsPanel')),
  account: lazy(() => import('./ui/panels/AccountPanel')),
  tasks: lazy(() => import('./ui/panels/TasksPanel')),
  person: lazy(() => import('./ui/panels/PersonPanel')),
  help: lazy(() => import('./ui/panels/HelpPanel')),
  messages: lazy(() => import('./ui/panels/MessagesPanel')),
};

const Onboarding = lazy(() => import('./ui/Onboarding'));

export default function App() {
  const panel = useUI((s) => s.panel);
  const onboarded = useApp((s) => s.onboarded);
  const Panel = panel ? panels[panel] : null;

  useFocusEngine();
  useAudioSync();
  useShortcuts();
  useEffect(() => initNet(), []);

  return (
    <div className="fixed inset-0 select-none">
      <WorldView />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col p-2 sm:p-3 gap-2">
        <div className="flex items-start justify-between gap-2">
          <RoomCard />
          <div className="flex flex-col items-end gap-2">
            <TopRight />
            {onboarded && <div className="hidden sm:block"><FocusWidget /></div>}
          </div>
        </div>
        <div className="flex justify-center"><Toasts /></div>
        <div className="flex-1" />
        {onboarded && <div className="sm:hidden flex justify-center"><FocusWidget /></div>}
        <div className="flex items-end justify-between gap-2">
          <div className="hidden sm:block"><Chat /></div>
          <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0">
            <Prompt />
            <Dock />
          </div>
          <div className="hidden sm:block"><CameraControls /></div>
        </div>
      </div>

      {Panel && (
        <Suspense fallback={<div className="fixed inset-0 z-40 grid place-items-center"><div className="px-panel px-4 py-2 px-blink">Loading…</div></div>}>
          <Panel key={panel} />
        </Suspense>
      )}

      {!onboarded && (
        <Suspense fallback={null}>
          <Onboarding />
        </Suspense>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- focus timer engine
function useFocusEngine() {
  useEffect(() => {
    let lastStatus = '';
    const tick = () => {
      const s = useApp.getState();
      const f = s.focus;
      const now = Date.now();
      const total = (f.mode === 'focus' ? s.settings.focusMin : f.mode === 'short' ? s.settings.shortMin : s.settings.longMin) * 60_000;
      const remaining = f.running && f.endsAt ? f.endsAt - now : f.remainingMs;
      const g = game();
      if (f.running && f.endsAt && now >= f.endsAt) {
        const res = s.completeFocus();
        if (res) {
          audio.chime(s.settings.chime);
          if (res.mode === 'focus') {
            g?.say('me', 'Session complete! 🎉', 5000);
            g?.wave();
            toast(`Focus session done — time for a break!`, 'success');
            notify('Focus session complete 🎉', `+${res.tickets} tickets. Take a break — grab a coffee or play the arcade.`);
          } else {
            toast('Break over — back to it? Press play when ready.', 'info');
            notify('Break is over ☕', 'Ready for another focus session?');
          }
        }
      }
      const running = f.running;
      const progress = Math.max(0, Math.min(1, 1 - remaining / total));
      g?.setFocusVisual(running && f.mode === 'focus', progress, '');
      const task = s.tasks.find((t) => t.id === f.taskId);
      const status = running ? (f.mode === 'focus' ? `🍅 ${fmt(remaining)}${task ? ` · ${task.title.slice(0, 22)}` : ''}` : `☕ break ${fmt(remaining)}`) : '';
      if (status !== lastStatus) {
        lastStatus = status;
        g?.setPlayerStatus(status);
      }
      const title = THEME_BY_ID[s.theme].short;
      document.title = running ? `${fmt(remaining)} ${f.mode === 'focus' ? '🍅' : '☕'} · CoworkingBrew` : `CoworkingBrew · ${title}`;
    };
    const id = setInterval(tick, 500);
    tick();
    return () => clearInterval(id);
  }, []);
}

function notify(title: string, body: string) {
  try {
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.svg' });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- audio <-> settings
function useAudioSync() {
  useEffect(() => {
    const apply = () => {
      const s = useApp.getState().settings;
      audio.setMasterVolume(s.master);
      audio.setMusicVolume(s.music);
      audio.setStation(s.station);
      audio.setMusicOn(s.musicOn);
      for (const [k, v] of Object.entries(s.ambience)) audio.setAmbience(k as keyof typeof s.ambience, v);
    };
    apply();
    const unsub = useApp.subscribe((s, p) => { if (s.settings !== p.settings) apply(); });
    // browsers need a gesture before audio can start
    const unlock = () => {
      void audio.unlock().then(() => {
        useUI.getState().set({ audioUnlocked: true });
        apply();
      });
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      unsub();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
}

// ---------------------------------------------------------------- keyboard shortcuts
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
      const ui = useUI.getState();
      if (e.key === 'Escape') {
        if (ui.panel) { audio.sfx('close'); ui.closePanel(); }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!useApp.getState().onboarded) return;
      if (ui.panel) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { e.preventDefault(); ui.set({ chatOpen: true }); }
      else if (k === 't') ui.openPanel('tasks');
      else if (k === 'g') goToMyDesk();
      else if (k === 'm') useApp.getState().setSettings({ musicOn: !useApp.getState().settings.musicOn });
      else if (k === 'f') {
        const s = useApp.getState();
        if (s.focus.running) s.pauseFocus();
        else s.startFocus();
      } else if (k === '?' || k === 'h') ui.openPanel('help');
      else if (k === 'e' && ui.seatId?.startsWith('desk-')) ui.openPanel('brewos');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
