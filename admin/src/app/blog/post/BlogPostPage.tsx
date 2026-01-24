import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BlogsAPI } from "../../../config/api";

export default function BlogPostPage() {
  const navigate = useNavigate();

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState<{
    title: string;
    category: string;
    subtitle: string;
    description: string;
    image: string;
    published: boolean;
  }>({
    title: "",
    category: "",
    subtitle: "",
    description: "",
    image: "",
    published: false,
  });

  function onChange<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const response = await BlogsAPI.create(form);

      const newBlog = response.data;
      navigate(`/blogs/${newBlog.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create blog post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Create Blog Post">
      <BackBar to="/blogs" label="← Back to Blogs" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Blog Content</h3>
            <Input
              label="Title"
              value={form.title}
              onChange={(v) => onChange("title", v)}
              required
              placeholder="Enter blog post title..."
            />
            <Input
              label="Subtitle"
              value={form.subtitle}
              onChange={(v) => onChange("subtitle", v)}
              placeholder="Enter blog subtitle (optional)..."
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(v) => onChange("description", v)}
              rows={10}
              required
              placeholder="Write the full blog post content..."
            />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Details</h3>
            <Input
              label="Category"
              value={form.category}
              onChange={(v) => onChange("category", v)}
              placeholder="e.g. Legal Advice, Case Studies, News"
            />
            <Input
              label="Image URL (optional)"
              value={form.image}
              onChange={(v) => onChange("image", v)}
              placeholder="https://example.com/blog-image.jpg"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Publishing</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Switch
                label="Published"
                checked={form.published}
                onChange={(v) => onChange("published", v)}
              />
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>• <strong>Published:</strong> Makes the blog post visible to users immediately</p>
              <p>• <strong>Draft:</strong> Keeps the post private for editing</p>
              <p>• <strong>Category:</strong> Helps organize and filter blog posts</p>
              <p>• <strong>Subtitle:</strong> Optional secondary title for more context</p>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Content Tips</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p>• Use clear, engaging titles that capture attention</p>
              <p>• Write comprehensive content that provides value</p>
              <p>• Add relevant categories for better discoverability</p>
              <p>• Consider adding an image to enhance visual appeal</p>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Blog Post"}
            </button>
            <Link
              to="/blogs"
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

function BackBar({ to = "/blogs", label = "← Back to list" }: { to?: string; label?: string }) {
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
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />
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
