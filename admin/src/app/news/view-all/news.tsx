// src/pages/news/NewsCenter.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URLS } from "../../../config/api";

const API_URL = API_URLS.NEWS;

// ---- Types ----
export type FirestoreTimestamp = {
  _seconds: number;
  _nanoseconds?: number;
};

export type NewsPost = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  brief: string;
  source: string;
  liveLink: string;
  category: string;
  createdAt?: FirestoreTimestamp | string | Date | null;
  updatedAt?: FirestoreTimestamp | string | Date | null;
  views: number;
  isTrending: boolean;
  published: boolean;
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

function formatDate(d?: Date | null) {
  if (!d) return "—";
  try {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d.toDateString();
  }
}

// stable key generator (prevents React "key" warning even if id is missing/duplicated)
function newsKey(n: NewsPost, index: number) {
  const ts = tsToDate(n.createdAt)?.getTime() ?? 0;
  const base =
    (n.id && n.id.trim()) || `${(n.title || "untitled").slice(0, 32)}-${ts}`;
  return `${base}-${index}`;
}

// ---- Component ----
export default function NewsCenter() {
  const navigate = useNavigate();

  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "trending" | "views">(
    "newest"
  );

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NewsPost | null>(null);

  // simple client pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // unwrap { success, data }
        const payload = (await res.json()) as {
          success?: boolean;
          data?: NewsPost[] | NewsPost | null;
        };

        const raw = payload?.data;
        const list: NewsPost[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

        // ensure each item has a usable id (guard against duplicates/missing)
        const seen = new Set<string>();
        const normalized = list.map((n, i) => {
          const ts = tsToDate(n.createdAt)?.getTime() ?? 0;
          let id = (n.id || "").trim();
          if (!id || seen.has(id)) {
            id = `${(n.title || "untitled").slice(0, 32)}-${ts}-${i}`;
          }
          seen.add(id);
          return { ...n, id };
        });

        if (mounted) setItems(normalized.filter(Boolean));
      } catch (e: any) {
        setError(e?.message || "Failed to load news");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((n) => n?.category && s.add(n.category));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    let out = [...items].filter((n) => n?.published !== false);

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      out = out.filter((n) =>
        [n.title, n.brief, n.description, n.source, n.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    if (category !== "all") {
      out = out.filter((n) => n.category === category);
    }

    out.sort((a, b) => {
      const ad = tsToDate(a.createdAt)?.getTime() ?? 0;
      const bd = tsToDate(b.createdAt)?.getTime() ?? 0;
      if (sortBy === "newest") return bd - ad;
      if (sortBy === "trending")
        return Number(b.isTrending) - Number(a.isTrending) || bd - ad;
      if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0);
      return 0;
    });

    return out;
  }, [items, q, category, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    // reset to page 1 when filters change
    setPage(1);
  }, [q, category, sortBy]);

  function openDetails(item: NewsPost) {
    setActive(item);
    setOpen(true);
  }

  // parent-side delete to sync UI
  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    // also close slide-over if it was the active one
    setActive((prev) => (prev?.id === id ? null : prev));
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              News Centre
            </h1>

            {/* Top-right actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/news/post"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                + Post News
              </Link>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search news…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <Select
              value={category}
              onChange={(v) => setCategory(v)}
              label="Category"
              options={categories}
            />
            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v as any)}
              label="Sort"
              options={["newest", "trending", "views"]}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : pageItems.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQ("");
              setCategory("all");
              setSortBy("newest");
            }}
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((n, i) => (
                <li key={newsKey(n, i)}>
                  <NewsCard
                    n={n}
                    onClick={() => openDetails(n)}
                    onDeleted={handleDeleted}
                    onEdit={(id) => navigate(`/news/${id}/edit`)}
                  />
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  Page {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <SlideOver open={open} setOpen={setOpen}>
        {active && <NewsDetails n={active} />}
      </SlideOver>
    </div>
  );
}

// ---- UI bits ----
function Select({
  value,
  onChange,
  options = [],
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o}
          </option>
        ))}
      </select>
    </label>
  );
}

function NewsCard({
  n,
  onClick,
  onDeleted,
  onEdit,
}: {
  n: NewsPost;
  onClick: () => void;
  onDeleted: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const d = tsToDate(n.createdAt);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!n?.id) return;
    const ok = window.confirm(`Delete "${n.title || "this news"}"?`);
    if (!ok) return;

    try {
      setDeleting(true);
      // adjust if your delete endpoint differs
      const res = await fetch(`${API_URL}${n.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onDeleted(n.id);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onEdit(n.id);
  }

  return (
    <button
      onClick={onClick}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {n.imageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          <img
            src={n.imageUrl}
            alt={n.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
          {n.isTrending && (
            <span className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow">
              Trending
            </span>
          )}
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-slate-400">
          No image
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
            {n.title || "Untitled"}
          </h3>
          {n.category && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {n.category}
            </span>
          )}
        </div>

        {n.brief && (
          <p className="line-clamp-2 text-sm text-slate-600">{n.brief}</p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(d)}</span>
          <span className="inline-flex items-center gap-1">
            <EyeIcon className="h-4 w-4" /> {n.views ?? 0}
          </span>
        </div>

        {/* Card actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </button>
  );
}

function NewsDetails({ n }: { n: NewsPost }) {
  const d = tsToDate(n.createdAt);
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-900">
              {n.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {n.category && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {n.category}
                </span>
              )}
              <span>{formatDate(d)}</span>
              {n.isTrending && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                  Trending
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <EyeIcon className="h-4 w-4" /> {n.views ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {n.imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <img src={n.imageUrl} alt={n.title} className="w-full object-cover" />
          </div>
        )}
        {n.brief && (
          <p className="text-[15px] leading-7 text-slate-700">{n.brief}</p>
        )}
        {n.description && (
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {n.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-slate-700">
          {n.source && (
            <p>
              Source:{" "}
              <span className="font-medium text-slate-900">{n.source}</span>
            </p>
          )}
          {n.liveLink && (
            <p>
              Live Link:{" "}
              <a
                className="text-slate-900 underline decoration-slate-300 underline-offset-2"
                href={n.liveLink}
                target="_blank"
              >
                {n.liveLink}
              </a>
            </p>
          )}
          <p>Published: {n.published ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );
}

function SlideOver({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-slate-900/25 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`absolute inset-y-0 right-0 flex w-full max-w-2xl transform flex-col rounded-l-2xl bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-medium text-slate-700">News Details</h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Close"
          >
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
    <svg
      className="h-6 w-6 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" />
    </svg>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
        <SearchIcon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No news found</h3>
      <p className="mt-1 text-sm text-slate-600">
        Try clearing filters or searching a different term.
      </p>
      <button
        onClick={onReset}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
      >
        Reset
      </button>
    </div>
  );
}

// --- icons ---
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
