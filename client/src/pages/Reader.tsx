import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Mic, Pause, Play, Square, Volume2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type FontSize = "small" | "medium" | "large";
type VoiceAction = "play" | "pause" | "stop" | "next" | "previous" | "catalog" | "dashboard" | "page" | "unknown";
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

const WORDS_PER_PAGE = 110;

function splitPages(content: string | null | undefined, _totalPages: number) {
  const source = content?.trim();
  if (!source) return ["This book does not have readable content yet. Ask an administrator to add the book text."];
  const explicitPages = source.split(/\f|\n\s*---\s*\n/).map((page) => page.trim()).filter(Boolean);
  if (explicitPages.length > 1) return explicitPages;
  const words = source.split(/\s+/);
  return Array.from({ length: Math.ceil(words.length / WORDS_PER_PAGE) }, (_, index) => words.slice(index * WORDS_PER_PAGE, (index + 1) * WORDS_PER_PAGE).join(" "));
}

export default function Reader({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const book = trpc.library.books.getById.useQuery({ id });
  const voiceCommand = trpc.library.voiceAssistant.command.useMutation();
  const [page, setPage] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [lastHeard, setLastHeard] = useState("—");
  const [assistantState, setAssistantState] = useState<"idle" | "listening" | "processing" | "responding">("idle");
  const recognitionRef = useRef<Recognition | null>(null);
  const announcedBookRef = useRef<number | null>(null);
  const pages = useMemo(() => splitPages(book.data?.content, book.data?.totalPages ?? 1), [book.data?.content, book.data?.totalPages]);

  const speakReply = (text: string) => {
    if (!window.speechSynthesis) return;
    setAssistantState("responding");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setAssistantState("idle");
    utterance.onerror = () => setAssistantState("idle");
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [page]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!book.data || announcedBookRef.current === book.data.id) return;
    announcedBookRef.current = book.data.id;
    speakReply("Reader loaded. Press Play to listen, or Tab to navigate controls.");
  }, [book.data]);

  const playPage = () => {
    if (!window.speechSynthesis || !pages[page]) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(pages[page]);
    utterance.onstart = () => { setSpeaking(true); setPaused(false); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); };
    window.speechSynthesis.speak(utterance);
  };
  const pauseSpeech = () => { window.speechSynthesis?.pause(); setPaused(true); };
  const resumeSpeech = () => { window.speechSynthesis?.resume(); setPaused(false); };
  const stopSpeech = () => { window.speechSynthesis?.cancel(); setSpeaking(false); setPaused(false); };

  const applyVoiceAction = (action: VoiceAction, reply: string) => {
    if (action === "play") { playPage(); return; }
    if (action === "pause") { pauseSpeech(); speakReply(reply || "Paused."); return; }
    if (action === "stop") { stopSpeech(); speakReply(reply || "Stopped."); return; }
    if (action === "next") { setPage((current) => Math.min(current + 1, pages.length - 1)); window.setTimeout(() => speakReply(reply || "Next page."), 0); return; }
    if (action === "previous") { setPage((current) => Math.max(current - 1, 0)); window.setTimeout(() => speakReply(reply || "Previous page."), 0); return; }
    if (action === "catalog") { window.setTimeout(() => speakReply(reply || "Opening the catalog."), 0); navigate("/catalog"); return; }
    if (action === "dashboard") { window.setTimeout(() => speakReply(reply || "Opening your dashboard."), 0); navigate("/dashboard"); return; }
    if (action === "page") { speakReply(`You are on page ${page + 1} of ${pages.length}.`); return; }
    speakReply(reply || "I did not recognize that reader command.");
  };

  const startListening = () => {
    const speechWindow = window as RecognitionWindow;
    const RecognitionConstructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionConstructor) { setVoiceStatus("Voice recognition is not available in this browser."); speakReply("Voice recognition is not available in this browser."); return; }
    recognitionRef.current?.stop();
    const recognition = new RecognitionConstructor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const command = event.results[0]?.[0]?.transcript?.trim();
      if (!command) return;
      setLastHeard(command);
      setVoiceStatus(`Heard: ${command}`);
      setAssistantState("processing");
      voiceCommand.mutate({ command }, { onSuccess: (result) => applyVoiceAction(result.action, result.reply), onError: () => { setAssistantState("idle"); setVoiceStatus("Voice assistant unavailable."); speakReply("The voice assistant is unavailable right now."); } });
    };
    recognition.onerror = () => { setListening(false); setAssistantState("idle"); setVoiceStatus("I could not hear a command."); };
    recognition.onend = () => { setListening(false); if (assistantState === "listening") setAssistantState("idle"); };
    recognitionRef.current = recognition;
    setListening(true);
    setAssistantState("listening");
    setVoiceStatus("Listening for a reader command…");
    recognition.start();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "BUTTON") return;
      if (event.key === " ") { event.preventDefault(); if (speaking && !paused) pauseSpeech(); else if (paused) resumeSpeech(); else playPage(); }
      if (event.key === "ArrowRight") { event.preventDefault(); setPage((current) => Math.min(current + 1, pages.length - 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setPage((current) => Math.max(current - 1, 0)); }
      if (event.key === "Escape") { event.preventDefault(); stopSpeech(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page, pages.length, paused, speaking]);

  if (book.isLoading) return <div className="text-sm text-slate-500">Loading reader…</div>;
  if (!book.data) return <div className="text-sm text-rose-300">Book not found.</div>;
  const keyPoints = (book.data.keyPoints ?? "").split(/\n|•|;/).map((point) => point.trim()).filter(Boolean);
  const fontClass = fontSize === "small" ? "text-base leading-8" : fontSize === "large" ? "text-2xl leading-[1.9]" : "text-lg leading-9";

  return <div className="page-enter mx-auto max-w-4xl pb-24">
    <Link href={`/books/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" aria-label="Back to book details"><ArrowLeft size={15} aria-hidden="true" /> Back to book</Link>
    <header className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-xs uppercase tracking-[.2em] text-blue-300">Accessible reader</div><h1 className="mt-2 font-serif text-3xl text-white">{book.data.title}</h1><p className="mt-1 text-sm text-slate-500">{book.data.author}</p></div><div className="flex items-center gap-2" aria-label="Font size controls"><span className="mr-1 text-xs text-slate-500">Text size</span>{(["small", "medium", "large"] as FontSize[]).map((size) => <button key={size} onClick={() => setFontSize(size)} aria-label={`Set text size to ${size}`} aria-pressed={fontSize === size} className={`rounded-lg border px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${fontSize === size ? "border-blue-300/60 bg-blue-400/15 text-blue-100" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>{size[0].toUpperCase()}</button>)}</div></header>
    <section className="glass-card mt-6 rounded-3xl p-6 sm:p-10" aria-label={`Reading page ${page + 1} of ${pages.length}`}><div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Volume2 size={16} className="text-blue-300" aria-hidden="true" /> Audiobook mode</div><div className="flex gap-2" aria-label="Audiobook controls">{!speaking ? <button onClick={playPage} aria-label="Play current page aloud" className="glass-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Play size={14} aria-hidden="true" /> Play page</button> : paused ? <button onClick={resumeSpeech} aria-label="Resume audiobook" className="glass-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Play size={14} aria-hidden="true" /> Resume</button> : <button onClick={pauseSpeech} aria-label="Pause audiobook" className="glass-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Pause size={14} aria-hidden="true" /> Pause</button>}<button onClick={stopSpeech} disabled={!speaking} aria-label="Stop audiobook" className="glass-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-40"><Square size={13} aria-hidden="true" /> Stop</button></div></div><div role="region" aria-live="polite" aria-atomic="true" aria-label={`Current reading content, page ${page + 1} of ${pages.length}`} tabIndex={0} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><p className={`whitespace-pre-wrap font-serif text-slate-200 ${fontClass}`}>{pages[page]}</p></div><div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5"><button disabled={page === 0} onClick={() => setPage((current) => current - 1)} aria-label="Go to previous page" className="glass-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /> Previous</button><span className="text-xs text-slate-500" aria-live="polite">Page {page + 1} of {pages.length}</span><button disabled={page === pages.length - 1} onClick={() => setPage((current) => Math.min(current + 1, pages.length - 1))} aria-label="Go to next page" className="glass-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-40">Next <ChevronRight size={16} aria-hidden="true" /></button></div></section>
    {keyPoints.length > 0 && <section className="glass-card mt-5 rounded-2xl p-5" aria-labelledby="reader-key-points"><h2 id="reader-key-points" className="font-semibold text-white">Key points</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">{keyPoints.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}</ul></section>}
    <div role="status" aria-live="polite" className="sr-only">{voiceStatus}</div>
    <div className="fixed bottom-6 right-6 z-40 flex items-end gap-3"><div className="glass-card min-w-56 rounded-2xl border border-white/10 p-3 text-xs shadow-xl" role="status" aria-live="polite"><div className="font-semibold text-white">Voice assistant</div><div className="mt-1 text-slate-400">Last heard: <span className="text-slate-200">{lastHeard}</span></div><div className="mt-1 text-slate-400">State: <span className="capitalize text-blue-200">{assistantState}</span></div></div><button onClick={listening ? () => recognitionRef.current?.stop() : startListening} aria-label="Voice assistant, press to activate" aria-pressed={listening} title="Voice assistant" className={`grid h-16 w-16 place-items-center rounded-full border border-blue-200/40 bg-blue-400 text-slate-950 shadow-[0_0_28px_rgba(96,165,250,.4)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${listening ? "animate-pulse" : ""}`}><Mic size={25} aria-hidden="true" /></button></div>
  </div>;
}
