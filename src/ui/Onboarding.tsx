import { useEffect, useState } from 'react';
import { useApp, defaultPetName } from '../state/store';
import { toast } from '../state/ui';
import { AvatarPreview } from './AvatarPreview';
import { AvatarEditor } from './AvatarEditor';
import { PixelIcon } from './PixelIcon';
import { audio } from '../audio/engine';
import { game } from '../engine/gameRef';
import type { PetKind } from '../engine/avatarTypes';
import { randomAvatar } from '../engine/npcs';

const LINES = [
  'Oh! A new face. Welcome to CoworkingBrew ☕ I’m Bea, I run the espresso bar.',
  'This café is for getting real work done — together. Grab a desk, start a focus timer, and we’ll keep the coffee coming.',
];

function useTypewriter(text: string, speed = 22) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return [text.slice(0, n), n >= text.length, () => setN(text.length)] as const;
}

export default function Onboarding() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(app.name);
  const [avatar, setAvatar] = useState(app.avatar);
  const [pet, setPet] = useState<PetKind>(app.pet === 'none' ? 'cat' : app.pet);

  const line =
    step < 2 ? LINES[step]
    : step === 2 ? 'First things first — what should we call you?'
    : step === 3 ? `Nice to meet you, ${name || 'friend'}! Let’s get you looking cozy.`
    : step === 4 ? 'Every regular brings a companion. Who’s keeping you company?'
    : 'Here’s how it works:';
  const [typed, done, skip] = useTypewriter(line);

  const next = () => {
    audio.unlock();
    audio.sfx('click');
    if (!done) { skip(); return; }
    if (step === 2 && !name.trim()) return;
    setStep((s) => s + 1);
  };

  const finish = () => {
    audio.unlock();
    audio.sfx('success');
    app.set({ name: name.trim().slice(0, 24), avatar, pet, petName: defaultPetName(pet), onboarded: true });
    setTimeout(() => {
      game()?.say('barista', `Enjoy your stay, ${name.trim()}! 💛`, 4500);
      game()?.wave();
      toast('Tip: click any free desk (or press G) to sit and start focusing', 'info');
    }, 400);
    try { if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission(); } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-2 sm:p-6 bg-[rgba(29,32,51,0.35)]">
      <div className="px-shadow w-full max-w-[760px] px-in">
        <div className="px-panel p-3 sm:p-4">
          {/* dialogue */}
          <div className="flex gap-3 items-start">
            <div className="shrink-0 hidden sm:block">
              <AvatarPreview avatar={BEA} size={96} pixel={3} bg="#e6cf9f" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="px-chip inline-block mb-1.5 bg-[var(--color-leaf-2)] text-white">Bea · barista</div>
              <p className="text-[16px] leading-snug min-h-[48px]" onClick={skip}>
                {typed}
                {!done && <span className="px-blink">▌</span>}
              </p>
            </div>
          </div>

          {/* step content */}
          {done && step === 2 && (
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); next(); }}>
              <input autoFocus className="px-input text-[16px]" maxLength={24} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="px-btn px-btn-primary" disabled={!name.trim()}>That’s me</button>
            </form>
          )}

          {done && step === 3 && (
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col items-center gap-2">
                <AvatarPreview avatar={avatar} size={170} pixel={3} />
                <button className="px-btn px-btn-sm" onClick={() => setAvatar({ ...randomAvatar(Math.floor(Math.random() * 1e6)), hat: 'none', glasses: 'none', extra: 'none' })}>
                  <PixelIcon name="sparkle" size={14} /> Surprise me
                </button>
              </div>
              <div className="flex-1 min-w-0 max-h-[300px] overflow-y-auto pr-1">
                <AvatarEditor value={avatar} onChange={setAvatar} unlocked={app.unlocked} compact />
              </div>
            </div>
          )}

          {done && step === 4 && (
            <div className="mt-3 flex flex-col sm:flex-row gap-3 items-center">
              <AvatarPreview avatar={avatar} pet={pet} size={170} pixel={3} />
              <div className="grid grid-cols-2 gap-2 flex-1">
                {(['cat', 'shiba', 'bunny', 'none'] as PetKind[]).map((p) => (
                  <button key={p} className="px-btn justify-start" data-active={pet === p} onClick={() => { audio.sfx('pop'); setPet(p); }}>
                    <PixelIcon name={p === 'none' ? 'close' : 'paw'} size={18} />
                    <span className="capitalize">{p === 'none' ? 'Just me' : `${p} · ${defaultPetName(p)}`}</span>
                  </button>
                ))}
                <p className="col-span-2 text-[12px] text-[var(--color-cocoa)]">More companions (duck, frog, ghost, capybara, dragon…) can be adopted with tickets later.</p>
              </div>
            </div>
          )}

          {done && step === 5 && (
            <div className="mt-3 grid sm:grid-cols-3 gap-2">
              {[
                ['desk', 'Sit at a desk', 'Click a free desk (or press G). Your desk opens BrewOS — timer, tasks, planner & journal.'],
                ['tomato', 'Focus together', 'Start a Pomodoro. Your avatar types away with a timer over its head for everyone to see.'],
                ['ticket', 'Earn tickets', 'Finished sessions, tasks & books earn tickets — spend them on drinks, outfits, pets & desk decor.'],
              ].map(([icon, title, body]) => (
                <div key={title} className="px-inset p-2.5">
                  <div className="flex items-center gap-2 font-semibold"><PixelIcon name={icon} size={22} />{title}</div>
                  <p className="text-[12px] mt-1 leading-snug">{body}</p>
                </div>
              ))}
              <div className="sm:col-span-3 text-[12px] text-[var(--color-cocoa)] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span><span className="px-kbd">WASD</span> / click to walk</span>
                <span><span className="px-kbd">E</span> interact</span>
                <span><span className="px-kbd">Q</span><span className="px-kbd ml-0.5">R</span> rotate view</span>
                <span><span className="px-kbd">F</span> focus timer</span>
                <span><span className="px-kbd">↵</span> chat</span>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={`w-2 h-2 border border-[var(--color-ink)] ${i <= step ? 'bg-[var(--color-terra)]' : ''}`} />)}
            </div>
            {step === 5 ? (
              <button className="px-btn px-btn-primary" onClick={finish}>Let’s brew ☕</button>
            ) : step !== 2 ? (
              <button className="px-btn" onClick={next}>{done ? 'Next ▸' : 'Skip ▸▸'}</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const BEA = {
  ...randomAvatar(42),
  top: 'apron' as const,
  topColor: '#3f7d4a',
  hat: 'cap' as const,
  hatColor: '#3f7d4a',
  hair: 'ponytail' as const,
  hairColor: '#7a4a2a',
  glasses: 'none' as const,
  extra: 'none' as const,
};
