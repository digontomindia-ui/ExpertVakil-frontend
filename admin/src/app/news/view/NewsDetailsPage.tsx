import React from "react";
import { useParams, Link } from "react-router-dom";
import { NewsAPI, type NewsPost } from "../../../config/api";

export default function NewsDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = React.useState<NewsPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const response = await NewsAPI.getById(id);
        const data: NewsPost | null = response.data ?? null;
        if (mounted) setNews(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load news article");
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
        <Card className="p-6">Missing news article id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="News Article Details"><Skeleton /></PageShell>;

  if (error) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn't load article</h1>
          <p className="mt-1 text-slate-600">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (!news) {
    return (
      <PageShell title="Not found">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Article not found</h1>
          <p className="mt-1 text-slate-600">The article you're looking for doesn't exist.</p>
        </Card>
      </PageShell>
    );
  }

  const created = news.createdAt ? new Date(news.createdAt as any) : null;
  const updated = (news as any).updatedAt ? new Date((news as any).updatedAt) : null;

  return (
    <PageShell title="News Article Details">
      <BackBar />

      {/* Header Card */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{news.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {news.category && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {news.category}
                </span>
              )}
              {news.source && <span>Source: {news.source}</span>}
              {created && <span>Published: {created.toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/news/${id}/edit`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Image */}
        {news.imageUrl && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Brief Summary */}
        {news.brief && (
          <div className="border-l-4 border-slate-300 pl-4 py-2">
            <p className="text-slate-700 italic">{news.brief}</p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Full Description */}
          {news.description && (
            <Section title="Article Content">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{news.description}</p>
              </div>
            </Section>
          )}

          {/* Links */}
          {(news.liveLink || news.source) && (
            <Section title="External Links">
              <div className="space-y-3">
                {news.liveLink && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 min-w-[80px]">Live Link:</span>
                    <a
                      href={news.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                    >
                      {news.liveLink}
                    </a>
                  </div>
                )}
                {news.source && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 min-w-[80px]">Source:</span>
                    <span className="text-slate-900">{news.source}</span>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          {/* Article Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Views" value={String(news.views || 0)} />
            <Stat label="Trending" value={news.isTrending ? "Yes" : "No"} />
            <Stat label="Published" value={news.published ? "Yes" : "No"} />
            <Stat label="Status" value={news.published ? "Published" : "Draft"} />
          </div>

          {/* Article Details */}
          <Section title="Article Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Article ID:</span>
                <span className="font-mono text-slate-900 text-xs">{news.id}</span>
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
                to={`/news/${id}/edit`}
                className="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Article
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this article?')) {
                    NewsAPI.deleteById(id).then(() => {
                      window.location.href = '/news';
                    }).catch(err => {
                      alert('Failed to delete article: ' + err.message);
                    });
                  }
                }}
                className="w-full inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Delete Article
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
      <Link to="/news" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
        ← Back to News
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
