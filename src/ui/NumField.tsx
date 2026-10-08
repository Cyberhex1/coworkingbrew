import { useEffect, useState } from 'react';

/** Number input that lets you type freely and clamps on blur / Enter. */
export function NumField({ value, min, max, onCommit, className = '' }: { value: number; min: number; max: number; onCommit: (n: number) => void; className?: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Math.max(min, Math.min(max, Math.round(Number(text)) || min));
    setText(String(n));
    if (n !== value) onCommit(n);
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      className={`px-input w-[64px] py-0.5 text-[13px] ${className}`}
      min={min}
      max={max}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}
