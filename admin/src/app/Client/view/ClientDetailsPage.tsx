import React from "react";
import { useParams, Link } from "react-router-dom";
import { ClientsAPI, type Client } from "../../../config/api";

// Utility function to parse various date formats
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  try {
    // Handle Firestore timestamp format
    if (typeof dateValue === 'object' && dateValue._seconds) {
      return new Date(dateValue._seconds * 1000);
    }

    // Handle string dates
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }

    return null;
  } catch {
    return null;
  }
}

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = React.useState<Client | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const response = await ClientsAPI.getById(id);
        const data: Client | null = response.data ?? null;
        if (mounted) setClient(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load client");
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
        <Card className="p-6">Missing client id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Client Details"><Skeleton /></PageShell>;

  if (error) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn't load profile</h1>
          <p className="mt-1 text-slate-600">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (!client) {
    return (
      <PageShell title="Not found">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Client not found</h1>
          <p className="mt-1 text-slate-600">The profile you're looking for doesn't exist.</p>
        </Card>
      </PageShell>
    );
  }

  const joined = parseDate(client?.createdAt);
  const avatar = client?.profilePic ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      client?.fullName || "C"
    )}&radius=50`;

  return (
    <PageShell title="Client Details">
      <BackBar />

      <Card className="flex items-center gap-4 p-4">
        <img src={avatar} alt="avatar" className="h-16 w-16 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-slate-900">{client?.fullName}</h2>
          <p className="text-sm text-slate-600">
            Client • {joined ? `Joined ${joined.toLocaleDateString()}` : "Registration date unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Client Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Full Name" value={client.fullName} />
                <InfoItem label="Email" value={client.email} />
                <InfoItem label="Phone" value={client.phone || "Not provided"} />
                <InfoItem label="Client ID" value={client.id} />
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <Stat label="Status" value="Active" />
            <Stat label="Account Type" value="Client" />
          </div>

          <Section title="Account Details">
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-600">Created:</span>
                <span className="font-medium text-slate-900">
                  {joined ? joined.toLocaleDateString() : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Last Updated:</span>
                <span className="font-medium text-slate-900">
                  {parseDate(client.updatedAt)?.toLocaleDateString() || "Unknown"}
                </span>
              </div>
            </div>
          </Section>

          <Section title="Contact">
            <div className="space-y-2 text-sm">
              {client?.email && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Email:</span>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                  >
                    {client.email}
                  </a>
                </div>
              )}
              {client?.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Phone:</span>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                  >
                    {client.phone}
                  </a>
                </div>
              )}
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
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function BackBar() {
  return (
    <div className="mb-4">
      <Link to="/" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
        ← Back to Clients
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{title}</h4>
      <Card className="p-4">{children}</Card>
    </section>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
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
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-28 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </>
  );
}
