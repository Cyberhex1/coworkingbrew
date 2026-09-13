import React, { useState } from 'react';
import { BookOpen, ExternalLink, X, Search, Bookmark, Sparkles, Check, ChevronLeft, ChevronRight, Type, Palette } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

export interface GutenbergBook {
  id: number;
  title: string;
  author: string;
  year: string;
  downloads: string;
  coverColor: string;
  accentColor: string;
  category: string;
  description: string;
  chapterOneTitle: string;
  chapterOneExcerpt: string[];
}

export const GUTENBERG_POPULAR_BOOKS: GutenbergBook[] = [
  {
    id: 84,
    title: 'Frankenstein',
    author: 'Mary Wollstonecraft Shelley',
    year: '1818',
    downloads: '120k+ downloads',
    coverColor: '#1e293b',
    accentColor: '#10b981',
    category: 'Gothic Horror / Sci-Fi',
    description: 'A brilliant scientist unleashes life from lightning, confronting the deepest moral mysteries of creation and isolation.',
    chapterOneTitle: 'Letter 1 & Chapter 1: To Mrs. Saville, England',
    chapterOneExcerpt: [
      'St. Petersburgh, Dec. 11th, 17—',
      'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.',
      'I am already far north of London, and as I walk in the streets of Petersburgh, I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight. Do you understand this feeling? This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes.',
      'Inspirited by this wind of promise, my daydreams become more fervent and vivid. I try in vain to be persuaded that the pole is the seat of frost and desolation; it ever presents itself to my imagination as the region of beauty and delight.',
      'There, Margaret, the sun is for ever visible, its broad disk just skirting the horizon and diffusing a perpetual splendour. There—for with your leave, my sister, I will put some trust in preceding navigators—there snow and frost are banished; and, sailing over a calm sea, we may be wafted to a land surpassing in wonders and in beauty every region hitherto discovered on the habitable globe.'
    ]
  },
  {
    id: 1342,
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: '1813',
    downloads: '95k+ downloads',
    coverColor: '#831843',
    accentColor: '#f472b6',
    category: 'Classic Romance / Satire',
    description: 'The sharp-witted Elizabeth Bennet clashes with the proud Mr. Darcy in a timeless exploration of manners, society, and love.',
    chapterOneTitle: 'Chapter 1: A Truth Universally Acknowledged',
    chapterOneExcerpt: [
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
      'However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
      '“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”',
      'Mr. Bennet replied that he had not.',
      '“But it is,” returned she; “for Mrs. Long has just been here, and she told me all about it.”',
      'Mr. Bennet made no answer.',
      '“Do you not want to know who has taken it?” cried his wife impatiently.',
      '“You want to tell me, and I have no objection to hearing it.” This was invitation enough.'
    ]
  },
  {
    id: 11,
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    year: '1865',
    downloads: '80k+ downloads',
    coverColor: '#0369a1',
    accentColor: '#38bdf8',
    category: 'Fantasy / Absurdist Fiction',
    description: 'Tumbling down a rabbit hole, curious Alice encounters a whimsical wonderland of tea parties, talking rabbits, and the Queen of Hearts.',
    chapterOneTitle: 'Chapter 1: Down the Rabbit-Hole',
    chapterOneExcerpt: [
      'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”',
      'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
      'There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!”',
      'When the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, burning with curiosity!'
    ]
  },
  {
    id: 64317,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: '1925',
    downloads: '90k+ downloads',
    coverColor: '#1e1b4b',
    accentColor: '#facc15',
    category: 'Modernist Fiction / Jazz Age',
    description: 'Jay Gatsby’s lavish Long Island parties conceal an obsessive dream across the bay in the roaring twenties.',
    chapterOneTitle: 'Chapter 1: Reserving All Judgments',
    chapterOneExcerpt: [
      'In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.',
      '“Whenever you feel like criticizing any one,” he told me, “just remember that all the people in this world haven’t had the advantages that you’ve had.”',
      'He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.',
      'When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention for ever; I wanted no more riotous excursions with privileged glimpses into the human heart. Only Gatsby, the man who gives his name to this book, was exempt from my reaction.'
    ]
  },
  {
    id: 1661,
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    year: '1892',
    downloads: '75k+ downloads',
    coverColor: '#374151',
    accentColor: '#fb923c',
    category: 'Mystery / Detective',
    description: 'Dr. John Watson documents the ingenious deductive exploits of consulting detective Sherlock Holmes at 221B Baker Street.',
    chapterOneTitle: 'I. A Scandal in Bohemia',
    chapterOneExcerpt: [
      'To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex.',
      'It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen.',
      'One night—it was on the twentieth of March, 1888—I was returning from a journey to a patient, when my way led me through Baker Street. As I passed the well-remembered door, I was seized with a keen desire to see Holmes again, and to know how he was employing his extraordinary powers.'
    ]
  },
  {
    id: 2701,
    title: 'Moby-Dick; or, The Whale',
    author: 'Herman Melville',
    year: '1851',
    downloads: '65k+ downloads',
    coverColor: '#0f172a',
    accentColor: '#38bdf8',
    category: 'Adventure / Epic Drama',
    description: 'Ishmael boards the doomed whaler Pequod under Captain Ahab, whose singular obsession is hunting the legendary white whale.',
    chapterOneTitle: 'Chapter 1: Loomings',
    chapterOneExcerpt: [
      'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.',
      'It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can.',
      'This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship.'
    ]
  },
  {
    id: 345,
    title: 'Dracula',
    author: 'Bram Stoker',
    year: '1897',
    downloads: '70k+ downloads',
    coverColor: '#450a0a',
    accentColor: '#ef4444',
    category: 'Vampire Gothic Fiction',
    description: 'Solicitor Jonathan Harker travels into the Carpathian Mountains to Castle Dracula, unknowingly sparking an undead siege on London.',
    chapterOneTitle: 'Chapter 1: Jonathan Harker’s Journal',
    chapterOneExcerpt: [
      '3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late.',
      'Buda-Pesth seems a wonderful place, from the glimpse which I got of it from the train and the little I could walk through the streets. I feared to go very far from the station, as we had arrived late and would start as near the correct time as possible.',
      'The impression I had was that we were leaving the West and entering the East; the most western of splendid bridges over the Danube, which is here of noble width and depth, took us among the traditions of Turkish rule.',
      'We left in pretty good time, and came after nightfall to Klausenburgh. Here I stopped for the night at the Hotel Royale. I had for dinner, or rather supper, a chicken done up some way with red pepper, which was very good but thirsty. (Mem., get recipe for Mina.)'
    ]
  },
  {
    id: 98,
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    year: '1859',
    downloads: '60k+ downloads',
    coverColor: '#1c1917',
    accentColor: '#eab308',
    category: 'Historical Fiction',
    description: 'London and Paris in the throes of the French Revolution, intertwined through love, sacrifice, and the shadow of the guillotine.',
    chapterOneTitle: 'Chapter 1: The Period',
    chapterOneExcerpt: [
      'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness, it was the spring of hope, it was the winter of despair.',
      'We had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way—in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.',
      'There were a king with a large jaw and a queen with a plain face, on the throne of England; there were a king with a large jaw and a queen with a fair face, on the throne of France.'
    ]
  },
  {
    id: 174,
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    year: '1890',
    downloads: '68k+ downloads',
    coverColor: '#312e81',
    accentColor: '#a855f7',
    category: 'Philosophical Fiction / Aestheticism',
    description: 'A handsome young man retains eternal youthful beauty while his hidden portrait bears the horrific toll of his sins and hedonism.',
    chapterOneTitle: 'The Preface & Chapter 1',
    chapterOneExcerpt: [
      'The artist is the creator of beautiful things. To reveal art and conceal the artist is art’s aim. The critic is he who can translate into another manner or a new material his impression of beautiful things.',
      'The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.',
      'In the centre of the room, clamped to an upright easel, stood the full-length portrait of a young man of extraordinary personal beauty, and in front of it, some little distance away, was sitting the artist himself, Basil Hallward.'
    ]
  },
  {
    id: 5200,
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    year: '1915',
    downloads: '58k+ downloads',
    coverColor: '#292524',
    accentColor: '#84cc16',
    category: 'Existential Absurdism',
    description: 'Gregor Samsa wakes up one morning transformed into a monstrous insect, examining human alienation and familial responsibility.',
    chapterOneTitle: 'Chapter 1: The Transformation',
    chapterOneExcerpt: [
      'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.',
      'He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved helplessly about as he looked.',
      '“What’s happened to me?” he thought. It wasn’t a dream. His room, a proper human room although a little too small, lay peacefully between its four familiar walls.',
      'Gregor then turned to look out the window at the dull weather. Drops of rain could be heard hitting the pane, which made him feel quite sad. “How about if I sleep a little bit longer and forget all this nonsense,” he thought, but that was something he was unable to do.'
    ]
  },
  {
    id: 35,
    title: 'The Time Machine',
    author: 'H. G. Wells',
    year: '1895',
    downloads: '55k+ downloads',
    coverColor: '#172554',
    accentColor: '#60a5fa',
    category: 'Science Fiction Pioneer',
    description: 'An English scientist invents a machine that hurls him into the year A.D. 802,701, meeting the gentle Eloi and underground Morlocks.',
    chapterOneTitle: 'Chapter 1: The Fourth Dimension',
    chapterOneExcerpt: [
      'The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.',
      'The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.',
      '“You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception.”',
      '“Is not that rather a large thing to expect us to begin upon?” said Filby, an argumentative person with red hair.',
      '“I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. Nor has a mathematical plane. These things are mere abstractions.”'
    ]
  },
  {
    id: 514,
    title: 'Little Women',
    author: 'Louisa May Alcott',
    year: '1868',
    downloads: '52k+ downloads',
    coverColor: '#701a75',
    accentColor: '#f472b6',
    category: 'Coming-of-Age / Classic',
    description: 'The heartwarming trials, aspirations, and deep sisterhood of Meg, Jo, Beth, and Amy March growing up in Civil War-era New England.',
    chapterOneTitle: 'Chapter 1: Playing Pilgrims',
    chapterOneExcerpt: [
      '“Christmas won’t be Christmas without any presents,” grumbled Jo, lying on the rug.',
      '“It’s so dreadful to be poor!” sighed Meg, looking down at her old dress.',
      '“I don’t think it’s fair for some girls to have plenty of pretty things, and other girls nothing at all,” added little Amy, with an injured sniff.',
      '“We’ve got Father and Mother, and each other,” said Beth contentedly from her corner.',
      'The four young faces on which the firelight shone brightened at the cheerful words, but darkened again as Jo said sadly, “We haven’t got Father, and shall not have him for a long time.” She didn’t say “perhaps never,” but each silently added it, thinking of Father far away, where the fighting was.'
    ]
  }
];

interface BookshelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEarnTickets?: (amount: number) => void;
}

export const BookshelfModal: React.FC<BookshelfModalProps> = ({
  isOpen,
  onClose,
  onEarnTickets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<GutenbergBook | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [finishedBonusClaimed, setFinishedBonusClaimed] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const filteredBooks = GUTENBERG_POPULAR_BOOKS.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClaimFinishedChapter = (bookId: number) => {
    if (finishedBonusClaimed[bookId]) return;
    setFinishedBonusClaimed((prev) => ({ ...prev, [bookId]: true }));
    soundEngine.playCoin();
    confetti({ particleCount: 30, spread: 50 });
    if (onEarnTickets) onEarnTickets(10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl bg-[#141221] border-2 border-purple-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden text-purple-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950/90 via-[#1b152d] to-[#120e22] p-5 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-purple-950/50">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cozy font-bold text-lg text-white">Project Gutenberg Library</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold font-mono">
                  Free Public Domain Classics
                </span>
              </div>
              <p className="text-xs text-purple-300">
                Browse, study, and read online in your cozy co-working break
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Link to Gutenberg.org as requested */}
            <a
              href="https://www.gutenberg.org/ebooks"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-600/50 rounded-xl text-xs font-cozy text-purple-200 hover:text-white transition-all shadow-sm"
              title="Open Project Gutenberg Catalog"
            >
              <span>Visit gutenberg.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-700/40 text-purple-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader View vs Book Grid */}
        {selectedBook ? (
          /* In-App Distraction-Free Reader */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Reader Toolbar */}
            <div className="bg-[#1a152e] border-b border-purple-800/40 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => setSelectedBook(null)}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg transition-all font-cozy"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Library</span>
              </button>

              <div className="flex items-center gap-2 font-cozy">
                <span className="font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
                  {selectedBook.title}
                </span>
                <span className="text-purple-400">by {selectedBook.author}</span>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center gap-2">
                {/* Theme Selector */}
                <div className="flex items-center gap-1 bg-purple-950 p-0.5 rounded-lg border border-purple-800/50">
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`px-2 py-0.5 rounded text-[11px] font-cozy ${readerTheme === 'dark' ? 'bg-purple-600 text-white' : 'text-purple-300'}`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`px-2 py-0.5 rounded text-[11px] font-cozy ${readerTheme === 'sepia' ? 'bg-amber-700 text-white' : 'text-purple-300'}`}
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`px-2 py-0.5 rounded text-[11px] font-cozy ${readerTheme === 'light' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-purple-300'}`}
                  >
                    Paper
                  </button>
                </div>

                {/* Font Size */}
                <div className="flex items-center gap-1 bg-purple-950 p-0.5 rounded-lg border border-purple-800/50 text-[11px]">
                  <button
                    onClick={() => setReaderFontSize('sm')}
                    className={`px-1.5 py-0.5 rounded ${readerFontSize === 'sm' ? 'bg-purple-600 text-white' : 'text-purple-300'}`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setReaderFontSize('base')}
                    className={`px-1.5 py-0.5 rounded ${readerFontSize === 'base' ? 'bg-purple-600 text-white' : 'text-purple-300'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setReaderFontSize('lg')}
                    className={`px-1.5 py-0.5 rounded ${readerFontSize === 'lg' ? 'bg-purple-600 text-white' : 'text-purple-300'}`}
                  >
                    A+
                  </button>
                </div>

                {/* External Full Book on Gutenberg */}
                <a
                  href={`https://www.gutenberg.org/ebooks/${selectedBook.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/80 hover:bg-amber-500 text-white rounded-lg transition-all text-xs font-cozy font-semibold"
                  title="Read complete book or download epub on Gutenberg"
                >
                  <span>Full Book</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Reader Text Area */}
            <div
              className={`flex-1 overflow-y-auto p-6 sm:p-10 transition-colors ${
                readerTheme === 'dark'
                  ? 'bg-[#100d1c] text-[#e2dcf2]'
                  : readerTheme === 'sepia'
                  ? 'bg-[#f4ecd8] text-[#422e1b]'
                  : 'bg-[#fafafa] text-[#1e293b]'
              }`}
            >
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="border-b pb-4 text-center">
                  <span className="text-xs font-mono uppercase tracking-widest opacity-60">
                    Project Gutenberg EBook #{selectedBook.id}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold mt-1">
                    {selectedBook.title}
                  </h1>
                  <p className="text-sm font-serif italic mt-1 opacity-80">
                    By {selectedBook.author} ({selectedBook.year})
                  </p>
                  <div className="mt-3 text-xs font-cozy font-semibold py-1 px-3 rounded-full inline-block bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedBook.chapterOneTitle}
                  </div>
                </div>

                <div
                  className={`font-serif leading-relaxed space-y-4 ${
                    readerFontSize === 'sm'
                      ? 'text-sm'
                      : readerFontSize === 'lg'
                      ? 'text-lg sm:text-xl'
                      : 'text-base sm:text-lg'
                  }`}
                >
                  {selectedBook.chapterOneExcerpt.map((para, pIdx) => (
                    <p key={pIdx} className="indent-6 text-justify">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Reader Finished Milestone */}
                <div className="pt-8 border-t border-purple-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-cozy font-bold text-sm">Completed this chapter preview?</h4>
                    <p className="text-xs opacity-75">Log your reading time and claim tickets!</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClaimFinishedChapter(selectedBook.id)}
                      disabled={finishedBonusClaimed[selectedBook.id]}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-cozy font-bold shadow-md transition-all ${
                        finishedBonusClaimed[selectedBook.id]
                          ? 'bg-emerald-700/60 text-emerald-200 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{finishedBonusClaimed[selectedBook.id] ? 'Claimed (+10🎟️)' : 'Log Reading (+10🎟️)'}</span>
                    </button>

                    <a
                      href={`https://www.gutenberg.org/ebooks/${selectedBook.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-cozy font-bold shadow-md"
                    >
                      <span>Continue on Gutenberg</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Book Catalog Grid */
          <div className="flex-1 flex flex-col p-5 overflow-hidden">
            {/* Search Bar & Stats */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors, or genres..."
                  className="w-full bg-purple-950/60 border border-purple-700/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-hidden font-cozy"
                />
              </div>

              <div className="text-xs font-cozy text-purple-300 hidden sm:block">
                Showing <strong className="text-white">{filteredBooks.length}</strong> Popular Public Domain Books
              </div>
            </div>

            {/* 12 Books Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-[#1b172e] border border-purple-800/40 hover:border-purple-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all hover:scale-[1.02] group"
                  >
                    <div>
                      {/* Book Cover Aesthetic */}
                      <div
                        style={{ backgroundColor: book.coverColor }}
                        className="w-full h-36 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-inner border border-white/10 mb-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                            #{book.id}
                          </span>
                          <span className="text-[10px] bg-black/40 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                            {book.downloads}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif font-bold text-white text-base sm:text-lg leading-tight line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-xs font-serif text-white/80 mt-0.5">{book.author}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-white/60">
                          <span>{book.category}</span>
                          <span>{book.year}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-purple-300/90 font-cozy line-clamp-2 mb-3">
                        {book.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-purple-900/50">
                      <button
                        onClick={() => {
                          soundEngine.playChime('chime');
                          setSelectedBook(book);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-cozy font-bold text-white shadow-md transition-all active:scale-95"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Online</span>
                      </button>

                      <a
                        href={`https://www.gutenberg.org/ebooks/${book.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 rounded-xl text-purple-300 hover:text-white transition-all"
                        title="View on Gutenberg.org"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
