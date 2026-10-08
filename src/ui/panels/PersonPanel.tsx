import { useState } from 'react';
import { Window } from '../Window';
import { useUI, toast } from '../../state/ui';
import { useNet, sendDirect } from '../../net/session';
import { game } from '../../engine/gameRef';
import { AvatarPreview } from '../AvatarPreview';
import { audio } from '../../audio/engine';
import { PixelIcon } from '../PixelIcon';

export default function PersonPanel() {
  const arg = useUI((s) => s.panelArg) as { id: string; name: string; kind: string } | null;
  const user = useNet((s) => s.user);
  const [text, setText] = useState('');
  const g = game();
  const actor = arg ? g?.actors.get(arg.id) : undefined;
  if (!arg) return null;
  const remoteUid = arg.id.startsWith('remote-') ? arg.id.slice(7) : null;
  const blurb =
    arg.kind === 'bot' ? 'The room’s study bot. Always at desk 1, always focused. Great accountability buddy.'
    : arg.kind === 'npc' ? 'A café regular. They come here most days to work — say hi in chat!'
    : arg.kind === 'barista' ? 'Bea runs the espresso bar. Walk up to the counter to order.'
    : 'A real person coworking in this room right now.';

  const wave = () => {
    audio.sfx('pop');
    g?.wave();
    g?.say('me', `👋 Hi ${arg.name}!`, 3000);
    if (arg.kind !== 'remote') setTimeout(() => g?.say(arg.id, ['👋 Hey!', 'Hi there! ✨', 'Good luck today!'][Math.floor(Math.random() * 3)], 3000), 900);
  };

  return (
    <Window title={arg.name} icon="user" width="sm" subtitle={arg.kind === 'remote' ? 'Coworker' : arg.kind === 'bot' ? 'Study bot' : arg.kind === 'barista' ? 'Barista' : 'Café regular'}>
      <div className="flex flex-col items-center gap-2 text-center">
        {actor && <AvatarPreview avatar={actor.avatar} pet={actor.pet ?? 'none'} size={140} pixel={3} />}
        {actor?.statusText && <div className="px-chip">{actor.statusText}</div>}
        <p className="text-[12px] leading-snug">{blurb}</p>
        <div className="flex gap-2">
          <button className="px-btn" onClick={wave}><PixelIcon name="wave" size={16} />Wave</button>
          {actor?.deskIndex != null && <span className="px-chip self-center">Desk {actor.deskIndex + 1}</span>}
        </div>
        {remoteUid && (
          user ? (
            <form className="flex gap-1.5 w-full mt-1" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; const r = await sendDirect(remoteUid, arg.name, text.trim()); if (r) toast(r, 'error'); else { toast('Message sent ✉️', 'success'); setText(''); } }}>
              <input className="px-input text-[13px]" placeholder={`Message ${arg.name}…`} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
              <button className="px-btn px-btn-sm">Send</button>
            </form>
          ) : <p className="text-[11px] text-[var(--color-cocoa)]">Sign in to send direct messages.</p>
        )}
      </div>
    </Window>
  );
}
