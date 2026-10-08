import { useEffect, useMemo, useState } from 'react';
import { Window, Empty } from '../Window';
import { useNet, sendDirect, markRead } from '../../net/session';
import { useUI } from '../../state/ui';

export default function MessagesPanel() {
  const user = useNet((s) => s.user);
  const dms = useNet((s) => s.dms);
  const [peer, setPeer] = useState<string | null>(null);
  const [text, setText] = useState('');

  const threads = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, { id: string; name: string; last: number; unread: number }>();
    for (const m of dms) {
      const other = m.senderId === user.uid ? m.recipientId : m.senderId;
      const name = m.senderId === user.uid ? m.recipientName : m.senderName;
      const t = map.get(other) ?? { id: other, name, last: 0, unread: 0 };
      t.last = Math.max(t.last, m.createdAt);
      if (m.recipientId === user.uid && !m.read) t.unread++;
      map.set(other, t);
    }
    return [...map.values()].sort((a, b) => b.last - a.last);
  }, [dms, user]);

  const active = peer ?? threads[0]?.id ?? null;
  const convo = user && active ? dms.filter((m) => (m.senderId === active && m.recipientId === user.uid) || (m.senderId === user.uid && m.recipientId === active)) : [];
  useEffect(() => {
    if (!user) return;
    for (const m of convo) if (m.recipientId === user.uid && !m.read) void markRead(m.id);
  }, [convo.length, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <Window title="Messages" icon="mail" width="sm">
        <Empty icon="mail">Sign in to send and receive direct messages.</Empty>
        <button className="px-btn w-full" onClick={() => useUI.getState().openPanel('account')}>Sign in</button>
      </Window>
    );
  }
  const name = threads.find((t) => t.id === active)?.name ?? '';
  return (
    <Window title="Messages" icon="mail" width="lg">
      {threads.length === 0 ? (
        <Empty icon="mail">No messages yet. Click someone in the café to say hello.</Empty>
      ) : (
        <div className="grid grid-cols-[160px_1fr] gap-3 min-h-[320px]">
          <ul className="flex flex-col gap-1">
            {threads.map((t) => (
              <li key={t.id}>
                <button className={`w-full text-left px-inset p-1.5 text-[13px] ${t.id === active ? 'border-[var(--color-terra)] bg-[#fff2e4]' : ''}`} onClick={() => setPeer(t.id)}>
                  <b>{t.name}</b>{t.unread > 0 && <span className="px-chip ml-1 bg-[var(--color-terra)] text-white">{t.unread}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 min-h-0">
            <ul className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[340px]">
              {convo.map((m) => (
                <li key={m.id} className={`max-w-[80%] p-2 text-[13px] border-2 border-[var(--color-ink)] ${m.senderId === user.uid ? 'self-end bg-[#fff2c4]' : 'self-start bg-[var(--color-paper-2)]'}`}>
                  {m.text}
                  <div className="text-[10px] opacity-60 mt-0.5">{new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                </li>
              ))}
            </ul>
            <form className="flex gap-1.5" onSubmit={async (e) => { e.preventDefault(); if (!text.trim() || !active) return; const r = await sendDirect(active, name, text.trim()); if (!r) setText(''); }}>
              <input className="px-input text-[13px]" placeholder={`Message ${name}…`} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
              <button className="px-btn px-btn-sm">Send</button>
            </form>
          </div>
        </div>
      )}
    </Window>
  );
}
