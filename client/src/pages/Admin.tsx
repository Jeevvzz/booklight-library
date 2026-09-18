import { useEffect, useRef, useState } from "react";
import { BarChart3, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type EditableBook = {
  id: number;
  title: string;
  author: string;
  genre: string;
  totalCopies: number;
  totalPages: number;
};

const fieldClass = "h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-slate-100 outline-none focus:border-blue-300/60";

export default function Admin() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const stats = trpc.library.admin.dashboardStats.useQuery(undefined, { enabled: user?.role === "admin" });
  const books = trpc.library.books.list.useQuery({ page: 1, pageSize: 50 }, { enabled: user?.role === "admin" });
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("Fiction");
  const [copies, setCopies] = useState(1);
  const [pages, setPages] = useState(0);
  const [editing, setEditing] = useState<EditableBook | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const focusable = () => Array.from(modalRef.current?.querySelectorAll<HTMLElement>("button, input") ?? []).filter((element) => !element.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditing(null);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  const refreshInventory = async () => {
    await Promise.all([
      utils.library.books.list.invalidate({ page: 1, pageSize: 50 }),
      utils.library.admin.dashboardStats.invalidate(),
    ]);
  };

  const create = trpc.library.books.create.useMutation({
    onSuccess: async () => {
      toast.success("Book added");
      setTitle("");
      setAuthor("");
      setGenre("Fiction");
      setCopies(1);
      setPages(0);
      await refreshInventory();
    },
    onError: (error) => toast.error(error.message),
  });

  const update = trpc.library.books.update.useMutation({
    onSuccess: async () => {
      toast.success("Book updated");
      setEditing(null);
      await refreshInventory();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = trpc.library.books.delete.useMutation({
    onSuccess: async () => {
      toast.success("Book removed");
      await refreshInventory();
    },
    onError: (error) => toast.error(error.message),
  });

  if (user?.role !== "admin") {
    return <div className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-6 text-rose-200">Admin access required.</div>;
  }

  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate({ title, author, genre, totalCopies: copies, totalPages: pages, moodTags: [] });
  };

  const openEdit = (book: EditableBook) => setEditing({ ...book });

  const submitEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    update.mutate({
      id: editing.id,
      title: editing.title,
      author: editing.author,
      genre: editing.genre,
      totalCopies: editing.totalCopies,
      totalPages: editing.totalPages,
    });
  };

  return (
    <div className="page-enter">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-blue-300">Operations</div>
          <h1 className="mt-2 text-3xl font-semibold text-white">Admin panel</h1>
          <p className="mt-2 text-sm text-slate-500">Manage inventory and watch borrowing health.</p>
        </div>
        <BarChart3 className="text-blue-300" />
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-4">
        {[["Books", stats.data?.totalBooks ?? 0], ["Active borrows", stats.data?.activeBorrows ?? 0], ["Overdue", stats.data?.overdueCount ?? 0], ["Members", stats.data?.totalMembers ?? 0]].map(([label, value]) => (
          <div key={label} className="glass-card rounded-2xl p-5">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={submitCreate} className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-white">Add a book</h2>
          <div className="mt-4 space-y-3">
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className={fieldClass} />
            <input required value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author" className={fieldClass} />
            <input required value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Genre" className={fieldClass} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="1" value={copies} onChange={(event) => setCopies(Number(event.target.value))} placeholder="Copies" className={fieldClass} />
              <input type="number" min="0" value={pages} onChange={(event) => setPages(Number(event.target.value))} placeholder="Pages" className={fieldClass} />
            </div>
            <button disabled={create.isPending} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-400 text-sm font-semibold text-slate-950 disabled:opacity-60"><Plus size={15} /> Add inventory item</button>
          </div>
        </form>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-white">Inventory</h2>
          <div className="mt-4 space-y-2">
            {books.data?.items.map((book) => (
              <div key={book.id} className="flex items-center gap-3 rounded-xl bg-white/[.035] p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-200">{book.title}</div>
                  <div className="text-xs text-slate-500">{book.author} · {book.availableCopies}/{book.totalCopies} available</div>
                </div>
                <button onClick={() => openEdit({ id: book.id, title: book.title, author: book.author, genre: book.genre, totalCopies: book.totalCopies, totalPages: book.totalPages })} className="text-slate-500 hover:text-blue-300" aria-label={`Edit ${book.title}`}><Pencil size={16} /></button>
                <button onClick={() => remove.mutate({ id: book.id })} className="text-slate-500 hover:text-rose-300" aria-label={`Delete ${book.title}`}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div ref={modalRef} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-book-title">
          <form onSubmit={submitEdit} className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#101a2b] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[.2em] text-blue-300">Inventory</div>
                <h2 id="edit-book-title" className="mt-1 text-xl font-semibold text-white">Edit book</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close edit book modal"><X size={18} /></button>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block text-sm text-slate-300">Title<input required value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className={`mt-2 ${fieldClass}`} /></label>
              <label className="block text-sm text-slate-300">Author<input required value={editing.author} onChange={(event) => setEditing({ ...editing, author: event.target.value })} className={`mt-2 ${fieldClass}`} /></label>
              <label className="block text-sm text-slate-300">Genre<input required value={editing.genre} onChange={(event) => setEditing({ ...editing, genre: event.target.value })} className={`mt-2 ${fieldClass}`} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-slate-300">Copies<input required type="number" min="1" value={editing.totalCopies} onChange={(event) => setEditing({ ...editing, totalCopies: Number(event.target.value) })} className={`mt-2 ${fieldClass}`} /></label>
                <label className="block text-sm text-slate-300">Pages<input required type="number" min="0" value={editing.totalPages} onChange={(event) => setEditing({ ...editing, totalPages: Number(event.target.value) })} className={`mt-2 ${fieldClass}`} /></label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
              <button disabled={update.isPending} className="rounded-lg bg-blue-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">{update.isPending ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
