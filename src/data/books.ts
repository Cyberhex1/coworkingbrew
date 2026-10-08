// Curated public-domain classics for the café library wall.
// `id` is the Project Gutenberg ebook number (https://www.gutenberg.org/ebooks/<id>).
// `cover` is [cloth colour, accent colour] used to paint the CSS pixel-art cover.

export type Genre = 'Romance' | 'Gothic' | 'Mystery' | 'Sci-Fi' | 'Adventure' | 'Whimsy' | 'Classics' | 'Philosophy';

export interface CuratedBook {
  id: number;
  title: string;
  author: string;
  year: number;
  genre: Genre;
  blurb: string;
  cover: [string, string];
}

export const GENRES: Genre[] = ['Romance', 'Gothic', 'Mystery', 'Sci-Fi', 'Adventure', 'Whimsy', 'Classics', 'Philosophy'];

export const BOOKS: CuratedBook[] = [
  // Romance
  { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, genre: 'Romance', blurb: 'Elizabeth Bennet trades barbs with the maddening Mr. Darcy.', cover: ['#d97a86', '#fbf1dc'] },
  { id: 1260, title: 'Jane Eyre', author: 'Charlotte Brontë', year: 1847, genre: 'Romance', blurb: 'A fierce governess, a brooding master, and a secret in the attic.', cover: ['#6e4a7a', '#e2b04a'] },
  { id: 768, title: 'Wuthering Heights', author: 'Emily Brontë', year: 1847, genre: 'Romance', blurb: 'Wild moors, wilder hearts: Heathcliff and Catherine.', cover: ['#3d2830', '#d97a86'] },
  { id: 158, title: 'Emma', author: 'Jane Austen', year: 1815, genre: 'Romance', blurb: 'A well-meaning matchmaker meddles her way through Highbury.', cover: ['#8cb4dc', '#fbf1dc'] },

  // Gothic
  { id: 84, title: 'Frankenstein', author: 'Mary Shelley', year: 1818, genre: 'Gothic', blurb: 'A young scientist builds a life and cannot face what he made.', cover: ['#3f7d4a', '#8fe3c4'] },
  { id: 345, title: 'Dracula', author: 'Bram Stoker', year: 1897, genre: 'Gothic', blurb: 'Letters and diaries trace a count from Transylvania to London.', cover: ['#2a1a1f', '#d9573f'] },
  { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', year: 1890, genre: 'Gothic', blurb: 'A portrait ages so its beautiful owner never has to.', cover: ['#e2b04a', '#2a1a1f'] },
  { id: 43, title: 'Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', year: 1886, genre: 'Gothic', blurb: 'A respectable doctor and his monstrous other half.', cover: ['#5e3626', '#f7d97a'] },

  // Mystery
  { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', year: 1892, genre: 'Mystery', blurb: 'Twelve cases for the sharpest mind on Baker Street.', cover: ['#5b85b8', '#f7d97a'] },
  { id: 244, title: 'A Study in Scarlet', author: 'Arthur Conan Doyle', year: 1887, genre: 'Mystery', blurb: 'Holmes and Watson meet, and a body turns up in Brixton.', cover: ['#d9573f', '#fbf1dc'] },

  // Sci-Fi
  { id: 35, title: 'The Time Machine', author: 'H. G. Wells', year: 1895, genre: 'Sci-Fi', blurb: 'A Victorian inventor rides to the year 802,701.', cover: ['#4a9a8f', '#fbf1dc'] },
  { id: 36, title: 'The War of the Worlds', author: 'H. G. Wells', year: 1898, genre: 'Sci-Fi', blurb: 'Martian cylinders land on Horsell Common.', cover: ['#1d2033', '#8fe3c4'] },
  { id: 164, title: 'Twenty Thousand Leagues Under the Sea', author: 'Jules Verne', year: 1870, genre: 'Sci-Fi', blurb: 'Aboard the Nautilus with the mysterious Captain Nemo.', cover: ['#2e3a5e', '#8cb4dc'] },

  // Adventure
  { id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson', year: 1883, genre: 'Adventure', blurb: 'Young Jim Hawkins, a map, and Long John Silver.', cover: ['#d9734e', '#2a1a1f'] },
  { id: 2701, title: 'Moby Dick', author: 'Herman Melville', year: 1851, genre: 'Adventure', blurb: 'Call me Ishmael. Captain Ahab hunts the white whale.', cover: ['#5b85b8', '#fbf1dc'] },
  { id: 103, title: 'Around the World in Eighty Days', author: 'Jules Verne', year: 1873, genre: 'Adventure', blurb: 'Phileas Fogg bets his fortune on a speedy lap of the globe.', cover: ['#e2b04a', '#5e3626'] },
  { id: 215, title: 'The Call of the Wild', author: 'Jack London', year: 1903, genre: 'Adventure', blurb: 'Buck, a pampered dog, is pulled into the Klondike.', cover: ['#8a8a94', '#fbf1dc'] },

  // Whimsy
  { id: 11, title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', year: 1865, genre: 'Whimsy', blurb: 'Down the rabbit hole to tea with the Hatter.', cover: ['#8cb4dc', '#d97a86'] },
  { id: 16, title: 'Peter Pan', author: 'J. M. Barrie', year: 1911, genre: 'Whimsy', blurb: 'The boy who would not grow up whisks Wendy to Neverland.', cover: ['#62a356', '#f7d97a'] },
  { id: 113, title: 'The Secret Garden', author: 'Frances Hodgson Burnett', year: 1911, genre: 'Whimsy', blurb: 'A locked garden, a lost key, and a slow spring.', cover: ['#3f7d4a', '#d97a86'] },
  { id: 55, title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', year: 1900, genre: 'Whimsy', blurb: 'Follow the yellow brick road to the Emerald City.', cover: ['#62a356', '#e2b04a'] },

  // Classics
  { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', year: 1859, genre: 'Classics', blurb: 'It was the best of times: London, Paris, revolution.', cover: ['#7a4830', '#f7d97a'] },
  { id: 46, title: 'A Christmas Carol', author: 'Charles Dickens', year: 1843, genre: 'Classics', blurb: 'Three ghosts give Ebenezer Scrooge one last chance.', cover: ['#d9573f', '#62a356'] },
  { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoyevsky', year: 1866, genre: 'Classics', blurb: 'A student commits a crime, then wrestles with his conscience.', cover: ['#3d2830', '#e6cf9f'] },
  { id: 5200, title: 'Metamorphosis', author: 'Franz Kafka', year: 1915, genre: 'Classics', blurb: 'Gregor Samsa wakes up as a giant insect. Then what?', cover: ['#a98ac4', '#2a1a1f'] },
  { id: 64317, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, genre: 'Classics', blurb: 'Green lights, gold parties, and a dream just out of reach.', cover: ['#1d2033', '#e2b04a'] },

  // Philosophy
  { id: 2680, title: 'Meditations', author: 'Marcus Aurelius', year: 180, genre: 'Philosophy', blurb: "A Roman emperor's private notes on keeping calm.", cover: ['#c9b28c', '#5e3626'] },
  { id: 205, title: 'Walden', author: 'Henry David Thoreau', year: 1854, genre: 'Philosophy', blurb: 'Two years in a cabin by a pond, living deliberately.', cover: ['#4a9a8f', '#f4e4c1'] },
  { id: 132, title: 'The Art of War', author: 'Sun Tzu', year: -500, genre: 'Philosophy', blurb: 'Ancient strategy, often reread as advice for the workday.', cover: ['#b5463b', '#2a1a1f'] },
];

export const BOOK_BY_ID: Record<number, CuratedBook> = Object.fromEntries(BOOKS.map((b) => [b.id, b]));

/** Human-friendly year, e.g. "c. 500 BC". */
export function fmtYear(y: number) {
  if (y < 0) return `c. ${-y} BC`;
  if (y < 1000) return `c. ${y} AD`;
  return String(y);
}

export const gutenbergUrl = (id: number) => `https://www.gutenberg.org/ebooks/${id}`;
