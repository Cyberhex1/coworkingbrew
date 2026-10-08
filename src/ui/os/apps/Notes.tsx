import { useEffect, useState } from 'react';
import { useApp } from '../../../state/store';

export default function NotesApp() {
  const notes = useApp((s) => s.notes);
  const [text, setText] = useState(notes);
  useEffect(() => {
    const id = setTimeout(() => { if (text !== useApp.getState().notes) useApp.getState().set({ notes: text }); }, 500);
    return () => clearTimeout(id);
  }, [text]);
  return (
    <div className="h-full flex flex-col bg-[#1d2a24] scanlines relative">
      <textarea
        className="flex-1 w-full resize-none bg-transparent text-[#8fe3c4] p-3 outline-none text-[20px] leading-[1.1] font-[var(--font-term)]"
        style={{ fontFamily: 'var(--font-term)' }}
        value={text}
        spellCheck={false}
        placeholder={'> scratchpad.txt\n> jot ideas, links, todos...'}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="text-[#3c8a78] text-[14px] px-3 pb-1" style={{ fontFamily: 'var(--font-term)' }}>{text.length} chars · autosaved</div>
    </div>
  );
}
