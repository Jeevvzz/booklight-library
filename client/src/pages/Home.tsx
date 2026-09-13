import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Flame,
  Heart,
  Home as HomeIcon,
  Library,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

const books = [
  { title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", rating: 4.7, progress: 68, cover: "from-indigo-400 via-blue-800 to-slate-950", mark: "✦" },
  { title: "Atomic Habits", author: "James Clear", genre: "Self Growth", rating: 4.8, progress: 42, cover: "from-amber-300 via-orange-700 to-red-950", mark: "A" },
  { title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", genre: "Nature", rating: 4.9, progress: 0, cover: "from-emerald-300 via-teal-800 to-slate-950", mark: "❋" },
  { title: "The Creative Act", author: "Rick Rubin", genre: "Creativity", rating: 4.6, progress: 0, cover: "from-rose-300 via-fuchsia-800 to-slate-950", mark: "◒" },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", genre: "Fiction", rating: 4.5, progress: 0, cover: "from-cyan-300 via-blue-900 to-slate-950", mark: "T" },
  { title: "Designing Your Life", author: "Bill Burnett", genre: "Life Design", rating: 4.4, progress: 0, cover: "from-lime-200 via-green-800 to-slate-950", mark: "D" },
];

const nav = [
  { label: "Overview", icon: HomeIcon },
  { label: "My library", icon: Library },
  { label: "Discover", icon: Compass },
  { label: "Reading rooms", icon: Users, count: "3" },
];

function Cover({ book, large = false }: { book: (typeof books)[number]; large?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${book.cover} ${large ? "h-56 w-40" : "h-44 w-28"} shrink-0 shadow-2xl shadow-black/30`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,.38),transparent_22%)]" />
      <div className="absolute inset-x-3 top-5 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">Booklight press</div>
      <div className="absolute inset-x-3 top-12 text-center font-serif text-xl leading-tight text-white drop-shadow-md">{book.mark}</div>
      <div className="absolute inset-x-3 bottom-5 text-center font-serif text-sm leading-tight text-white">{book.title}</div>
      <div className="absolute bottom-2 left-3 right-3 h-px bg-white/30" />
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 31;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#67a8ff" strokeLinecap="round" strokeWidth="7" strokeDasharray={circumference} strokeDashoffset={circumference - (value / 100) * circumference} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">{value}%</span>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All genres");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [borrowed, setBorrowed] = useState<string[]>([]);

  const filteredBooks = useMemo(() => books.filter((book) => {
    const matchesQuery = `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = genre === "All genres" || book.genre === genre;
    return matchesQuery && matchesGenre;
  }), [query, genre]);

  const borrow = (title: string) => {
    setBorrowed((current) => current.includes(title) ? current : [...current, title]);
    toast.success(`${title} added to your reading queue`, { description: "Due in 14 days · Your streak is safe." });
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_72%_0%,rgba(40,90,160,.18),transparent_33%),radial-gradient(circle_at_0%_65%,rgba(27,42,78,.22),transparent_35%)]" />
      <div className="relative flex min-h-screen">
        <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed inset-y-0 left-0 z-30 w-72 border-r border-white/[.07] bg-[#0b1018]/95 px-5 py-6 backdrop-blur-xl transition-transform lg:static lg:flex lg:flex-col`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#315e96] shadow-lg shadow-blue-900/40"><BookOpen size={19} /></div><div><div className="font-semibold tracking-tight">booklight</div><div className="text-[10px] uppercase tracking-[.28em] text-slate-500">library system</div></div></div>
            <button className="lg:hidden text-slate-400" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
          </div>
          <div className="mt-12 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-600">Workspace</div>
          <nav className="mt-3 space-y-1">
            {nav.map(({ label, icon: Icon, count }) => <button key={label} onClick={() => { setActive(label); setMobileOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition ${active === label ? "bg-[#172a48] text-white shadow-inner shadow-blue-400/10" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><span className="flex items-center gap-3"><Icon size={17} />{label}</span>{count && <span className="rounded-full bg-blue-400/15 px-2 py-0.5 text-[10px] text-blue-300">{count}</span>}</button>)}
          </nav>
          <div className="mt-10 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-600">Your progress</div>
          <div className="mt-3 rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">Reading streak</span><Flame size={17} className="text-orange-300" /></div><div className="mt-3 flex items-end gap-2"><span className="text-3xl font-semibold">12</span><span className="pb-1 text-xs text-slate-500">days</span></div><div className="mt-3 flex gap-1">{[1,1,1,1,1,1,1,1,1,1,1,1,0,0].map((on, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${on ? "bg-orange-300" : "bg-white/10"}`} />)}</div><div className="mt-2 text-[11px] text-slate-500">2 more days to unlock <span className="text-orange-200">Night Owl</span></div></div>
          <div className="mt-auto space-y-1 border-t border-white/[.07] pt-5"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/[.04] hover:text-white"><Settings size={17} /> Settings</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/[.04] hover:text-white"><CircleHelp size={17} /> Help center</button><div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[.035] p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-300 to-blue-700 text-sm font-semibold">AM</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">Alex Morgan</div><div className="text-[11px] text-slate-500">Level 7 reader</div></div><MoreHorizontal size={17} className="text-slate-500" /></div></div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-white/[.07] px-5 sm:px-8 lg:px-10"><button className="mr-3 text-slate-400 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="relative max-w-xl flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books, authors, or ISBN..." className="h-10 w-full rounded-xl border border-white/[.08] bg-white/[.025] pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10" /></div><div className="ml-5 flex items-center gap-4"><button onClick={() => toast("You are all caught up", { description: "No new due date reminders." })} className="relative text-slate-400 hover:text-white" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-300 ring-2 ring-[#080b11]" /></button><div className="hidden h-7 w-px bg-white/10 sm:block" /><div className="hidden items-center gap-2 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-300 to-blue-700 text-xs font-semibold">AM</div><ChevronDown size={15} className="text-slate-500" /></div></div></header>

          <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs text-blue-300"><Sparkles size={14} /> Tuesday, September 13, 2026</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Good evening, Alex<span className="text-blue-300">.</span></h1><p className="mt-2 text-sm text-slate-500">Your quiet corner of the internet is ready.</p></div><button onClick={() => toast("Book scanner ready", { description: "Barcode scanning is available in the full mobile app." })} className="flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-sm font-medium text-blue-200 transition hover:bg-blue-400/20"><Plus size={17} /> Add a book</button></div>

            <section className="mt-8 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
              <div className="overflow-hidden rounded-3xl border border-white/[.08] bg-[#101a2b] p-6 shadow-2xl shadow-black/20 sm:p-7"><div className="flex flex-col justify-between gap-6 sm:flex-row"><div><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.2em] text-blue-300"><Zap size={14} /> Continue reading</div><h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-white">The Midnight Library</h2><p className="mt-2 text-sm text-slate-400">Matt Haig · Fiction & Philosophy</p><div className="mt-7 flex items-center gap-4"><ProgressRing value={68} /><div><div className="text-sm font-medium text-slate-200">You're in the flow</div><div className="mt-1 text-xs text-slate-500">214 of 315 pages</div><button onClick={() => toast("Opening reader", { description: "Resuming from page 214." })} className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-300 hover:text-white">Resume reading <ArrowRight size={14} /></button></div></div></div><div className="flex items-end justify-end sm:pr-5"><Cover book={books[0]} large /></div></div></div>
              <div className="rounded-3xl border border-white/[.08] bg-[#10151e] p-6"><div className="flex items-center justify-between"><div className="text-xs font-medium uppercase tracking-[.18em] text-slate-500">Weekly focus</div><Activity size={17} className="text-blue-300" /></div><div className="mt-4 flex items-end justify-between"><div><span className="text-4xl font-semibold text-white">4.5</span><span className="ml-2 text-xs text-slate-500">hrs read</span></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">+18%</span></div><div className="mt-6 flex h-20 items-end gap-2">{[38,55,42,68,48,82,60].map((height, i) => <div key={i} className="group flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-md transition group-hover:bg-blue-300 ${i === 5 ? "bg-blue-300" : "bg-blue-400/25"}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-600">{["M","T","W","T","F","S","S"][i]}</span></div>)}</div><div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Trophy size={14} className="text-amber-300" /> Top 12% of readers this week</div></div>
            </section>

            <section className="mt-10"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-semibold text-white">Your library</h2><p className="mt-1 text-sm text-slate-500">A curated shelf for your next chapter.</p></div><div className="flex items-center gap-2"><select value={genre} onChange={(e) => setGenre(e.target.value)} className="h-9 rounded-lg border border-white/[.1] bg-[#10151e] px-3 text-xs text-slate-300 outline-none"><option>All genres</option><option>Fiction</option><option>Nature</option><option>Creativity</option><option>Self Growth</option><option>Life Design</option></select><button className="rounded-lg border border-white/[.1] p-2 text-slate-400 hover:text-white" aria-label="More library options"><MoreHorizontal size={17} /></button></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredBooks.map((book) => <article key={book.title} className="group rounded-2xl border border-white/[.08] bg-[#0e141e] p-4 transition hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-[#111a28]"><div className="flex gap-4"><Cover book={book} /><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-start justify-between gap-2"><span className="rounded-full bg-white/[.06] px-2 py-1 text-[10px] text-slate-400">{book.genre}</span><button onClick={() => toast.success("Saved to wishlist")} className="text-slate-600 transition hover:text-rose-300" aria-label={`Save ${book.title}`}><Heart size={16} /></button></div><h3 className="mt-3 font-serif text-lg leading-snug text-slate-100">{book.title}</h3><p className="mt-1 text-xs text-slate-500">{book.author}</p><div className="mt-auto pt-4"><div className="flex items-center justify-between text-[11px] text-slate-500"><span className="flex items-center gap-1 text-amber-200"><Star size={12} fill="currentColor" /> {book.rating}</span>{book.progress > 0 ? <span>{book.progress}% complete</span> : <span>Not started</span>}</div>{book.progress > 0 ? <div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-blue-300" style={{ width: `${book.progress}%` }} /></div> : <button onClick={() => borrow(book.title)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 py-2 text-xs font-medium text-blue-200 transition hover:bg-blue-400/20">{borrowed.includes(book.title) ? "In your queue" : "Borrow book"} <ArrowRight size={13} /></button>}</div></div></div></article>)}</div>{filteredBooks.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-slate-500">No books match that search yet.</div>}</section>

            <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr]"><div className="rounded-2xl border border-white/[.08] bg-[#0e141e] p-5"><div className="flex items-center justify-between"><div><h3 className="font-medium text-white">Reading rooms</h3><p className="mt-1 text-xs text-slate-500">Read together, quietly or out loud.</p></div><button onClick={() => toast("Room creation coming soon")} className="rounded-lg p-2 text-blue-300 hover:bg-blue-400/10" aria-label="Create a reading room"><Plus size={17} /></button></div><div className="mt-5 space-y-3"><div className="flex items-center gap-3 rounded-xl bg-white/[.035] p-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-300 to-indigo-700"><BookOpen size={17} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">The Art of Slow Reading</div><div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><Users size={12} /> 8 readers · ends in 6 days</div></div><span className="h-2 w-2 rounded-full bg-emerald-300" /></div><div className="flex items-center gap-3 rounded-xl bg-white/[.035] p-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-200 to-orange-700"><Flame size={17} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">September Streak Sprint</div><div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><Users size={12} /> 24 readers · 3 days left</div></div><span className="h-2 w-2 rounded-full bg-emerald-300" /></div></div></div><div className="rounded-2xl border border-white/[.08] bg-gradient-to-br from-[#182b49] to-[#101923] p-5"><div className="flex items-center justify-between"><div><h3 className="font-medium text-white">Your next milestone</h3><p className="mt-1 text-xs text-slate-400">Level 8 · Bookworm</p></div><div className="grid h-11 w-11 place-items-center rounded-full bg-blue-300/15 text-blue-200"><Trophy size={20} /></div></div><div className="mt-6 flex items-end justify-between text-xs"><span className="text-slate-400">1,240 / 1,500 XP</span><span className="text-blue-200">83%</span></div><div className="mt-2 h-2 rounded-full bg-black/30"><div className="h-2 w-[83%] rounded-full bg-gradient-to-r from-blue-400 to-cyan-200" /></div><div className="mt-5 flex items-center gap-2 text-xs text-blue-100"><CalendarDays size={14} /> Read for 20 more minutes to earn +40 XP</div></div></section>
          </div>
        </main>
      </div>
    </div>
  );
}
