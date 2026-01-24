// src/pages/lawyers/LawyersDirectory.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom"; // ✅ NEW
import { API_URLS } from "../../../config/api";

// TypeScript interfaces
interface User {
  id: string;
  email?: string;
  loginType?: string;
  profilePic?: string;
  fcmToken?: string;
  countryCode?: string;
  phoneNumber?: string;
  walletAmount: string;
  isActive?: boolean;
  isVerify?: boolean;
  travelPreference?: any;
  createdAt?: any;
  reviewCount: string;
  reviewSum: string;
  bio: string;
  userType?: string;
  fullName?: string;
  specializations?: string[];
  services?: string[];
  courts?: string[];
  city?: string;
  completeAddress?: string;
  isAddressPublic?: boolean;
  yearsOfExperience?: number;
  languages?: string[];
  gender?: string;
  isOnline?: boolean;
  lastSeen?: any;
  updatedAt?: any;
  state?: string;
}

type SortOption = "relevance" | "experience" | "reviews" | "recent";
const API_URL = API_URLS.USERS;

export default function LawyersDirectory() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [spec, setSpec] = useState<string>("all");
  const [lang, setLang] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  // 🧹 Removed slide-over state
  // const [open, setOpen] = useState<boolean>(false);
  // const [active, setActive] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const response = await res.json();
        const data = response.data || [];
        const list = Array.isArray(data) ? data : [data];
        if (mounted) setItems(list.filter(Boolean));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const allSpecs = useMemo(() => {
    const s = new Set<string>();
    items.forEach((u) => (u?.specializations || []).forEach((x) => s.add(x)));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  const allLangs = useMemo(() => {
    const s = new Set<string>();
    items.forEach((u) => (u?.languages || []).forEach((x) => s.add(x)));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  const visible = useMemo(() => {
    let out = [...items];

    // text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((u) => {
        const hay = [
          u.fullName,
          u.id,
          u.phoneNumber,
          u.city,
          u.state,
          u.bio,
          (u.specializations || []).join(" "),
          (u.services || []).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // specialization filter
    if (spec !== "all") {
      out = out.filter((u) => (u.specializations || []).includes(spec));
    }

    // language filter
    if (lang !== "all") {
      out = out.filter((u) => (u.languages || []).includes(lang));
    }

    // sorting
    out.sort((a, b) => {
      const ax = Number(a?.yearsOfExperience || 0);
      const bx = Number(b?.yearsOfExperience || 0);
      const ar = Number(a?.reviewSum || 0);
      const br = Number(b?.reviewSum || 0);
      const ac = Number(a?.reviewCount || 0);
      const bc = Number(b?.reviewCount || 0);
      const at = a?.createdAt?._seconds || 0;
      const bt = b?.createdAt?._seconds || 0;
      if (sortBy === "experience") return bx - ax;
      if (sortBy === "reviews") return br - ar || bc - ac;
      if (sortBy === "recent") return bt - at;
      // relevance (keep current order)
      return 0;
    });

    return out;
  }, [items, query, spec, lang, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Lawyers
            </h1>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, ID, phone, city…"
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
                value={spec}
                onChange={setSpec}
                label="Specialization"
                options={allSpecs as string[]}
              />
              <Select
                value={lang}
                onChange={setLang}
                label="Language"
                options={allLangs as string[]}
              />
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value as SortOption)}
                label="Sort"
                options={["relevance", "experience", "reviews", "recent"]}
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
            Failed to load lawyers: {error}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQuery("");
              setSpec("all");
              setLang("all");
              setSortBy("relevance");
            }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((u) => (
              <li key={u.id}>
                <Link to={`/lawyers/${u.id}`} className="block">
                  <LawyerCard
                    u={u}
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

/* ---------------- UI bits (unchanged) ---------------- */
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

function LawyerCard({ u, onDeleted }: { u: User; onDeleted: (id: string) => void }) {
  const xp = Number(u?.yearsOfExperience || 0);
  const reviews = Number(u?.reviewCount || 0);
  const rating = Number(u?.reviewSum || 0);
  const online = !!u?.isOnline;
  const [deleting, setDeleting] = React.useState(false);

  const avatar =
    u?.profilePic ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      u?.fullName || "A"
    )}\u0026radius=50`;

  async function handleDelete(e: React.MouseEvent) {
    // prevent the outer Link from navigating
    e.preventDefault();
    e.stopPropagation();

    if (!u?.id) return;
    const ok = window.confirm(`Delete ${u.fullName || "this lawyer"}?`);
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch(API_URLS.USER_BY_ID(u.id), { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onDeleted(u.id);
    } catch (err) {
      alert(`Failed to delete: ${(err as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }

  function handleEditClick(e: React.MouseEvent) {
    // prevent the outer Link from navigating; we’ll navigate via <Link> below
    e.stopPropagation();
  }

  return (
    <div className="group flex w-full items-stretch gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-16 w-16 shrink-0">
        <img
          src={avatar}
          alt={u?.fullName || "avatar"}
          className="h-16 w-16 rounded-2xl object-cover"
        />
        <span
          className={`absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white ${online ? "bg-emerald-500" : "bg-slate-300"
            }`}
        ></span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {u?.fullName || "—"}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
              {u?.bio || "No bio provided."}
            </p>
          </div>
          <Badge>{xp} yrs</Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(u?.specializations || [])
            .slice(0, 3)
            .map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          {u?.city && (
            <div className="ml-auto text-xs text-slate-500">
              {u.city}
              {u?.state ? `, ${u.state}` : ""}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <StarIcon className="h-4 w-4" /> {rating.toFixed(1)} ({reviews})
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldIcon className="h-4 w-4" /> {capitalize(u?.userType || "individual")}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {/* Edit navigates to /lawyers/:id/edit but should not trigger outer Link */}
          <Link
            to={`/lawyers/${u.id}/edit`}
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
    <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
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
      <h3 className="text-lg font-semibold text-slate-900">No lawyers found</h3>
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
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.3 6.2 20l1.1-6.5L2 8.9l6.6-1L12 2l3.4 5.9 6.6 1-4.8 4.6L17.8 20z" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
