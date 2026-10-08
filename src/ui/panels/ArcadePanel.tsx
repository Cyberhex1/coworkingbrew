import { useCallback, useState } from 'react';
import { Window } from '../Window';
import { PixelIcon } from '../PixelIcon';
import { today, useApp } from '../../state/store';
import { ECONOMY } from '../../data/catalog';
import { Cabinet, GameSelect, GameThumb } from './arcade/Cabinet';
import { GameScreen } from './arcade/GameScreen';
import { GAMES, gameById } from './arcade/games';
import { loadBests, sfx, ticketsFor, type Bests } from './arcade/meta';
import type { GameId } from './arcade/types';

type Tab = 'play' | 'scores';

const TABS = [
  { id: 'play', label: 'Play', icon: 'joystick' },
  { id: 'scores', label: 'High Scores', icon: 'star' },
];

function useOnBreak() {
  return useApp((s) => s.focus.mode !== 'focus' && s.focus.running);
}

function useArcadeTicketsToday() {
  return useApp((s) => (s.caps.date === today() ? s.caps.gameTickets : 0));
}

function BreakBanner() {
  const onBreak = useOnBreak();
  const used = useArcadeTicketsToday();
  const cap = ECONOMY.gameDailyCap;
  const capped = used >= cap;
  return (
    <div
      className={`mb-3 flex items-center gap-2 border-2 border-[var(--color-ink)] px-2.5 py-2 text-[13px] leading-tight ${onBreak ? 'bg-[var(--color-mint)]' : 'bg-[var(--color-paper-2)]'}`}
      role="status"
    >
      <PixelIcon name={onBreak ? 'sparkle' : 'tomato'} size={20} className={onBreak ? 'px-bob shrink-0' : 'shrink-0'} />
      <div className="flex-1 min-w-0">
        {onBreak ? (
          <>
            <b>Break time bonus: x2!</b> <span className="text-[var(--color-ink-2)]">Games pay full tickets while your break timer runs.</span>
          </>
        ) : (
          <>
            <b>Off the clock.</b> <span className="text-[var(--color-cocoa)]">Tickets are halved outside Pomodoro breaks. Start a break for x2.</span>
          </>
        )}
      </div>
      <span className={`px-chip shrink-0 inline-flex items-center gap-1 ${capped ? '!bg-[var(--color-paper-3)]' : ''}`} title="Arcade tickets earned today (daily cap)">
        <PixelIcon name="ticket" size={12} />
        {Math.min(used, cap)}/{cap}
      </span>
    </div>
  );
}

function ScoresTab({ bests }: { bests: Bests }) {
  const onBreak = useOnBreak();
  const used = useArcadeTicketsToday();
  const cap = ECONOMY.gameDailyCap;
  return (
    <div className="flex flex-col gap-3">
      <div className="px-inset p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="px-tiny text-[var(--color-cocoa)]">Arcade tickets today</span>
          <span className="text-[13px] font-semibold">{Math.min(used, cap)} / {cap}</span>
        </div>
        <div className="px-progress"><span style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} /></div>
        <p className="mt-2 text-[12px] leading-snug text-[var(--color-cocoa)]">
          Every run pays tickets based on your score (up to 5). During a running Pomodoro break you get the full amount;
          outside breaks it's halved. After {cap} arcade tickets a day, games are just for fun.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {GAMES.map((g) => {
          const best = bests[g.id] ?? 0;
          const base = best > 0 ? g.reward(best) : 0;
          return (
            <li key={g.id} className="px-inset flex items-center gap-3 p-2">
              <GameThumb def={g} size={1} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] leading-tight truncate">{g.name}</div>
                <div className="text-[12px] text-[var(--color-cocoa)] truncate">{g.tagline}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="px-tiny text-[var(--color-cocoa)]">best {g.scoreLabel.toLowerCase()}</div>
                <div className="font-bold text-[20px] leading-none">{best}</div>
                {best > 0 && (
                  <div className="text-[11px] text-[var(--color-cocoa)] inline-flex items-center gap-1">
                    worth <PixelIcon name="ticket" size={11} /> {ticketsFor(base, onBreak)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ArcadePanel() {
  const [tab, setTab] = useState<Tab>('play');
  const [game, setGame] = useState<GameId | null>(null);
  const [bests, setBests] = useState<Bests>(() => loadBests());

  const refreshBests = useCallback(() => setBests(loadBests()), []);
  const pick = useCallback((id: GameId) => {
    sfx('click');
    setGame(id);
  }, []);
  const back = useCallback(() => {
    setGame(null);
    setBests(loadBests());
  }, []);

  const def = game ? gameById(game) : null;

  return (
    <Window
      title="Arcade Cabinet"
      icon="joystick"
      width="lg"
      subtitle="Four tiny café games for your Pomodoro breaks"
      tabs={TABS}
      tab={tab}
      onTab={(id: string) => setTab(id === 'scores' ? 'scores' : 'play')}
    >
      {tab === 'play' ? (
        <>
          <BreakBanner />
          <Cabinet compact={!!def}>
            {def ? (
              <div key={def.id}>
                <GameScreen def={def} onBack={back} onScore={refreshBests} />
              </div>
            ) : (
              <GameSelect bests={bests} onPick={pick} />
            )}
          </Cabinet>
          {!def && (
            <p className="mt-3 text-center text-[12px] text-[var(--color-cocoa)]">
              Pick a game with the mouse or press <kbd className="px-kbd">1</kbd>–<kbd className="px-kbd">4</kbd>. Press <kbd className="px-kbd">P</kbd> to pause mid-game.
            </p>
          )}
        </>
      ) : (
        <ScoresTab bests={bests} />
      )}
    </Window>
  );
}
