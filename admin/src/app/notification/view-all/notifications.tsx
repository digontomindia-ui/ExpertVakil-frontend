// src/pages/notifications/NotificationsCenter.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationsAPI } from "../../../config/api";

// ---- Types ----
export type FirestoreTimestamp = {
  _seconds: number;
  _nanoseconds?: number;
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  image?: string;
  published?: boolean;
  read?: boolean;
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
export default function NotificationsCenter() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState<string>("");
  const [published, setPublished] = useState<string>("all");
  const [read, setRead] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Load notifications
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await NotificationsAPI.list();
        const data = response.data || [];
        const list = Array.isArray(data) ? data : data ? [data] : [];
        if (mounted) setItems(list.filter(Boolean));
      } catch (e: any) {
        setError(e instanceof Error ? e.message : "Failed to load notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter and sort notifications
  const visible = useMemo(() => {
    let out = [...items];

    // text search
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      out = out.filter((notification) => {
        const hay = [
          notification.title,
          notification.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    // published filter
    if (published !== "all") {
      const isPublished = published === "true";
      out = out.filter((n) => n.published === isPublished);
    }

    // read filter
    if (read !== "all") {
      const isRead = read === "true";
      out = out.filter((n) => n.read === isRead);
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
  }, [items, q, published, read, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Notifications
            </h1>

            {/* Top-right actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/notifications/post"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                + Create Notification
              </Link>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notifications…"
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
              value={published}
              onChange={setPublished}
              label="Published"
              options={["all", "true", "false"]}
              optionLabels={{ all: "All", true: "Published", false: "Draft" }}
            />
            <Select
              value={read}
              onChange={setRead}
              label="Read Status"
              options={["all", "true", "false"]}
              optionLabels={{ all: "All", true: "Read", false: "Unread" }}
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
            Failed to load notifications: {error}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQ("");
              setPublished("all");
              setRead("all");
              setSortBy("newest");
            }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((notification) => (
              <li key={notification.id}>
                <NotificationCard
                  notification={notification}
                  onDeleted={(deletedId) =>
                    setItems((prev) => prev.filter((x) => x.id !== deletedId))
                  }
                  onEdit={(id) => navigate(`/notifications/${id}/edit`)}
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

function NotificationCard({ notification, onDeleted, onEdit }: { notification: NotificationItem; onDeleted: (id: string) => void; onEdit: (id: string) => void }) {
  const [deleting, setDeleting] = React.useState(false);

  const created = tsToDate(notification.createdAt);
  const isPublished = notification.published;
  const isRead = notification.read;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!notification?.id) return;
    const ok = window.confirm(`Delete "${notification.title}"?`);
    if (!ok) return;

    try {
      setDeleting(true);
      await NotificationsAPI.deleteById(notification.id);
      onDeleted(notification.id);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link to={`/notifications/${notification.id}`} className="block">
      <div className="group flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {notification.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={isPublished ? "published" : "draft"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge variant={isRead ? "read" : "unread"}>
                {isRead ? "Read" : "Unread"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-sm text-slate-600">
            {notification.description}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(notification.id);
              }}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
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

function Badge({ children, variant }: { children: React.ReactNode; variant?: "published" | "draft" | "read" | "unread" }) {
  const variants = {
    published: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    read: "bg-blue-100 text-blue-800",
    unread: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${variants[variant || "published"]}`}>
      {children}
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
          <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No notifications found</h3>
      <p className="mt-1 text-sm text-slate-600">
        Try clearing filters or create a new notification.
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
