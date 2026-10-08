import { useEffect, useRef } from 'react';
import { Game } from './engine/Game';
import { DEFAULT_AVATAR } from './engine/avatarTypes';
import type { ThemeId } from './engine/themes';

export default function DevWorld() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const g = new Game(ref.current!);
    const q = new URLSearchParams(location.search);
    g.loadRoom((q.get('room') as ThemeId) || 'cafe');
    g.setPlayer({ name: 'Keo', avatar: { ...DEFAULT_AVATAR, hat: 'beanie' }, pet: 'cat', deskIndex: 3 });
    if (q.get('zoom')) g.setZoom(Number(q.get('zoom')));
    if (q.get('rot')) for (let i = 0; i < Number(q.get('rot')); i++) g.rotate(1);
    if (q.get('desk')) g.goToDesk(3);
    (window as any).game = g;
    g.start();
    return () => g.dispose();
  }, []);
  return <div ref={ref} className="cb-world" />;
}
