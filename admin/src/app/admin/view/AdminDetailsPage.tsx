import React from "react";
import { useParams, Link } from "react-router-dom";
import { AdminsAPI, type Admin } from "../../../config/api";

export default function AdminDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [admin, setAdmin] = React.useState<Admin | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const response = await AdminsAPI.getById(id);
        const data: Admin | null = response.data ?? null;
        if (mounted) setAdmin(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load admin");
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
        <Card className="p-6">Missing admin id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Admin Details"><Skeleton /></PageShell>;

  if (error) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn't load admin</h1>
          <p className="mt-1 text-slate-600">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (!admin) {
    return (
      <PageShell title="Not found">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Admin not found</h1>
          <p className="mt-1 text-slate-600">The admin you're looking for doesn't exist.</p>
        </Card>
      </PageShell>
    );
  }

  const created = admin.createdAt ? new Date(admin.createdAt as any) : null;
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    admin.name || "A"
  )}&radius=50&size=120`;

  return (
    <PageShell title="Admin Details">
      <BackBar />

      {/* Header Card */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-6">
            <img
              src={avatar}
              alt={admin.name}
              className="h-24 w-24 rounded-full border-4 border-slate-100"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{admin.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                <StatusBadge active={admin.isActive} />
                {created && <span>Created: {created.toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/admins/${id}/edit`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Admin
            </Link>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <Section title="Contact Information">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <span className="text-sm">📧</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Email Address</div>
                  <div className="text-sm text-slate-600">{admin.email}</div>
                </div>
              </div>

              {admin.phoneNumber && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-sm">📞</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Phone Number</div>
                    <div className="text-sm text-slate-600">{admin.phoneNumber}</div>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          {/* Account Status */}
          <div className="grid grid-cols-1 gap-3">
            <Stat label="Account Status" value={admin.isActive ? "Active" : "Inactive"} />
          </div>

          {/* Admin Details */}
          <Section title="Admin Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Admin ID:</span>
                <span className="font-mono text-slate-900 text-xs">{admin.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Account Created:</span>
                <span className="text-slate-900">
                  {created ? created.toLocaleDateString() : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Role:</span>
                <span className="text-slate-900">Administrator</span>
              </div>
            </div>
          </Section>

          {/* Actions */}
          <Section title="Actions">
            <div className="space-y-2">
              <Link
                to={`/admins/${id}/edit`}
                className="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Admin
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this admin?')) {
                    AdminsAPI.remove(id).then(() => {
                      window.location.href = '/admins';
                    }).catch((err: any) => {
                      alert('Failed to delete admin: ' + err.message);
                    });
                  }
                }}
                className="w-full inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Delete Admin
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
      <Link to="/admins" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
        ← Back to Admins
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

function StatusBadge({ active }: { active?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {active ? 'Active' : 'Inactive'}
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
