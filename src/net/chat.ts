import { useApp, uid } from '../state/store';
import { useUI } from '../state/ui';
import { game } from '../engine/gameRef';
import { publishChat } from './session';

// Local chat: your message pops as a bubble over your avatar, goes to the
// room chat if you're signed in, and the café NPCs sometimes chime in.

const REPLIES: { match: RegExp; lines: string[] }[] = [
  { match: /\b(hi|hey|hello|yo|morning|evening)\b/i, lines: ['Hey! 👋', 'Hi hi! Good luck today ✨', 'Welcome in!', 'Hello, fellow focuser!'] },
  { match: /coffee|latte|matcha|tea|espresso/i, lines: ['The matcha here is unreal 🍵', 'Bea makes a mean mocha.', 'Coffee break? Count me in ☕'] },
  { match: /tired|sleepy|exhausted/i, lines: ['Hydrate + stretch, trust me 💧', 'One more pomodoro, then a real break!', 'Power nap on the sofa? 😴'] },
  { match: /done|finished|shipped|submitted/i, lines: ['Congrats!! 🎉', 'Huge! Treat yourself to a cocoa.', 'Let’s gooo 🙌'] },
  { match: /focus|work|study/i, lines: ['Same here — let’s do this.', 'Deep work buddies 🤝', 'Timer on, phone away 📵'] },
  { match: /\?$/, lines: ['Hmm, good question 🤔', 'Ask the study bot, it knows everything.', 'No idea, but I believe in you!'] },
];

export function sendChat(text: string) {
  const s = useApp.getState();
  const g = game();
  g?.say('me', text, 6000);
  const id = `local-${uid()}`;
  useUI.getState().pushChat({ id, from: s.name || 'You', fromId: 'me', text, at: Date.now() });
  void publishChat(text);

  // NPC banter (only regulars / bot / barista present in this room)
  const rule = REPLIES.find((r) => r.match.test(text));
  if (!g || !rule || Math.random() < 0.35) return;
  const candidates = [...g.actors.values()].filter((a) => a.kind === 'npc' || a.kind === 'bot' || (a.kind === 'barista' && /coffee|latte|matcha|tea|espresso/i.test(text)));
  if (!candidates.length) return;
  const npc = candidates[Math.floor(Math.random() * candidates.length)];
  const line = rule.lines[Math.floor(Math.random() * rule.lines.length)];
  setTimeout(() => {
    g.say(npc.id, line, 5000);
    useUI.getState().pushChat({ id: `npc-${uid()}`, from: npc.name, fromId: npc.id, text: line, at: Date.now() });
  }, 1200 + Math.random() * 1500);
}
