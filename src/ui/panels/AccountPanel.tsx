import { useState } from 'react';
import { Window } from '../Window';
import { useNet, signIn, signOutNow, resetPassword } from '../../net/session';
import { useApp } from '../../state/store';
import { useUI } from '../../state/ui';
import { PixelIcon } from '../PixelIcon';
import { AvatarPreview } from '../AvatarPreview';

export default function AccountPanel() {
  const user = useNet((s) => s.user);
  const busy = useNet((s) => s.busy);
  const dms = useNet((s) => s.dms);
  const avatar = useApp((s) => s.avatar);
  const name = useApp((s) => s.name);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nm, setNm] = useState(name);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (user) {
    const unread = dms.filter((d) => d.recipientId === user.uid && !d.read).length;
    return (
      <Window title="Your account" icon="user" width="sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <AvatarPreview avatar={avatar} size={140} pixel={3} />
          <div>
            <div className="px-title">{name || user.name}</div>
            <div className="text-[12px] text-[var(--color-cocoa)]">{user.email}</div>
          </div>
          <p className="text-[12px]">☁️ Tickets, outfits, pets, decor & unlocks sync to the cloud. Others in your room can see you live.</p>
          <div className="flex gap-2">
            <button className="px-btn" onClick={() => useUI.getState().openPanel('messages')}><PixelIcon name="mail" size={16} />Messages{unread ? ` (${unread})` : ''}</button>
            <button className="px-btn" onClick={() => void signOutNow().then(() => useUI.getState().closePanel())}><PixelIcon name="logout" size={16} />Sign out</button>
          </div>
        </div>
      </Window>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const r = await signIn(mode === 'signin' ? 'email' : 'signup', email.trim(), pass, nm.trim());
    if (r) setErr(r);
    else useUI.getState().closePanel();
  };

  return (
    <Window title="Sign in" icon="user" width="sm" subtitle="Optional — the café works fully offline too.">
      <div className="flex flex-col gap-3">
        <ul className="text-[12px] flex flex-col gap-1">
          <li>👥 See & chat with real people in your room</li>
          <li>☁️ Sync tickets, outfits, pets and unlocks across devices</li>
          <li>✉️ Send direct messages and pin notes on the café board</li>
        </ul>
        <button className="px-btn w-full" disabled={busy} onClick={async () => { setErr(null); const r = await signIn('google'); if (r) setErr(r); else useUI.getState().closePanel(); }}>
          <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden><rect x="2" y="2" width="12" height="12" fill="#fff" /><rect x="2" y="2" width="6" height="6" fill="#ea4335" /><rect x="8" y="2" width="6" height="6" fill="#fbbc05" /><rect x="2" y="8" width="6" height="6" fill="#34a853" /><rect x="8" y="8" width="6" height="6" fill="#4285f4" /></svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-cocoa)]"><span className="flex-1 border-t-2 border-dashed border-[var(--color-paper-4)]" />or<span className="flex-1 border-t-2 border-dashed border-[var(--color-paper-4)]" /></div>
        <form className="flex flex-col gap-2" onSubmit={submit}>
          {mode === 'signup' && <input className="px-input" placeholder="Display name" value={nm} onChange={(e) => setNm(e.target.value)} maxLength={24} />}
          <input className="px-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className="px-input" type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          {err && <div className="text-[12px] text-[var(--color-tomato)]">{err}</div>}
          {info && <div className="text-[12px] text-[var(--color-leaf)]">{info}</div>}
          <button className="px-btn px-btn-primary" disabled={busy}>{busy ? 'One sec…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        <div className="flex justify-between text-[12px]">
          <button className="underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Create an account' : 'I have an account'}</button>
          {mode === 'signin' && <button className="underline" onClick={async () => { if (!email) { setErr('Type your email first.'); return; } const r = await resetPassword(email); setErr(r); if (!r) setInfo('Password reset email sent.'); }}>Forgot password?</button>}
        </div>
      </div>
    </Window>
  );
}
