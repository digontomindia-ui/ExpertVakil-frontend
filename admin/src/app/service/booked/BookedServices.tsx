// src/app/service/booked/BookedServices.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ServicesBookedAPI } from "../../../config/api";

// ---- Types ----
export type FirestoreTimestamp = {
    _seconds: number;
    _nanoseconds?: number;
};

export type ServiceBookedItem = {
    id: string;
    clientId: string;
    phoneNumber: string;
    title: string;
    description?: string;
    servicesBooked: string[];
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
export default function BookedServices() {
    const [items, setItems] = useState<ServiceBookedItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const [q, setQ] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("newest");

    // Load booked services
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const response = await ServicesBookedAPI.list();
                const data = response.data || [];
                const list = Array.isArray(data) ? data : data ? [data] : [];
                if (mounted) setItems(list.filter(Boolean));
            } catch (e: any) {
                setError(e instanceof Error ? e.message : "Failed to load booked services");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Filter and sort bookings
    const visible = useMemo(() => {
        let out = [...items];

        // text search
        if (q.trim()) {
            const query = q.trim().toLowerCase();
            out = out.filter((booking) => {
                const hay = [
                    booking.title,
                    booking.description,
                    booking.phoneNumber,
                    booking.clientId,
                    ...(booking.servicesBooked || []),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return hay.includes(query);
            });
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
    }, [items, q, sortBy]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Booked Services
                        </h1>
                        <div className="text-sm text-slate-600">
                            Total: <span className="font-semibold">{items.length}</span> bookings
                        </div>
                    </div>

                    {/* Filters row */}
                    <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by title, phone, client ID…"
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
                        Failed to load booked services: {error}
                    </div>
                ) : visible.length === 0 ? (
                    <EmptyState
                        onReset={() => {
                            setQ("");
                            setSortBy("newest");
                        }}
                    />
                ) : (
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((booking) => (
                            <li key={booking.id}>
                                <BookingCard
                                    booking={booking}
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

function BookingCard({
    booking,
    onDeleted,
}: {
    booking: ServiceBookedItem;
    onDeleted: (id: string) => void;
}) {
    const [deleting, setDeleting] = React.useState(false);

    const created = tsToDate(booking.createdAt);

    async function handleDelete(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (!booking?.id) return;
        const ok = window.confirm(`Delete booking "${booking.title}"?`);
        if (!ok) return;

        try {
            setDeleting(true);
            await ServicesBookedAPI.deleteById(booking.id);
            onDeleted(booking.id);
        } catch (err: any) {
            alert(`Failed to delete: ${err?.message || "Unknown error"}`);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-900">{booking.title}</h3>
                    {booking.description && (
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{booking.description}</p>
                    )}

                    {/* Contact Info */}
                    <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                            </svg>
                            <span>{booking.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <span className="truncate" title={booking.clientId}>
                                Client: {booking.clientId.slice(0, 8)}...
                            </span>
                        </div>
                    </div>

                    {/* Services */}
                    {booking.servicesBooked && booking.servicesBooked.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {booking.servicesBooked.slice(0, 2).map((service, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                                >
                                    {service}
                                </span>
                            ))}
                            {booking.servicesBooked.length > 2 && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                                    +{booking.servicesBooked.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-500">
                    {created && (
                        <div>
                            {formatDate(created)} • {formatTime(created)}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                    {deleting ? "…" : "×"}
                </button>
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No bookings found</h3>
            <p className="mt-1 text-sm text-slate-600">
                No service bookings have been made yet or try clearing filters.
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
