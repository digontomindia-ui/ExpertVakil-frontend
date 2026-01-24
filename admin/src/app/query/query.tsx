"use client";
import React, { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../config/api";

/**
 * QueriesCenter.tsx (Next.js, TypeScript)
 * - Fetches queries from http://localhost:4000/api/queries/
 * - Handles mixed shapes (legacy + new) and normalizes them
 * - Search, filters (category, source, target, visibility), sort (Newest, Most Answered)
 * - Responsive grid list; click card → slide-over details
 * - TailwindCSS only
 *
 * Usage (App Router): place as app/queries/page.tsx and export default <QueriesCenter />
 * Usage (Pages Router): pages/queries.tsx
 */

const API_URL = API_URLS.QUERIES_ALL;

// ---- Types ----
export type FirestoreTimestamp = { _seconds: number; _nanoseconds?: number };

export type QueryNew = {
  id: string;
  title: string;
  content: string;
  category: string;
  author?: { name?: string; city?: string };
  target?: "team" | "both" | "lawyers" | string;
  isPublic?: boolean;
  answerCount?: number;
  createdAt?: FirestoreTimestamp | string | Date | null;
  updatedAt?: FirestoreTimestamp | string | Date | null;
};

export type QueryLegacy = {
  id: string;
  askedById?: string;
  askedByName?: string;
  description?: string; // content
  source?: string; // advocate | expert_vakeel | legal_network
  title: string;
  createdAt?: FirestoreTimestamp | string | Date | null;
  answersCount?: number;
  updatedAt?: FirestoreTimestamp | string | Date | null;
};

export type QueryNorm = {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorCity: string;
  source: string; // advocate|expert_vakeel|legal_network|""
  target: string; // team|both|lawyers|""
  isPublic: boolean;
  answerCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// ---- Utils ----
function tsToDate(ts?: FirestoreTimestamp | string | Date | null): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === "object" && typeof (ts as any)._seconds === "number") {
    return new Date((ts as any)._seconds * 1000);
  }
  return null;
}

function norm(q: any): QueryNorm {
  const isNew = typeof q?.content !== "undefined" || typeof q?.author !== "undefined";
  const createdAt = tsToDate((q as any)?.createdAt) || null;
  const updatedAt = tsToDate((q as any)?.updatedAt) || createdAt;
  return {
    id: String(q.id),
    title: String(q.title || "Untitled"),
    content: String(isNew ? (q.content ?? "") : (q.description ?? "")),
    category: String(isNew ? (q.category ?? "general") : (q.category ?? "general")),
    authorName: String(isNew ? (q.author?.name ?? "") : (q.askedByName ?? "")),
    authorCity: String(isNew ? (q.author?.city ?? "") : ""),
    source: String(isNew ? (q.source ?? "") : (q.source ?? "")),
    target: String(isNew ? (q.target ?? "") : ""),
    isPublic: Boolean(isNew ? (q.isPublic !== false) : true),
    answerCount: Number(isNew ? (q.answerCount ?? 0) : (q.answersCount ?? 0)),
    createdAt,
    updatedAt,
  };
}

function fmt(d?: Date | null) {
  if (!d) return "—";
  try {
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d.toDateString();
  }
}

// ---- Component ----
export default function QueriesCenter() {
  const [items, setItems] = useState<QueryNorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [target, setTarget] = useState("all");
  const [visibility, setVisibility] = useState("all"); // all|public|private
  const [sortBy, setSortBy] = useState<"newest" | "answers">("newest");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QueryNorm | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        const normalized = list.map(norm);
        if (mounted) setItems(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to load queries");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((x) => x.category && s.add(x.category));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const sources = useMemo(() => {
    const s = new Set<string>();
    items.forEach((x) => x.source && s.add(x.source));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const targets = useMemo(() => {
    const s = new Set<string>();
    items.forEach((x) => x.target && s.add(x.target));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    let out = [...items];

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      out = out.filter((x) =>
        [x.title, x.content, x.category, x.authorName, x.source, x.target]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    if (category !== "all") out = out.filter((x) => x.category === category);
    if (source !== "all") out = out.filter((x) => x.source === source);
    if (target !== "all") out = out.filter((x) => x.target === target);
    if (visibility !== "all") out = out.filter((x) => (visibility === "public" ? x.isPublic : !x.isPublic));

    out.sort((a, b) => {
      const ad = a.createdAt?.getTime?.() ?? 0;
      const bd = b.createdAt?.getTime?.() ?? 0;
      if (sortBy === "newest") return bd - ad;
      if (sortBy === "answers") return (b.answerCount ?? 0) - (a.answerCount ?? 0) || bd - ad;
      return 0;
    });

    return out;
  }, [items, q, category, source, target, visibility, sortBy]);

  function openDetails(item: QueryNorm) {
    setActive(item);
    setOpen(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Queries</h1>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search queries…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <Select value={category} onChange={setCategory} label="Category" options={categories} />
              <Select value={source} onChange={setSource} label="Source" options={sources} />
              <Select value={target} onChange={setTarget} label="Target" options={targets} />
              <Select value={visibility} onChange={setVisibility} label="Visibility" options={["all","public","private"]} />
              <Select value={sortBy} onChange={(v) => setSortBy(v as any)} label="Sort" options={["newest","answers"]} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex h-60 items-center justify-center"><Spinner /></div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={() => { setQ(""); setCategory("all"); setSource("all"); setTarget("all"); setVisibility("all"); setSortBy("newest"); }} />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((x) => (
              <li key={x.id}><QueryCard q={x} onClick={() => openDetails(x)} /></li>
            ))}
          </ul>
        )}
      </main>

      <SlideOver open={open} setOpen={setOpen}>
        {active && <QueryDetails q={active} />}
      </SlideOver>
    </div>
  );
}

// ---- UI bits ----
function Select({ value, onChange, options = [], label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o === "all" ? "All" : o}</option>
        ))}
      </select>
    </label>
  );
}

function QueryCard({ q, onClick }: { q: QueryNorm; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{q.title}</h3>
          {q.authorName && <p className="mt-0.5 text-xs text-slate-600">by {q.authorName}{q.authorCity ? ` • ${q.authorCity}` : ""}</p>}
        </div>
        {q.category && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{q.category}</span>}
      </div>
      {q.content && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{q.content}</p>}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{fmt(q.createdAt)}</span>
        <span className="inline-flex items-center gap-1"><AnswersIcon className="h-4 w-4" /> {q.answerCount ?? 0}</span>
      </div>
    </button>
  );
}

function QueryDetails({ q }: { q: QueryNorm }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-xl font-semibold text-slate-900">{q.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {q.category && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{q.category}</span>}
          {q.source && <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-700">{q.source}</span>}
          {q.target && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">{q.target}</span>}
          <span>{fmt(q.createdAt)}</span>
          <span className="inline-flex items-center gap-1"><AnswersIcon className="h-4 w-4" /> {q.answerCount ?? 0}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{q.isPublic ? "Public" : "Private"}</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {q.authorName && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Author</div>
            <div className="font-medium text-slate-900">{q.authorName}{q.authorCity ? ` • ${q.authorCity}` : ""}</div>
          </div>
        )}
        {q.content && <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{q.content}</p>}
        <div className="text-xs text-slate-500">Updated {fmt(q.updatedAt)}</div>
      </div>
    </div>
  );
}

function SlideOver({ open, setOpen, children }: { open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-slate-900/25 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
      <div className={`absolute inset-y-0 right-0 flex w-full max-w-2xl transform flex-col rounded-l-2xl bg-white shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-medium text-slate-700">Query Details</h3>
          <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle className="opacity-25" cx="12" cy="12" r="10" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" />
    </svg>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white"><SearchIcon className="h-5 w-5"/></div>
      <h3 className="text-lg font-semibold text-slate-900">No queries found</h3>
      <p className="mt-1 text-sm text-slate-600">Try clearing filters or searching a different term.</p>
      <button onClick={onReset} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">Reset</button>
    </div>
  );
}

// --- inline icons ---
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  );
}
function AnswersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
  );
}
