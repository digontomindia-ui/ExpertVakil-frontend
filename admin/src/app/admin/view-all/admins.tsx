// src/pages/admins/AdminsCenter.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminsAPI, type Admin } from "../../../config/api";

// ---- Types ----
export type FirestoreTimestamp = {
  _seconds: number;
  _nanoseconds?: number;
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

// ---- Main Component ----
export default function AdminsCenter() {
  const [items, setItems] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState<string>("");
  const [active, setActive] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Load admins
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await AdminsAPI.list();
        const data = response.data || [];
        const list = Array.isArray(data) ? data : data ? [data] : [];
        if (mounted) setItems(list.filter(Boolean));
      } catch (e: any) {
        setError(e instanceof Error ? e.message : "Failed to load admins");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter and sort admins
  const visible = useMemo(() => {
    let out = [...items];

    // text search
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      out = out.filter((admin) => {
        const hay = [
          admin.name,
          admin.email,
          admin.phoneNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    // active filter
    if (active !== "all") {
      const isActive = active === "true";
      out = out.filter((admin) => admin.isActive === isActive);
    }

    // sorting
    out.sort((a, b) => {
      const aDate = tsToDate(a.createdAt);
      const bDate = tsToDate(b.createdAt);
      const aTime = aDate ? aDate.getTime() : 0;
      const bTime = bDate ? bDate.getTime() : 0;

      if (sortBy === "newest") return bTime - aTime;
      if (sortBy === "oldest") return aTime - bTime;
      if (sortBy === "name") return a.name.localeCompare(b.name);

      // default: newest
      return bTime - aTime;
    });

    return out;
  }, [items, q, active, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Admins
            </h1>

            {/* Top-right actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/admins/post"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                + Create Admin
              </Link>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search admins by name, email, phone…"
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
              value={active}
              onChange={setActive}
              label="Status"
              options={["all", "true", "false"]}
              optionLabels={{ all: "All", true: "Active", false: "Inactive" }}
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              label="Sort"
              options={["newest", "oldest", "name"]}
              optionLabels={{ newest: "Newest First", oldest: "Oldest First", name: "By Name" }}
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
            Failed to load admins: {error}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQ("");
              setActive("all");
              setSortBy("newest");
            }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((admin) => (
              <li key={admin.id}>
                <AdminCard
                  admin={admin}
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

function AdminCard({ admin, onDeleted }: { admin: Admin; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = React.useState(false);

  const created = tsToDate(admin.createdAt);

  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    admin.name || "A"
  )}&radius=50`;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!admin?.id) return;
    const ok = window.confirm(`Delete admin "${admin.name}"?`);
    if (!ok) return;

    try {
      setDeleting(true);
      await AdminsAPI.remove(admin.id);
      onDeleted(admin.id);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link to={`/admins/${admin.id}`} className="block">
      <div className="group flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={admin.name}
                className="h-10 w-10 rounded-full border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {admin.name}
                </h3>
                <p className="truncate text-sm text-slate-600">{admin.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge active={admin.isActive} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="space-y-2 text-sm text-slate-600">
            {admin.phoneNumber && (
              <div className="flex items-center gap-2">
                <span className="text-xs">📞</span>
                <span>{admin.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {created && (
              <div>
                Created: {formatDate(created)}
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

function StatusBadge({ active }: { active?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
      active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {active ? 'Active' : 'Inactive'}
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No admins found</h3>
      <p className="mt-1 text-sm text-slate-600">
        Try clearing filters or create a new admin.
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
