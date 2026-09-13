import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ExternalLink,
  X,
  Search,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Check,
  ChevronLeft,
  Type,
  Palette,
  StickyNote,
  Library,
  BookMarked,
  MessageSquarePlus,
  Send,
  User as UserIcon,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  saveBookToBookshelf,
  loadUserBookshelf,
  removeBookFromBookshelf,
  addCafeSharedNote,
  db,
  FirebaseBookshelfBook,
  FirebaseCafeNote,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';

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
  currentUser: User | null;
  onOpenAuth?: () => void;
}

export const BookshelfModal: React.FC<BookshelfModalProps> = ({
  isOpen,
  onClose,
  onEarnTickets,
  currentUser,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_shelf' | 'community'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<GutenbergBook | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  // Personal Bookshelf state
  const [savedBooks, setSavedBooks] = useState<Record<number, FirebaseBookshelfBook>>(() => {
    const local = localStorage.getItem('ontogether_saved_books');
    return local ? JSON.parse(local) : {};
  });

  // Active Reader note editing
  const [currentBookNote, setCurrentBookNote] = useState('');
  const [currentBookStatus, setCurrentBookStatus] = useState<'want_to_read' | 'reading' | 'completed'>('reading');

  // Community sticky notes
  const [communityNotes, setCommunityNotes] = useState<FirebaseCafeNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('Recommendation');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Load user's books from Firestore if logged in
  useEffect(() => {
    if (!currentUser) return;
    const fetchBooks = async () => {
      try {
        const books = await loadUserBookshelf(currentUser.uid);
        const map: Record<number, FirebaseBookshelfBook> = {};
        books.forEach((b) => {
          map[b.bookId] = b;
        });
        setSavedBooks(map);
        localStorage.setItem('ontogether_saved_books', JSON.stringify(map));
      } catch (err) {
        console.warn('Could not load Firestore books:', err);
      }
    };
    fetchBooks();
  }, [currentUser]);

  // Subscribe to community cafe notes from Firestore
  useEffect(() => {
    if (!isOpen) return;
    const notesCol = collection(db, 'cafe_notes');
    const unsub = onSnapshot(
      notesCol,
      (snapshot) => {
        const notes = snapshot.docs.map((d) => d.data() as FirebaseCafeNote);
        notes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCommunityNotes(notes);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'cafe_notes');
      }
    );
    return () => unsub();
  }, [isOpen]);

  // Sync reader state when book selected
  useEffect(() => {
    if (selectedBook) {
      const existing = savedBooks[selectedBook.id];
      if (existing) {
        setCurrentBookNote(existing.notes || '');
        setCurrentBookStatus(existing.status);
      } else {
        setCurrentBookNote('');
        setCurrentBookStatus('reading');
      }
    }
  }, [selectedBook, savedBooks]);

  if (!isOpen) return null;

  const filteredBooks = GUTENBERG_POPULAR_BOOKS.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myShelfBooks = GUTENBERG_POPULAR_BOOKS.filter((b) => savedBooks[b.id]);

  const handleSaveToShelf = async (book: GutenbergBook, status: 'want_to_read' | 'reading' | 'completed', notes = '') => {
    const entry: FirebaseBookshelfBook = {
      userId: currentUser?.uid || 'guest-user',
      bookId: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      status,
      notes,
      claimedBonus: savedBooks[book.id]?.claimedBonus || false,
    };

    const updated = { ...savedBooks, [book.id]: entry };
    setSavedBooks(updated);
    localStorage.setItem('ontogether_saved_books', JSON.stringify(updated));
    soundEngine.playCoin();

    if (currentUser) {
      try {
        await saveBookToBookshelf(entry);
      } catch (err) {
        console.error('Failed to sync book to Firestore:', err);
      }
    }
  };

  const handleRemoveFromShelf = async (bookId: number) => {
    const updated = { ...savedBooks };
    delete updated[bookId];
    setSavedBooks(updated);
    localStorage.setItem('ontogether_saved_books', JSON.stringify(updated));
    soundEngine.playChime('chime');

    if (currentUser) {
      try {
        await removeBookFromBookshelf(currentUser.uid, bookId);
      } catch (err) {
        console.error('Failed to remove book from Firestore:', err);
      }
    }
  };

  const handleClaimFinishedChapter = async (bookId: number) => {
    const existing = savedBooks[bookId];
    if (existing?.claimedBonus) return;

    soundEngine.playCoin();
    confetti({ particleCount: 35, spread: 60 });
    if (onEarnTickets) onEarnTickets(10);

    const targetBook = GUTENBERG_POPULAR_BOOKS.find((b) => b.id === bookId);
    if (!targetBook) return;

    const entry: FirebaseBookshelfBook = {
      userId: currentUser?.uid || 'guest-user',
      bookId,
      title: targetBook.title,
      author: targetBook.author,
      category: targetBook.category,
      status: 'completed',
      notes: currentBookNote,
      claimedBonus: true,
    };

    const updated = { ...savedBooks, [bookId]: entry };
    setSavedBooks(updated);
    localStorage.setItem('ontogether_saved_books', JSON.stringify(updated));

    if (currentUser) {
      try {
        await saveBookToBookshelf(entry);
      } catch (err) {
        console.error('Failed to sync finished book:', err);
      }
    }
  };

  const handlePostCommunityNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      await addCafeSharedNote({
        userId: currentUser?.uid || 'coworker',
        authorName: currentUser?.displayName || 'Cozy Reader',
        text: newNoteText.trim(),
        category: newNoteCategory,
      });
      setNewNoteText('');
      soundEngine.playCoin();
      confetti({ particleCount: 20, spread: 45 });
    } catch (err) {
      console.error('Failed to post cafe note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl bg-[#141221] border-2 border-purple-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden text-purple-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950/90 via-[#1b152d] to-[#120e22] p-5 border-b border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-purple-950/50">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cozy font-bold text-lg text-white">Gutenberg Bookshelf & Cafe Library</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold font-mono">
                  Cloud Synced
                </span>
              </div>
              <p className="text-xs text-purple-300">
                Browse public domain classics, bookmark favorite reads, and share cafe recommendations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Status / Login button */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 border border-purple-600/40 rounded-xl text-xs text-purple-200">
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[11px] truncate max-w-[120px]">{currentUser.displayName || currentUser.email}</span>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white rounded-xl text-xs font-cozy border border-purple-700/50 transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In to Sync</span>
              </button>
            )}

            {/* Direct Link to Gutenberg.org */}
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

        {/* Navigation Tabs (when not inside reader) */}
        {!selectedBook && (
          <div className="px-5 pt-3 bg-[#171328] border-b border-purple-800/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-cozy font-bold border-b-2 transition-all ${
                  activeTab === 'catalog'
                    ? 'border-purple-400 text-white bg-purple-900/40'
                    : 'border-transparent text-purple-400 hover:text-purple-200'
                }`}
              >
                <Library className="w-4 h-4" />
                <span>Classics Catalog ({GUTENBERG_POPULAR_BOOKS.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('my_shelf')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-cozy font-bold border-b-2 transition-all ${
                  activeTab === 'my_shelf'
                    ? 'border-amber-400 text-amber-200 bg-amber-950/30'
                    : 'border-transparent text-purple-400 hover:text-purple-200'
                }`}
              >
                <BookMarked className="w-4 h-4 text-amber-400" />
                <span>My Bookshelf ({myShelfBooks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('community')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-cozy font-bold border-b-2 transition-all ${
                  activeTab === 'community'
                    ? 'border-cyan-400 text-cyan-200 bg-cyan-950/30'
                    : 'border-transparent text-purple-400 hover:text-purple-200'
                }`}
              >
                <StickyNote className="w-4 h-4 text-cyan-400" />
                <span>Cafe Book Board</span>
              </button>
            </div>

            {/* Search Input for catalog/my_shelf */}
            {activeTab !== 'community' && (
              <div className="relative mb-2 sm:mb-0">
                <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search titles, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-purple-950/80 border border-purple-700/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-purple-200 placeholder:text-purple-500 focus:outline-none focus:border-purple-400 w-52 sm:w-64"
                />
              </div>
            )}
          </div>
        )}

        {/* Reader View vs Main Tabs */}
        {selectedBook ? (
          /* In-App Distraction-Free Reader */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Reader Toolbar */}
            <div className="bg-[#1a152e] border-b border-purple-800/40 px-5 py-2.5 flex items-center justify-between gap-3 text-xs flex-wrap">
              <button
                onClick={() => setSelectedBook(null)}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg transition-all font-cozy"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Library</span>
              </button>

              <div className="flex items-center gap-2 font-cozy">
                <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                  {selectedBook.title}
                </span>
                <span className="text-purple-400 text-[11px]">by {selectedBook.author}</span>
              </div>

              {/* Reader Controls & Shelf Status */}
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
                    className={`px-2 py-0.5 rounded text-[11px] font-cozy ${readerTheme === 'sepia' ? 'bg-[#e2d7b5] text-[#3d321d] font-bold' : 'text-purple-300'}`}
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

                {/* Font Size Toggle */}
                <div className="flex items-center gap-1 bg-purple-950 p-0.5 rounded-lg border border-purple-800/50">
                  {(['sm', 'base', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setReaderFontSize(sz)}
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${readerFontSize === sz ? 'bg-purple-600 text-white' : 'text-purple-400'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Save / Status Button */}
                <button
                  onClick={() => handleSaveToShelf(selectedBook, currentBookStatus, currentBookNote)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-cozy font-semibold shadow transition-all active:scale-95"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{savedBooks[selectedBook.id] ? 'Saved to Shelf' : 'Add to Shelf'}</span>
                </button>
              </div>
            </div>

            {/* Reader Content Body */}
            <div
              className={`flex-1 overflow-y-auto p-6 sm:p-10 transition-colors ${
                readerTheme === 'dark'
                  ? 'bg-[#120f1f] text-slate-200'
                  : readerTheme === 'sepia'
                  ? 'bg-[#f4ecd8] text-[#3a2e1d]'
                  : 'bg-[#faf8f5] text-slate-800'
              }`}
            >
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Book Title & Meta */}
                <div className="border-b pb-4 text-center border-current/20">
                  <span className="text-[11px] font-mono tracking-wider opacity-70 uppercase">
                    Project Gutenberg EBook #{selectedBook.id}
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
                    {selectedBook.title}
                  </h1>
                  <p className="font-serif italic text-sm mt-1 opacity-80">
                    by {selectedBook.author} ({selectedBook.year})
                  </p>
                </div>

                {/* Chapter Title */}
                <div className="text-center pt-2">
                  <h2 className="font-serif font-bold text-lg text-amber-500/90 tracking-wide">
                    {selectedBook.chapterOneTitle}
                  </h2>
                </div>

                {/* Excerpt Paragraphs */}
                <div
                  className={`space-y-4 font-serif leading-relaxed tracking-normal select-text ${
                    readerFontSize === 'sm' ? 'text-sm' : readerFontSize === 'lg' ? 'text-lg' : 'text-base'
                  }`}
                >
                  {selectedBook.chapterOneExcerpt.map((para, i) => (
                    <p key={i} className="indent-6 text-justify">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Reader Study Notes & Reading Status */}
                <div className="mt-8 p-4 rounded-2xl bg-black/10 border border-current/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-cozy font-bold">
                      <StickyNote className="w-4 h-4 text-amber-500" />
                      <span>My Study Notes & Quotes (Cloud Synced)</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      {(['want_to_read', 'reading', 'completed'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            setCurrentBookStatus(st);
                            handleSaveToShelf(selectedBook, st, currentBookNote);
                          }}
                          className={`px-2 py-0.5 rounded-full capitalize font-cozy text-[10px] transition-all ${
                            currentBookStatus === st
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-black/20 text-current/70 hover:text-current'
                          }`}
                        >
                          {st.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Jot down quotes, vocabulary, or thoughts from this chapter..."
                    value={currentBookNote}
                    onChange={(e) => setCurrentBookNote(e.target.value)}
                    onBlur={() => handleSaveToShelf(selectedBook, currentBookStatus, currentBookNote)}
                    className="w-full bg-black/10 border border-current/20 rounded-xl p-2.5 text-xs focus:outline-none focus:border-purple-500 text-current placeholder:opacity-50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveToShelf(selectedBook, currentBookStatus, currentBookNote)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-cozy font-bold shadow active:scale-95"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>

                {/* Chapter Completion Reward & Gutenberg Download Link */}
                <div className="pt-6 border-t border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-xs opacity-70 font-cozy">
                      Finished reading this sample excerpt? Claim your study tickets!
                    </p>
                    <button
                      onClick={() => handleClaimFinishedChapter(selectedBook.id)}
                      disabled={savedBooks[selectedBook.id]?.claimedBonus}
                      className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-cozy font-bold transition-all shadow ${
                        savedBooks[selectedBook.id]?.claimedBonus
                          ? 'bg-emerald-800/50 text-emerald-200 border border-emerald-500/40 cursor-default'
                          : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white active:scale-95'
                      }`}
                    >
                      {savedBooks[selectedBook.id]?.claimedBonus ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>+10 Tickets Claimed 🎉</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-200" />
                          <span>Claim +10 Study Tickets</span>
                        </>
                      )}
                    </button>
                  </div>

                  <a
                    href={`https://www.gutenberg.org/ebooks/${selectedBook.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-cozy font-bold transition-all shadow"
                  >
                    <span>Read Full Book on Gutenberg.org</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Library Views */
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB 1: ALL CLASSICS CATALOG */}
            {activeTab === 'catalog' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-purple-300">
                    Showing {filteredBooks.length} featured public domain literature classics:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredBooks.map((book) => {
                    const isSaved = !!savedBooks[book.id];
                    return (
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

                          <button
                            onClick={() => {
                              if (isSaved) {
                                handleRemoveFromShelf(book.id);
                              } else {
                                handleSaveToShelf(book, 'want_to_read');
                              }
                            }}
                            className={`p-2 rounded-xl border transition-all ${
                              isSaved
                                ? 'bg-amber-600 text-white border-amber-400'
                                : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border-purple-700/50'
                            }`}
                            title={isSaved ? 'Remove from My Bookshelf' : 'Bookmark to My Bookshelf'}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://www.gutenberg.org/ebooks/${book.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 rounded-xl text-purple-300 hover:text-white transition-all"
                            title="View on Gutenberg.org"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MY BOOKSHELF */}
            {activeTab === 'my_shelf' && (
              <div className="space-y-4">
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="font-cozy font-bold text-sm text-white">Your Personal Study Bookshelf</h3>
                      <p className="text-[11px] text-amber-200/80">
                        Track books you want to read, active books, and personal notes
                      </p>
                    </div>
                  </div>
                  {currentUser ? (
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1 font-mono">
                      <Cloud className="w-3 h-3" />
                      Synced to Firestore
                    </span>
                  ) : (
                    <button
                      onClick={onOpenAuth}
                      className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded-xl font-cozy font-bold shadow"
                    >
                      Sign In to Save Permanently
                    </button>
                  )}
                </div>

                {myShelfBooks.length === 0 ? (
                  <div className="text-center py-16 bg-[#161226] border border-purple-800/40 rounded-3xl p-6">
                    <Bookmark className="w-12 h-12 text-purple-600/60 mx-auto mb-3" />
                    <h3 className="text-white font-cozy font-bold text-base">Your bookshelf is empty</h3>
                    <p className="text-xs text-purple-400 mt-1 max-w-sm mx-auto">
                      Click the bookmark icon or "Read Online" on any Gutenberg classic to add it to your cozy reading nook!
                    </p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-cozy font-bold transition-all shadow"
                    >
                      Explore Classics Catalog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {myShelfBooks.map((book) => {
                      const shelfItem = savedBooks[book.id];
                      return (
                        <div
                          key={book.id}
                          className="bg-[#1b172e] border border-amber-600/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                                  shelfItem?.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : shelfItem?.status === 'reading'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {shelfItem?.status?.replace(/_/g, ' ') || 'Saved'}
                              </span>

                              <button
                                onClick={() => handleRemoveFromShelf(book.id)}
                                className="text-purple-400 hover:text-rose-400 text-xs p-1"
                                title="Remove from shelf"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <h4 className="font-serif font-bold text-white text-base leading-tight">
                              {book.title}
                            </h4>
                            <p className="text-xs text-purple-300 font-serif mb-2">by {book.author}</p>

                            {shelfItem?.notes && (
                              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/40 text-[11px] text-purple-200 font-mono italic my-2">
                                "{shelfItem.notes}"
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-purple-900/50">
                            <button
                              onClick={() => {
                                soundEngine.playChime('chime');
                                setSelectedBook(book);
                              }}
                              className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-cozy font-bold shadow flex items-center justify-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Open Reader</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CAFE BOOK BOARD (COMMUNITY STICKY NOTES IN FIRESTORE) */}
            {activeTab === 'community' && (
              <div className="space-y-5">
                <div className="bg-[#171329] border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <StickyNote className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="font-cozy font-bold text-sm text-white">Cafe Coworker Book Board</h3>
                      <p className="text-[11px] text-cyan-200/80">
                        Leave public book recommendations, study quotes, and literature thoughts for fellow coworkers
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono border border-cyan-500/30">
                    Live Firestore Feed
                  </span>
                </div>

                {/* Sticky Note Creator Form */}
                <form onSubmit={handlePostCommunityNote} className="bg-[#1a152d] border border-purple-800/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-cozy text-purple-300 font-bold flex items-center gap-1.5">
                      <MessageSquarePlus className="w-4 h-4 text-purple-400" />
                      <span>Post a Book Recommendation or Literature Quote</span>
                    </label>
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      className="bg-purple-950 border border-purple-700/50 rounded-xl px-2.5 py-1 text-[11px] text-purple-200 focus:outline-none"
                    >
                      <option value="Recommendation">📚 Recommendation</option>
                      <option value="Quote">💬 Favorite Quote</option>
                      <option value="Study Tip">💡 Study Tip</option>
                      <option value="Cozy Break">☕ Cozy Break</option>
                    </select>
                  </div>

                  <textarea
                    rows={2}
                    required
                    maxLength={500}
                    placeholder="e.g., Highly recommend Frankenstein for rainy afternoon study breaks! Mary Shelley's prose is mesmerizing..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full bg-purple-950/80 border border-purple-700/50 rounded-xl p-3 text-xs text-white placeholder:text-purple-500 focus:outline-none focus:border-cyan-400"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-purple-400 font-mono">
                      Posting as: <strong className="text-white">{currentUser?.displayName || 'Cozy Coworker'}</strong>
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNoteText.trim()}
                      className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-cozy font-bold shadow flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingNote ? 'Pinning...' : 'Pin to Board'}</span>
                    </button>
                  </div>
                </form>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* Default Seed sticky note if empty */}
                  {communityNotes.length === 0 && (
                    <div className="bg-[#241a3a] border border-amber-500/40 rounded-2xl p-4 shadow-md rotate-[-1deg]">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-mono mb-2">
                        <span>📚 Recommendation</span>
                        <span>Cafe Curators</span>
                      </div>
                      <p className="text-xs text-amber-100 font-serif leading-relaxed">
                        “It is a truth universally acknowledged, that a single coworker in possession of a cup of coffee, must be in want of deep focus.” Welcome to our bookshelf!
                      </p>
                    </div>
                  )}

                  {communityNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-[#211a36] border border-purple-700/40 hover:border-cyan-500/50 rounded-2xl p-4 shadow-md transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-cyan-300 font-mono mb-1">
                          <span className="bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/50">
                            {note.category || 'Note'}
                          </span>
                          <span className="text-purple-400">
                            {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-xs text-purple-100 font-serif leading-relaxed line-clamp-4">
                          "{note.text}"
                        </p>
                      </div>

                      <div className="text-[10px] text-purple-400 font-cozy font-bold flex items-center gap-1 border-t border-purple-900/50 pt-2">
                        <UserIcon className="w-3 h-3 text-purple-500" />
                        <span>{note.authorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
