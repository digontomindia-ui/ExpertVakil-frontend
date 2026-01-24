import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NewsAPI, type NewsPost } from "../../../config/api";

export default function NewsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState<Partial<NewsPost>>({
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

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await NewsAPI.getById(id);
        const news: NewsPost = response.data;
        if (mounted && news) setForm(news);
      } catch (e: any) {
        setError(e?.message || "Failed to load news article");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  function onChange<K extends keyof NewsPost>(key: K, value: NewsPost[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError("");

      await NewsAPI.updateById(id, {
        title: form.title || "",
        imageUrl: form.imageUrl || "",
        description: form.description || "",
        brief: form.brief || "",
        source: form.source || "",
        liveLink: form.liveLink || "",
        category: form.category || "",
        views: form.views || 0,
        isTrending: form.isTrending || false,
        published: form.published || false,
      });

      navigate(`/news/${id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return (
      <PageShell title="Invalid request">
        <BackBar />
        <Card className="p-6">Missing news article id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Edit News Article"><Skeleton /></PageShell>;

  return (
    <PageShell title="Edit News Article">
      <BackBar to={`/news/${id}`} label="← Back to article" />
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
              value={form.title || ""}
              onChange={(v) => onChange("title", v)}
              required
            />
            <Textarea
              label="Brief Summary"
              value={form.brief || ""}
              onChange={(v) => onChange("brief", v)}
              rows={3}
            />
            <Textarea
              label="Full Description"
              value={form.description || ""}
              onChange={(v) => onChange("description", v)}
              rows={8}
              required
            />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Media & Links</h3>
            <Input
              label="Image URL"
              value={form.imageUrl || ""}
              onChange={(v) => onChange("imageUrl", v)}
            />
            <Input
              label="Source"
              value={form.source || ""}
              onChange={(v) => onChange("source", v)}
            />
            <Input
              label="Live Link"
              type="url"
              value={form.liveLink || ""}
              onChange={(v) => onChange("liveLink", v)}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Settings</h3>
            <Input
              label="Category"
              value={form.category || ""}
              onChange={(v) => onChange("category", v)}
            />
            <Input
              label="Views"
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

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Article Details</h3>
            <Readonly label="Article ID" value={form.id || "—"} />
            <Readonly
              label="Created At"
              value={form.createdAt ? new Date(form.createdAt as any).toLocaleDateString() : "Unknown"}
            />
            <Readonly
              label="Updated At"
              value={(form as any).updatedAt ? new Date((form as any).updatedAt).toLocaleDateString() : "Unknown"}
            />
          </Card>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              to={`/news/${id}`}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  min?: number;
  required?: boolean;
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
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

function Readonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <>
      <div className="h-16 w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-28 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </>
  );
}
