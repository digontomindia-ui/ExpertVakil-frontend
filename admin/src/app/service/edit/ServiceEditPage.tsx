// src/app/service/edit/ServiceEditPage.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServicesAPI } from "../../../config/api";

export default function ServiceEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [number, setNumber] = useState("");
    const [categories, setCategories] = useState("");

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
                const service = response.data;

                setName(service.name || "");
                setDescription(service.description || "");
                setNumber(service.number || "");
                setCategories((service.categories || []).join(", "));
            } catch (err: any) {
                setError(err?.message || "Failed to load service");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Service name is required");
            return;
        }

        try {
            setError("");
            setSubmitting(true);

            const categoriesArray = categories
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean);

            await ServicesAPI.updateById(id!, {
                name: name.trim(),
                description: description.trim() || undefined,
                number: number.trim() || undefined,
                categories: categoriesArray,
            });

            alert("Service updated successfully!");
            navigate("/services");
        } catch (err: any) {
            setError(err?.message || "Failed to update service");
        } finally {
            setSubmitting(false);
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="border-b bg-white">
                <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-slate-900">Edit Service</h1>
                        <button
                            type="button"
                            onClick={() => navigate("/services")}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-900">
                            Service Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            placeholder="e.g., Legal Consultation"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-900">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            placeholder="Provide a brief description of the service..."
                        />
                    </div>

                    {/* Contact Number */}
                    <div>
                        <label htmlFor="number" className="mb-1.5 block text-sm font-medium text-slate-900">
                            Contact Number
                        </label>
                        <input
                            id="number"
                            type="tel"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            placeholder="e.g., +91 9876543210"
                        />
                        <p className="mt-1 text-xs text-slate-500">Optional contact number for this service</p>
                    </div>

                    {/* Categories */}
                    <div>
                        <label htmlFor="categories" className="mb-1.5 block text-sm font-medium text-slate-900">
                            Categories
                        </label>
                        <input
                            id="categories"
                            type="text"
                            value={categories}
                            onChange={(e) => setCategories(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            placeholder="e.g., Legal, Consultation, Property"
                        />
                        <p className="mt-1 text-xs text-slate-500">Comma-separated list of categories</p>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/services")}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {submitting ? "Updating..." : "Update Service"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
