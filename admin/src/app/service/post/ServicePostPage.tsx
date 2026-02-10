// src/app/service/post/ServicePostPage.tsx
"use client";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ServicesAPI, UploadAPI } from "../../../config/api";

type ImageInputMode = "upload" | "url";

export default function ServicePostPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [imageInputMode, setImageInputMode] = useState<ImageInputMode>("upload");
    const [imageUrl, setImageUrl] = useState("");
    const [number, setNumber] = useState("");
    const [categories, setCategories] = useState("");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
        if (!allowedTypes.includes(file.type)) {
            setError("Only image files are allowed (jpeg, jpg, png, gif, webp, svg)");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError("File size must be less than 5MB");
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        try {
            setError("");
            setUploading(true);
            const response = await UploadAPI.uploadFile(file, "services");
            setImage(response.data.url);
        } catch (err: any) {
            setError(err?.message || "Failed to upload image");
            setImagePreview("");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setImage("");
        setImagePreview("");
        setImageUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUrlChange = (url: string) => {
        setImageUrl(url);
        setImage(url);
        setImagePreview(url);
    };

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

            await ServicesAPI.create({
                name: name.trim(),
                description: description.trim() || undefined,
                image: image || undefined,
                number: number.trim() || undefined,
                categories: categoriesArray,
            });

            alert("Service created successfully!");
            navigate("/services");
        } catch (err: any) {
            setError(err?.message || "Failed to create service");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="border-b bg-white">
                <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-slate-900">Create New Service</h1>
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

                    {/* Service Image */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-900">
                            Service Image
                        </label>

                        {/* Toggle Buttons for Upload/URL */}
                        <div className="mb-3 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setImageInputMode("upload")}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${imageInputMode === "upload"
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                📤 Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageInputMode("url")}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${imageInputMode === "url"
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                🔗 Enter URL
                            </button>
                        </div>

                        {/* Upload Mode */}
                        {imageInputMode === "upload" && (
                            <>
                                {!image && !imagePreview ? (
                                    <div
                                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${uploading
                                                ? "border-blue-300 bg-blue-50"
                                                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                            disabled={uploading}
                                        />
                                        {uploading ? (
                                            <>
                                                <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                                                <p className="text-sm font-medium text-blue-600">Uploading...</p>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="mb-1 text-sm font-medium text-slate-700">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    PNG, JPG, GIF, WebP, SVG (max 5MB)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <img
                                            src={imagePreview || image}
                                            alt="Preview"
                                            className="h-20 w-20 rounded-lg border border-slate-200 object-contain bg-white"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">
                                                {uploading ? "Uploading..." : "Image uploaded"}
                                            </span>
                                            {image && (
                                                <span className="mt-1 text-xs text-green-600">
                                                    ✓ Ready to save
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                                            disabled={uploading}
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* URL Mode */}
                        {imageInputMode === "url" && (
                            <div className="space-y-3">
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    placeholder="https://example.com/image.png"
                                />
                                {imageUrl && (
                                    <div className="relative inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="h-20 w-20 rounded-lg border border-slate-200 object-contain bg-white"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f1f5f9" width="80" height="80"/><text x="50%" y="50%" fill="%2394a3b8" font-size="12" text-anchor="middle" dy=".3em">Invalid URL</text></svg>';
                                            }}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">URL Preview</span>
                                            <span className="mt-1 text-xs text-green-600">✓ Ready to save</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="mt-2 text-xs text-slate-500">
                            Upload an image file or enter a URL (recommended: 64x64 or 128x128 PNG)
                        </p>
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
                            disabled={submitting || uploading}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {submitting ? "Creating..." : "Create Service"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
