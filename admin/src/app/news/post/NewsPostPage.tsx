import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { NewsAPI } from "../../../config/api";
import { uploadImage, validateImageFile } from "../../../config/storage";
import type { UploadProgress } from "../../../config/storage";

// Legal categories for news articles
const LEGAL_CATEGORIES = [
  "CIVIL MATTERS",
  "CRIMINAL MATTERS",
  "FAMILY MATTERS",
  "LABOUR/EMPLOYEE MATTERS",
  "TAXATION MATTERS",
  "DOCUMENTATION & REGISTRATION",
  "TRADEMARK & COPYRIGHT MATTERS",
  "HIGH COURT MATTERS",
  "SUPREME COURT MATTERS",
  "FORUMS AND TRIBUNAL MATTERS",
  "BUSINESS MATTERS"
];

export default function NewsPostPage() {
  const navigate = useNavigate();

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState<{
    title: string;
    imageUrl: string;
    description: string;
    brief: string;
    source: string;
    liveLink: string;
    category: string;
    views: number;
    isTrending: boolean;
    published: boolean;
  }>({
    title: "",
    imageUrl: "",
    description: "",
    brief: "",
    source: "",
    liveLink: "",
    category: "",
    views: 0,
    isTrending: false,
    published: false,
  });

  // Image upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress>({
    progress: 0,
    isUploading: false,
    error: null,
  });

  function onChange<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadProgress({
        progress: 0,
        isUploading: false,
        error: validation.error || "Invalid file"
      });
      return;
    }

    setSelectedFile(file);
    setUploadProgress({ progress: 0, isUploading: false, error: null });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Remove selected file
  function handleRemoveFile() {
    setSelectedFile(null);
    setImagePreview("");
    setUploadProgress({ progress: 0, isUploading: false, error: null });
    // Clear the imageUrl from form if it was previously uploaded
    if (form.imageUrl) {
      setForm(prev => ({ ...prev, imageUrl: "" }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      // Validate required fields
      if (!form.title.trim()) {
        setError("Please enter a title");
        return;
      }
      if (!form.description.trim()) {
        setError("Please enter the article content");
        return;
      }
      if (!form.category.trim()) {
        setError("Please select a category");
        return;
      }
      if (!selectedFile && !form.imageUrl.trim()) {
        setError("Please select an image file or provide an image URL");
        return;
      }

      let finalImageUrl = form.imageUrl;

      // Upload image to Firebase Storage if a file is selected
      if (selectedFile) {
        try {
          setUploadProgress({ progress: 0, isUploading: true, error: null });
          finalImageUrl = await uploadImage(selectedFile, 'news', setUploadProgress);
          setForm(prev => ({ ...prev, imageUrl: finalImageUrl }));
        } catch (uploadError: unknown) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          setError(`Image upload failed: ${errorMessage}`);
          return;
        }
      }

      const response = await NewsAPI.create({
        ...form,
        imageUrl: finalImageUrl
      });

      const newArticle = response.data;
      navigate(`/news/${newArticle.id}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to create article";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Create News Article">
      <BackBar to="/news" label="← Back to News" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Article Content</h3>
            <Input
              label="Title"
              value={form.title}
              onChange={(v) => onChange("title", v)}
              required
              placeholder="Enter article title..."
            />
            <Textarea
              label="Brief Summary"
              value={form.brief}
              onChange={(v) => onChange("brief", v)}
              rows={3}
              placeholder="Write a brief summary of the article..."
            />
            <Textarea
              label="Full Description"
              value={form.description}
              onChange={(v) => onChange("description", v)}
              rows={10}
              required
              placeholder="Write the full article content..."
            />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Media & Links</h3>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-600">
                  Article Image *
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                </div>
              </label>

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Upload Progress */}
              {uploadProgress.isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Uploading...</span>
                    <span className="text-slate-600">{uploadProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-slate-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadProgress.error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  {uploadProgress.error}
                </div>
              )}

              {/* Alternative URL input (for existing images or external URLs) */}
              <div className="border-t pt-3">
                <Input
                  label="Or enter Image URL (optional)"
                  value={form.imageUrl}
                  onChange={(v) => onChange("imageUrl", v)}
                  placeholder="https://example.com/image.jpg"
                  disabled={!!selectedFile}
                />
                {selectedFile && (
                  <div className="mt-1 text-xs text-slate-500">
                    URL input disabled when file is selected
                  </div>
                )}
              </div>
            </div>

            <Input
              label="Source"
              value={form.source}
              onChange={(v) => onChange("source", v)}
              placeholder="Article source or author"
            />
            <Input
              label="Live Link"
              type="url"
              value={form.liveLink}
              onChange={(v) => onChange("liveLink", v)}
              placeholder="https://original-article-link.com"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Settings</h3>
            <Select
              label="Category *"
              value={form.category}
              onChange={(v) => onChange("category", v)}
              options={LEGAL_CATEGORIES}
              placeholder="Select a category"
            />
            <Input
              label="Initial Views"
              type="number"
              min={0}
              value={String(form.views || 0)}
              onChange={(v) => onChange("views", Number(v))}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Switch
                label="Published"
                checked={!!form.published}
                onChange={(v) => onChange("published", v)}
              />
              <Switch
                label="Trending"
                checked={!!form.isTrending}
                onChange={(v) => onChange("isTrending", v)}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Publishing Options</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p>• <strong>Published:</strong> Makes the article visible to users</p>
              <p>• <strong>Trending:</strong> Highlights the article as trending content</p>
              <p>• <strong>Views:</strong> Initial view count (will increment automatically)</p>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || uploadProgress.isUploading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? (selectedFile ? "Uploading & Creating..." : "Creating...")
                : selectedFile
                ? "Upload & Create Article"
                : "Create Article"
              }
            </button>
            <Link
              to="/news"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

/* ---------------- Small UI components ---------------- */
function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function BackBar({ to = "/news", label = "← Back to list" }: { to?: string; label?: string }) {
  return (
    <div className="mb-4">
      <Link to={to} className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
        {label}
      </Link>
    </div>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  required = false,
  placeholder = "",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  min?: number;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
        }`}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-slate-700">{label}</span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-slate-900" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
