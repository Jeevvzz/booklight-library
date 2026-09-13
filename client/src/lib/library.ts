export type LibraryBook = {
  title: string;
  author: string;
  genre: string;
  rating: number;
  progress: number;
  cover: string;
  mark: string;
};

export const books: LibraryBook[] = [
  { title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", rating: 4.7, progress: 68, cover: "from-indigo-400 via-blue-800 to-slate-950", mark: "✦" },
  { title: "Atomic Habits", author: "James Clear", genre: "Self Growth", rating: 4.8, progress: 42, cover: "from-amber-300 via-orange-700 to-red-950", mark: "A" },
  { title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", genre: "Nature", rating: 4.9, progress: 0, cover: "from-emerald-300 via-teal-800 to-slate-950", mark: "❋" },
  { title: "The Creative Act", author: "Rick Rubin", genre: "Creativity", rating: 4.6, progress: 0, cover: "from-rose-300 via-fuchsia-800 to-slate-950", mark: "◒" },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", genre: "Fiction", rating: 4.5, progress: 0, cover: "from-cyan-300 via-blue-900 to-slate-950", mark: "T" },
  { title: "Designing Your Life", author: "Bill Burnett", genre: "Life Design", rating: 4.4, progress: 0, cover: "from-lime-200 via-green-800 to-slate-950", mark: "D" },
];

export function filterLibraryBooks(query: string, genre: string, catalog: LibraryBook[] = books) {
  const normalized = query.trim().toLowerCase();
  return catalog.filter((book) => {
    const matchesQuery = `${book.title} ${book.author}`.toLowerCase().includes(normalized);
    const matchesGenre = genre === "All genres" || book.genre === genre;
    return matchesQuery && matchesGenre;
  });
}

export function calculateReadingProgress(pagesRead: number, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((pagesRead / totalPages) * 100)));
}
