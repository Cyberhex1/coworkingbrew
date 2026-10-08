import { Fragment, useEffect, useState } from 'react';
import { Window } from '../Window';
import { useApp } from '../../state/store';
import { game } from '../../engine/gameRef';
import type { Genre } from '../../data/books';
import { Shelf } from './library/Shelf';
import { MyBooks } from './library/MyBooks';
import { Reader } from './library/Reader';
import { startReading, type ShelfBook } from './library/common';

type Tab = 'shelf' | 'mine' | 'reader';

/** The café library wall: browse classics, track your shelf, and read in place. */
export default function LibraryPanel() {
  const count = useApp((s) => s.library.length);
  const [tab, setTab] = useState<Tab>('shelf');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | 'All'>('All');
  const [detail, setDetail] = useState<ShelfBook | null>(null);
  const [reading, setReading] = useState<ShelfBook | null>(null);

  // A book in the avatar's hand while one is open in the reader.
  useEffect(() => {
    if (!reading) return;
    game()?.setHeld('book');
    return () => {
      game()?.setHeld(null);
    };
  }, [reading]);

  const read = (b: ShelfBook) => {
    startReading(b);
    setReading(b);
    setTab('reader');
  };

  const tabs = [
    { id: 'shelf', label: 'Browse', icon: 'book' },
    { id: 'mine', label: count ? `My books (${count})` : 'My books', icon: 'heart' },
    ...(reading ? [{ id: 'reader', label: 'Reader', icon: 'notes' }] : []),
  ];

  return (
    <Window
      title="Library Wall"
      icon="book"
      subtitle="Public-domain classics, free to read with your coffee"
      width="lg"
      tabs={tabs}
      tab={tab}
      onTab={(id) => setTab(id as Tab)}
    >
      {tab === 'shelf' && (
        <Shelf query={query} setQuery={setQuery} genre={genre} setGenre={setGenre} detail={detail} setDetail={setDetail} onRead={read} />
      )}
      {tab === 'mine' && <MyBooks onRead={read} onBrowse={() => setTab('shelf')} />}
      {tab === 'reader' && reading && (
        <Fragment key={reading.id}>
          <Reader
            book={reading}
            onBack={() => {
              setReading(null);
              setTab('mine');
            }}
          />
        </Fragment>
      )}
    </Window>
  );
}
