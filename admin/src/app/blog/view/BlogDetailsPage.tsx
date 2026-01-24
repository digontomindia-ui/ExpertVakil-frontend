import React from "react";
import { useParams, Link } from "react-router-dom";
import { BlogsAPI, type BlogPost } from "../../../config/api";

export default function BlogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const response = await BlogsAPI.getById(id);
        const data: BlogPost | null = response.data ?? null;
        if (mounted) setBlog(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load blog post");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  if (!id) {
    return (
      <PageShell title="Invalid request">
        <BackBar />
        <Card className="p-6">Missing blog post id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Blog Post Details"><Skeleton /></PageShell>;

  if (error) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn't load blog post</h1>
          <p className="mt-1 text-slate-600">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (!blog) {
    return (
      <PageShell title="Not found">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Blog post not found</h1>
          <p className="mt-1 text-slate-600">The blog post you're looking for doesn't exist.</p>
        </Card>
      </PageShell>
    );
  }

  const created = blog.createdAt ? new Date(blog.createdAt as any) : null;
  const updated = (blog as any).updatedAt ? new Date((blog as any).updatedAt) : null;

  return (
    <PageShell title="Blog Post Details">
      <BackBar />

      {/* Header Card */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{blog.title}</h1>
            {blog.subtitle && (
              <p className="text-lg text-slate-600 mb-4 italic">{blog.subtitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <StatusBadge published={blog.published} />
              {blog.category && (
                <CategoryBadge category={blog.category} />
              )}
              {created && <span>Published: {created.toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/blogs/${id}/edit`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Image */}
        {blog.image && (
          <div className="rounded-xl overflow-hidden max-w-4xl">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}
      </Card>

      {/* Content */}
      <Card className="p-6">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">{blog.description}</p>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Additional content sections can go here */}
        </div>

        <div className="space-y-6">
          {/* Blog Stats */}
          <div className="grid grid-cols-1 gap-3">
            <Stat label="Status" value={blog.published ? "Published" : "Draft"} />
            {blog.category && <Stat label="Category" value={blog.category} />}
          </div>

          {/* Blog Details */}
          <Section title="Post Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Post ID:</span>
                <span className="font-mono text-slate-900 text-xs">{blog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Created:</span>
                <span className="text-slate-900">
                  {created ? created.toLocaleDateString() : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Updated:</span>
                <span className="text-slate-900">
                  {updated ? updated.toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>
          </Section>

          {/* Actions */}
          <Section title="Actions">
            <div className="space-y-2">
              <Link
                to={`/blogs/${id}/edit`}
                className="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Post
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this blog post?')) {
                    BlogsAPI.deleteById(id).then(() => {
                      window.location.href = '/blogs';
                    }).catch(err => {
                      alert('Failed to delete blog post: ' + err.message);
                    });
                  }
                }}
                className="w-full inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Delete Post
              </button>
            </div>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

/* ---------- UI Components ---------- */
function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function BackBar() {
  return (
    <div className="mb-4">
      <Link to="/" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
        ← Back to Blogs
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>
      <Card className="p-4">{children}</Card>
    </section>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function StatusBadge({ published }: { published?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-700">
      {category}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <>
      <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-48 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-28 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </>
  );
}
