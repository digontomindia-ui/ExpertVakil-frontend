// src/pages/blogs/BlogsCenter.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BlogsAPI } from "../../../config/api";

// ---- Types ----
export type FirestoreTimestamp = {
  _seconds: number;
  _nanoseconds?: number;
};

export type BlogPostItem = {
  id: string;
  title: string;
  category?: string;
  subtitle?: string;
  description: string;
  image?: string;
  published?: boolean;
  createdAt?: FirestoreTimestamp | string | Date | null;
  updatedAt?: FirestoreTimestamp | string | Date | null;
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
    return "—";
  }
}

function formatTime(d?: Date | null) {
  if (!d) return "";
  try {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ---- Main Component ----
export default function BlogsCenter() {
  const [items, setItems] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [published, setPublished] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Load blogs
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await BlogsAPI.list();
        const data = response.data || [];
        const list = Array.isArray(data) ? data : data ? [data] : [];
        if (mounted) setItems(list.filter(Boolean));
      } catch (e: any) {
        setError(e instanceof Error ? e.message : "Failed to load blogs");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((blog) => blog.category && s.add(blog.category));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  // Filter and sort blogs
  const visible = useMemo(() => {
    let out = [...items];

    // text search
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      out = out.filter((blog) => {
        const hay = [
          blog.title,
          blog.subtitle,
          blog.description,
          blog.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    // category filter
    if (category !== "all") {
      out = out.filter((blog) => blog.category === category);
    }

    // published filter
    if (published !== "all") {
      const isPublished = published === "true";
      out = out.filter((blog) => blog.published === isPublished);
    }

    // sorting
    out.sort((a, b) => {
      const aDate = tsToDate(a.createdAt);
      const bDate = tsToDate(b.createdAt);
      const aTime = aDate ? aDate.getTime() : 0;
      const bTime = bDate ? bDate.getTime() : 0;

      if (sortBy === "newest") return bTime - aTime;
      if (sortBy === "oldest") return aTime - bTime;

      // default: newest
      return bTime - aTime;
    });

    return out;
  }, [items, q, category, published, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Blogs
            </h1>

            {/* Top-right actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/blogs/post"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                + Create Blog Post
              </Link>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search blogs by title, content…"
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
              onChange={setCategory}
              label="Category"
              options={categories}
            />
            <Select
              value={published}
              onChange={setPublished}
              label="Status"
              options={["all", "true", "false"]}
              optionLabels={{ all: "All", true: "Published", false: "Draft" }}
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              label="Sort"
              options={["newest", "oldest"]}
              optionLabels={{ newest: "Newest First", oldest: "Oldest First" }}
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
            Failed to load blogs: {error}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQ("");
              setCategory("all");
              setPublished("all");
              setSortBy("newest");
            }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((blog) => (
              <li key={blog.id}>
                <BlogCard
                  blog={blog}
                  onDeleted={(deletedId) =>
                    setItems((prev) => prev.filter((x) => x.id !== deletedId))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

// ---- Components ----
function Select({
  value,
  onChange,
  options = [],
  optionLabels = {},
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
  label?: string;
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
            {optionLabels[o] || capitalize(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function BlogCard({ blog, onDeleted }: { blog: BlogPostItem; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = React.useState(false);

  const created = tsToDate(blog.createdAt);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!blog?.id) return;
    const ok = window.confirm(`Delete "${blog.title}"?`);
    if (!ok) return;

    try {
      setDeleting(true);
      await BlogsAPI.deleteById(blog.id);
      onDeleted(blog.id);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link to={`/blogs/${blog.id}`} className="block">
      <div className="group flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {blog.title}
            </h3>
            {blog.subtitle && (
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                {blog.subtitle}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge published={blog.published} />
              {blog.category && (
                <CategoryBadge category={blog.category} />
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        {blog.image && (
          <div className="aspect-video w-full rounded-xl overflow-hidden">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Preview */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-sm text-slate-600">
            {blog.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {created && (
              <div>
                {formatDate(created)} • {formatTime(created)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? "…" : "×"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ published }: { published?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
      published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
      {category}
    </span>
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
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No blog posts found</h3>
      <p className="mt-1 text-sm text-slate-600">
        Try clearing filters or create a new blog post.
      </p>
      <button
        onClick={onReset}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
      >
        Reset Filters
      </button>
    </div>
  );
}

function capitalize(s?: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
