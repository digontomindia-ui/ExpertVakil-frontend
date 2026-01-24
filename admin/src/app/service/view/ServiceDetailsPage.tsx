// src/app/service/view/ServiceDetailsPage.tsx
"use client";
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ServicesAPI, type Service } from "../../../config/api";

type FirestoreTimestamp = {
    _seconds: number;
    _nanoseconds?: number;
};

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
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
}

export default function ServiceDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [service, setService] = useState<Service | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Load service data
    useEffect(() => {
        if (!id) {
            navigate("/services");
            return;
        }

        (async () => {
            try {
                setLoading(true);
                const response = await ServicesAPI.getById(id);
                setService(response.data);
            } catch (err: any) {
                setError(err?.message || "Failed to load service");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!service?.id) return;

        const ok = window.confirm(
            `Are you sure you want to delete "${service.name}"? This action cannot be undone.`
        );
        if (!ok) return;

        try {
            setDeleting(true);
            await ServicesAPI.deleteById(service.id);
            alert("Service deleted successfully!");
            navigate("/services");
        } catch (err: any) {
            alert(`Failed to delete: ${err?.message || "Unknown error"}`);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
                    <p className="text-sm text-slate-600">Loading service...</p>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <h2 className="mb-2 text-lg font-semibold text-red-900">Error Loading Service</h2>
                    <p className="mb-4 text-sm text-red-700">{error || "Service not found"}</p>
                    <button
                        onClick={() => navigate("/services")}
                        className="rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        Back to Services
                    </button>
                </div>
            </div>
        );
    }

    const created = tsToDate(service.createdAt);
    const updated = tsToDate(service.updatedAt);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="border-b bg-white">
                <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => navigate("/services")}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            ← Back
                        </button>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/services/edit/${service.id}`}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-slate-900">{service.name}</h1>

                    {/* Metadata */}
                    <div className="mt-4 flex flex-wrap gap-4 border-b border-slate-100 pb-4 text-sm text-slate-600">
                        {created && (
                            <div>
                                <span className="font-medium">Created:</span> {formatDate(created)}
                            </div>
                        )}
                        {updated && updated.getTime() !== created?.getTime() && (
                            <div>
                                <span className="font-medium">Updated:</span> {formatDate(updated)}
                            </div>
                        )}
                    </div>

                    {/* Contact Number */}
                    {service.number && (
                        <div className="mt-6">
                            <h2 className="mb-2 text-sm font-medium text-slate-900">Contact Number</h2>
                            <div className="flex items-center gap-2 text-slate-700">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                <span>{service.number}</span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {service.description && (
                        <div className="mt-6">
                            <h2 className="mb-2 text-sm font-medium text-slate-900">Description</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{service.description}</p>
                        </div>
                    )}

                    {/* Categories */}
                    {service.categories && service.categories.length > 0 && (
                        <div className="mt-6">
                            <h2 className="mb-2 text-sm font-medium text-slate-900">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                {service.categories.map((cat, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Service ID */}
                    <div className="mt-6 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                            <span className="font-medium">Service ID:</span> {service.id}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
