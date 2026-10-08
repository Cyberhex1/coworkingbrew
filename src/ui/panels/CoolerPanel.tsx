import { useEffect, useState } from 'react';
import { Window, Empty } from '../Window';
import { useApp, today } from '../../state/store';
import { useUI } from '../../state/ui';
import { useNet, watchNotes, postNote } from '../../net/session';
import { sendChat } from '../../net/chat';
import { ECONOMY } from '../../data/catalog';
import { game } from '../../engine/gameRef';
import { audio } from '../../audio/engine';
import { PixelIcon } from '../PixelIcon';

const ICEBREAKERS = [
  'What are you working on today?',
  'Best snack for a long study session?',
  'What’s a tiny win from this week?',
  'Coffee, tea, or something weird?',
  'What song is on repeat for you lately?',
  'If you could learn one skill overnight, what would it be?',
];

export default function CoolerPanel() {
  const [tab, setTab] = useState('water');
  return (
    <Window title="Water Cooler" icon="water" width="md" tabs={[{ id: 'water', label: 'Hydrate', icon: 'water' }, { id: 'chat', label: 'Chat', icon: 'chat' }, { id: 'board', label: 'Notes board', icon: 'notes' }]} tab={tab} onTab={setTab}>
      {tab === 'water' && <Hydrate />}
      {tab === 'chat' && <ChatTab />}
      {tab === 'board' && <Board />}
    </Window>
  );
}

function Hydrate() {
  const h = useApp((s) => s.hydration);
  const glasses = h.date === today() ? h.glasses : 0;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-[13px]">Drink a glass, earn a ticket — up to {ECONOMY.glassesPerDay} a day.</p>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {Array.from({ length: ECONOMY.glassesPerDay }).map((_, i) => (
          <svg key={i} width={34} height={44} viewBox="0 0 10 13" shapeRendering="crispEdges">
            <rect x="0" y="0" width="10" height="13" fill="#2a1a1f" />
            <rect x="1" y="0" width="8" height="12" fill="#e8f4f8" />
            {i < glasses && <rect x="1" y="3" width="8" height="9" fill="#7cc0e8" />}
            {i < glasses && <rect x="2" y="4" width="1" height="5" fill="#ffffff" opacity="0.7" />}
          </svg>
        ))}
      </div>
      <div className="text-[14px] font-semibold">{glasses} / {ECONOMY.glassesPerDay} glasses today</div>
      <button
        className="px-btn px-btn-primary"
        disabled={glasses >= ECONOMY.glassesPerDay}
        onClick={() => {
          audio.sfx('pour');
          if (useApp.getState().drinkWater()) {
            useApp.getState().holdItem('cup:#e8f4f8:#7cc0e8', 'Water', 5);
            game()?.say('me', ['Ahh, refreshing 💧', 'Hydration check ✓', 'Glug glug'][glasses % 3], 2500);
          }
        }}
      >
        <PixelIcon name="water" size={16} /> Pour a glass
      </button>
    </div>
  );
}

function ChatTab() {
  const chat = useUI((s) => s.chat);
  const signedIn = useNet((s) => !!s.user);
  const [text, setText] = useState('');
  const ice = ICEBREAKERS[new Date().getDate() % ICEBREAKERS.length];
  return (
    <div className="flex flex-col gap-2">
      <div className="px-inset p-2 text-[12px]"><b>Icebreaker of the day:</b> {ice}</div>
      <ul className="flex flex-col gap-1 max-h-[260px] overflow-y-auto">
        {chat.length === 0 && <Empty icon="chat">Quiet in here. Say hi — your message pops up over your head.</Empty>}
        {chat.map((m) => (
          <li key={m.id} className="text-[13px]"><b>{m.from}</b>: {m.text} <span className="text-[10px] text-[var(--color-cocoa)]">{new Date(m.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></li>
        ))}
      </ul>
      <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { sendChat(text.trim()); audio.sfx('pop'); } setText(''); }}>
        <input className="px-input text-[13px]" placeholder={ice} value={text} onChange={(e) => setText(e.target.value)} maxLength={200} />
        <button className="px-btn px-btn-sm">Send</button>
      </form>
      {!signedIn && <p className="text-[11px] text-[var(--color-cocoa)]">You’re offline-only — sign in to chat with real people in this room.</p>}
    </div>
  );
}

function Board() {
  const notes = useNet((s) => s.notes);
  const signedIn = useNet((s) => !!s.user);
  const [text, setText] = useState('');
  const [cat, setCat] = useState('thought');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    void watchNotes().then((u) => { unsub = u; setLoading(false); }).catch(() => setLoading(false));
    return () => unsub?.();
  }, []);
  const colors: Record<string, string> = { thought: '#f7d97a', book: '#8cb4dc', tip: '#9cc96a', cheer: '#f0a8a8' };
  return (
    <div className="flex flex-col gap-2">
      <form className="flex gap-1.5" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; const r = await postNote(text.trim(), cat); setErr(r); if (!r) { setText(''); audio.sfx('pop'); } }}>
        <input className="px-input text-[13px]" placeholder={signedIn ? 'Pin a note for everyone…' : 'Sign in to pin notes'} disabled={!signedIn} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
        <select className="px-input text-[12px] w-[90px]" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          {Object.keys(colors).map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="px-btn px-btn-sm" disabled={!signedIn}>Pin</button>
      </form>
      {err && <div className="text-[12px] text-[var(--color-tomato)]">{err}</div>}
      {loading ? <div className="px-blink text-[13px]">Loading board…</div> : notes.length === 0 ? <Empty icon="notes">No notes yet. Be the first!</Empty> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto p-1">
          {notes.map((n, i) => (
            <div key={n.id} className="p-2 border-2 border-[var(--color-ink)] text-[12px] leading-snug" style={{ background: colors[n.category ?? 'thought'] ?? '#f7d97a', transform: `rotate(${((i * 37) % 5) - 2}deg)` }}>
              <p className="whitespace-pre-wrap break-words">{n.text}</p>
              <div className="mt-1 text-[10px] opacity-70">— {n.authorName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
