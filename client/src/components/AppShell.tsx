import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Compass, Home, Library, Menu, Settings, Shield, Users, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/catalog", label: "Book catalog", icon: Library },
  { href: "/rooms", label: "Reading rooms", icon: Users },
  { href: "/profile", label: "My profile", icon: Compass },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/auth" });

  const isAdmin = user?.role === "admin";
  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_72%_0%,rgba(40,90,160,.18),transparent_33%),radial-gradient(circle_at_0%_65%,rgba(27,42,78,.22),transparent_35%)]" />
      <div className="relative flex min-h-screen">
        <aside className={`${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/[.07] bg-[#0b1018]/95 px-5 py-6 backdrop-blur-xl transition-transform lg:static`}>
          <div className="flex items-center justify-between px-2"><Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#315e96] shadow-lg shadow-blue-900/40"><BookOpen size={19} /></div><div><div className="font-semibold tracking-tight">booklight</div><div className="text-[10px] uppercase tracking-[.28em] text-slate-500">library system</div></div></Link><button className="text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
          <div className="mt-12 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-600">Workspace</div>
          <nav className="mt-3 space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${location === href || (href === "/catalog" && location.startsWith("/books")) ? "bg-[#172a48] text-white shadow-inner shadow-blue-400/10" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><Icon size={17} />{label}</Link>)}{isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${location === "/admin" ? "bg-[#172a48] text-white" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><Shield size={17} />Admin panel</Link>}</nav>
          <div className="mt-auto space-y-1 border-t border-white/[.07] pt-5"><Link href="/profile" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/[.04] hover:text-white"><Settings size={17} /> Settings & profile</Link><div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[.035] p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-300 to-blue-700 text-sm font-semibold">{(user?.name ?? "R").slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{user?.name ?? "Reader"}</div><div className="text-[11px] text-slate-500">{isAdmin ? "Administrator" : "Member"}</div></div><button onClick={() => void logout()} className="text-xs text-slate-500 hover:text-white">Exit</button></div></div>
        </aside>
        <main className="min-w-0 flex-1"><header className="flex h-20 items-center justify-between border-b border-white/[.07] px-5 sm:px-8 lg:px-10"><button className="mr-3 text-slate-400 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-blue-300" />Personal library</div><div className="flex items-center gap-3"><span className="hidden text-xs text-slate-500 sm:inline">{user?.email}</span><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-300 to-blue-700 text-xs font-semibold">{(user?.name ?? "R").slice(0, 2).toUpperCase()}</div></div></header><div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">{children}</div></main>
      </div>
    </div>
  );
}
