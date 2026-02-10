"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CategoriesAPI, UploadAPI, type Category } from "../../config/api";

type ImageInputMode = "upload" | "url";

export default function CategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        image: "",
        order: 0,
        isActive: true,
    });

    // Image upload state
    const [imageInputMode, setImageInputMode] = useState<ImageInputMode>("upload");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await CategoriesAPI.getAll();
            // The request function returns { success: boolean, data: Category[] } directly
            setCategories(response.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: "", subtitle: "", image: "", order: 0, isActive: true });
        setImageFile(null);
        setImagePreview("");
        setImageInputMode("upload");
        setEditingId(null);
        setShowAddForm(false);
    };

    const handleEdit = (category: Category) => {
        setFormData({
            title: category.title,
            subtitle: category.subtitle,
            image: category.image,
            order: category.order,
            isActive: category.isActive,
        });
        setImagePreview(category.image);
        // Detect if it's a Firebase URL or external URL
        if (category.image?.includes("firebasestorage.googleapis.com")) {
            setImageInputMode("upload");
        } else if (category.image) {
            setImageInputMode("url");
        }
        setEditingId(category.id);
        setShowAddForm(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setError("Title is required");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            let imageUrl = formData.image;

            // Upload image if file is selected
            if (imageInputMode === "upload" && imageFile) {
                setUploading(true);
                try {
                    const uploadResponse = await UploadAPI.uploadFile(imageFile, "categories");
                    imageUrl = uploadResponse.data.url;
                } catch (uploadErr: any) {
                    setError(uploadErr.message || "Failed to upload image");
                    return;
                } finally {
                    setUploading(false);
                }
            } else if (imageInputMode === "url") {
                imageUrl = formData.image;
            }

            const payload = {
                ...formData,
                image: imageUrl,
            };

            if (editingId) {
                await CategoriesAPI.update(editingId, payload);
            } else {
                payload.order = categories.length; // Add at the end
                await CategoriesAPI.create(payload);
            }

            await fetchCategories();
            resetForm();
        } catch (err: any) {
            setError(err.message || "Failed to save category");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            await CategoriesAPI.remove(id);
            await fetchCategories();
        } catch (err: any) {
            setError(err.message || "Failed to delete category");
        }
    };

    const handleToggleActive = async (category: Category) => {
        try {
            await CategoriesAPI.update(category.id, { isActive: !category.isActive });
            await fetchCategories();
        } catch (err: any) {
            setError(err.message || "Failed to update category");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600 mt-1">Manage browse by category section</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingId ? "Edit Category" : "Add New Category"}
                                </h2>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g., Civil Matters"
                                    required
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g., Property, Contracts, Disputes"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>

                                {/* Toggle Buttons */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode("upload")}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${imageInputMode === "upload"
                                            ? "bg-amber-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        📤 Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode("url")}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${imageInputMode === "url"
                                            ? "bg-amber-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        🔗 Enter URL
                                    </button>
                                </div>

                                {/* Upload Mode */}
                                {imageInputMode === "upload" && (
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {imagePreview || formData.image ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview || formData.image}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview("");
                                                        setFormData({ ...formData, image: "" });
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-2 right-2 bg-white text-gray-700 px-3 py-1 rounded-lg text-sm font-medium shadow hover:bg-gray-50"
                                                >
                                                    Replace
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-amber-500 transition-colors"
                                            >
                                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-gray-600">Click to upload image</p>
                                                <p className="text-gray-400 text-sm mt-1">Max 5MB • JPG, PNG, GIF, WebP</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* URL Mode */}
                                {imageInputMode === "url" && (
                                    <div>
                                        <input
                                            type="url"
                                            value={formData.image}
                                            onChange={(e) => {
                                                setFormData({ ...formData, image: e.target.value });
                                                setImagePreview(e.target.value);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        {formData.image && (
                                            <div className="mt-4 relative">
                                                <img
                                                    src={formData.image}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Invalid+URL";
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                                <span className="text-sm font-medium text-gray-700">Active (visible on website)</span>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploading}
                                    className="flex-1 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {(saving || uploading) && (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    )}
                                    {uploading ? "Uploading..." : saving ? "Saving..." : editingId ? "Update Category" : "Add Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            {categories.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories yet</h3>
                    <p className="text-gray-400 mb-6">Add your first category to get started</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Add Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${category.isActive ? "border-gray-100" : "border-gray-200 opacity-60"
                                }`}
                        >
                            {/* Image */}
                            <div className="relative h-40 bg-gray-100">
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=No+Image";
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div
                                    className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${category.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {category.isActive ? "Active" : "Inactive"}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{category.title}</h3>
                                <p className="text-gray-500 text-sm mb-4">{category.subtitle || "No subtitle"}</p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="flex-1 px-4 py-2 bg-amber-50 text-amber-600 font-medium rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(category)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${category.isActive
                                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            : "bg-green-50 text-green-600 hover:bg-green-100"
                                            }`}
                                    >
                                        {category.isActive ? "Hide" : "Show"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
