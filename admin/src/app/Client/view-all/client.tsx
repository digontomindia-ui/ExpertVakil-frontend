
// src/pages/clients/ClientsDirectory.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom"; // ✅ NEW
import { ClientsAPI, type Client } from "../../../config/api";

// TypeScript interfaces
type SortOption = "relevance" | "name" | "email" | "recent" | "Phone";

// Utility function to parse various date formats
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  try {
    // Handle Firestore timestamp format
    if (typeof dateValue === 'object' && dateValue._seconds) {
      return new Date(dateValue._seconds * 1000);
    }

    // Handle string dates
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }

    return null;
  } catch {
    return null;
  }
}

export default function ClientsDirectory() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await ClientsAPI.list();
        const data = response.data || [];
        const list = Array.isArray(data) ? data : [data];
        if (mounted) setItems(list.filter(Boolean));
      } catch (e: any) {
        setError(e?.message || "Failed to load clients");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => {
    let out = [...items];

    // text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((client) => {
        const hay = [
          client.fullName,
          client.email,
          client.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // sorting
    out.sort((a, b) => {
      const an = (a?.fullName || "").toLowerCase();
      const bn = (b?.fullName || "").toLowerCase();
      const ae = (a?.email || "").toLowerCase();
      const be = (b?.email || "").toLowerCase();
      const pe = (b?.phone || "").toLowerCase();
      const ac = a?.createdAt || "";
      const bc = b?.createdAt || "";

      if (sortBy === "name") return an.localeCompare(bn);
      if (sortBy === "email") return ae.localeCompare(be);
      if (sortBy === "recent") return (parseDate(bc)?.getTime() || 0) - (parseDate(ac)?.getTime() || 0);
      if (sortBy === "Phone") return pe.localeCompare(pe);
      // relevance (keep current order)
      return 0;
    });

    return out;
  }, [items, query, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Clients
            </h1>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email, phone…"
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
                value={sortBy}
                onChange={(value) => setSortBy(value as SortOption)}
                label="Sort"
                options={["relevance", "name", "email", "recent", "Phone"]}
              />
            </div>
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
            Failed to load clients: {error}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQuery("");
              setSortBy("relevance");
            }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((client) => (
              <li key={client.id}>
                <Link to={`/clients/${client.id}`} className="block">
                  <ClientCard
                    client={client}
                    onDeleted={(deletedId) =>
                      setItems((prev) => prev.filter((x) => x.id !== deletedId))
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

/* ---------------- UI Components ---------------- */
function Select({
  value,
  onChange,
  options = [],
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
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
            {capitalize(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClientCard({ client, onDeleted }: { client: Client; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = React.useState(false);

  const avatar = client?.profilePic ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      client?.fullName || "C"
    )}&radius=50`;

  async function handleDelete(e: React.MouseEvent) {
    // prevent the outer Link from navigating
    e.preventDefault();
    e.stopPropagation();

    if (!client?.id) return;
    const ok = window.confirm(`Delete ${client.fullName || "this client"}?`);
    if (!ok) return;

    try {
      setDeleting(true);
      await ClientsAPI.remove(client.id);
      onDeleted(client.id);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  }

  function handleEditClick(e: React.MouseEvent) {
    // prevent the outer Link from navigating; we'll navigate via <Link> below
    e.stopPropagation();
  }

  return (
    <div className="group flex w-full items-stretch gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-16 w-16 shrink-0">
        <img
          src={avatar}
          alt={client?.fullName || "avatar"}
          className="h-16 w-16 rounded-2xl object-cover"
        />
        <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full   "></span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {client?.fullName || "—"}
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              {client?.email || "No email provided."}
            </p>
          </div>
          <Badge>Client</Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {client?.phone && (
            <Chip>{client.phone}</Chip>
          )}
          <div className="ml-auto text-xs text-slate-500">
            {parseDate(client?.createdAt)?.toLocaleDateString() || "Unknown"}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {/* Edit navigates to /clients/:id/edit but should not trigger outer Link */}
          <Link
            to={`/clients/${client.id}/edit`}
            onClick={handleEditClick}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
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
        <SearchIcon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No clients found</h3>
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

function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- tiny inline icons (no deps) ---
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}