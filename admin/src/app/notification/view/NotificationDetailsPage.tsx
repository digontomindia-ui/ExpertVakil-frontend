import React from "react";
import { useParams, Link } from "react-router-dom";
import { NotificationsAPI, type Notification } from "../../../config/api";

export default function NotificationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = React.useState<Notification | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const response = await NotificationsAPI.getById(id);
        const data: Notification | null = response.data ?? null;
        if (mounted) setNotification(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load notification");
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
        <Card className="p-6">Missing notification id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Notification Details"><Skeleton /></PageShell>;

  if (error) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn't load notification</h1>
          <p className="mt-1 text-slate-600">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (!notification) {
    return (
      <PageShell title="Not found">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Notification not found</h1>
          <p className="mt-1 text-slate-600">The notification you're looking for doesn't exist.</p>
        </Card>
      </PageShell>
    );
  }

  const created = notification.createdAt ? new Date(notification.createdAt as any) : null;
  const updated = (notification as any).updatedAt ? new Date((notification as any).updatedAt) : null;

  return (
    <PageShell title="Notification Details">
      <BackBar />

      {/* Header Card */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{notification.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <StatusBadge published={notification.published} />
              <ReadBadge read={notification.read} />
              {created && <span>Created: {created.toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/notifications/${id}/edit`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Image */}
        {notification.image && (
          <div className="rounded-xl overflow-hidden max-w-md">
            <img
              src={notification.image}
              alt={notification.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </Card>

      {/* Content */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Content</h3>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{notification.description}</p>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Additional content sections can go here */}
        </div>

        <div className="space-y-6">
          {/* Notification Stats */}
          <div className="grid grid-cols-1 gap-3">
            <Stat label="Status" value={notification.published ? "Published" : "Draft"} />
            <Stat label="Read Status" value={notification.read ? "Read" : "Unread"} />
          </div>

          {/* Notification Details */}
          <Section title="Notification Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Notification ID:</span>
                <span className="font-mono text-slate-900 text-xs">{notification.id}</span>
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
                to={`/notifications/${id}/edit`}
                className="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Notification
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this notification?')) {
                    NotificationsAPI.deleteById(id).then(() => {
                      window.location.href = '/notifications';
                    }).catch(err => {
                      alert('Failed to delete notification: ' + err.message);
                    });
                  }
                }}
                className="w-full inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Delete Notification
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
        ← Back to Notifications
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

function ReadBadge({ read }: { read?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      read ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
    }`}>
      {read ? 'Read' : 'Unread'}
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
