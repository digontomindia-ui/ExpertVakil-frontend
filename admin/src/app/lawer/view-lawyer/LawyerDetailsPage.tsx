// src/pages/lawyers/LawyerDetailsPage.tsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { API_URLS } from "../../../config/api";

interface User {
  id: string;
  email?: string;
  profilePic?: string;
  walletAmount: string;
  isActive?: boolean;
  isVerify?: boolean;
  createdAt?: any;
  reviewCount: string;
  reviewSum: string;
  bio: string;
  userType?: string;
  fullName?: string;
  specializations?: string[];
  services?: string[];
  courts?: string[];
  city?: string;
  completeAddress?: string;
  yearsOfExperience?: number;
  languages?: string[];
  isOnline?: boolean;
  state?: string;
  phoneNumber?: string;
}

export default function LawyerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [u, setU] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return; // no id in route
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        // ✅ use your helper
        const url = API_URLS.USER_BY_ID(id);
        const res = await fetch(url, { cache: "no-store" as RequestCache });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const data: User | null = payload?.data ?? null;
        if (mounted) setU(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
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
        <Card className="p-6">Missing user id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Lawyer Details"><Skeleton /></PageShell>;

  if (error) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn’t load profile</h1>
          <p className="mt-1 text-slate-600">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (!u) {
    return (
      <PageShell title="Not found">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Lawyer not found</h1>
          <p className="mt-1 text-slate-600">The profile you’re looking for doesn’t exist.</p>
        </Card>
      </PageShell>
    );
  }

  const joined = u?.createdAt?._seconds ? new Date(u.createdAt._seconds * 1000) : null;
  const avatar =
    u?.profilePic ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.fullName || "A")}\u0026radius=50`;

  return (
    <PageShell title="Lawyer Details">
      <BackBar />

      <Card className="flex items-center gap-4 p-4">
        <img src={avatar} alt="avatar" className="h-16 w-16 rounded-2xl object-cover" />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-slate-900">{u?.fullName}</h2>
          <p className="text-sm text-slate-600">
            {u?.city}{u?.state ? `, ${u.state}` : ""} • {capitalize(u?.userType || "individual")}
          </p>
        </div>
        {u?.isOnline && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
            Online
          </span>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {u?.bio && (
            <Section title="About">
              <p className="text-sm leading-6 text-slate-700">{u.bio}</p>
            </Section>
          )}

          <Section title="Specializations">
            <div className="flex flex-wrap gap-2">
              {(u?.specializations || []).map((s) => <Chip key={s}>{s}</Chip>)}
            </div>
          </Section>

          {(u?.services || []).length > 0 && (
            <Section title="Services">
              <ul className="list-inside list-disc text-sm text-slate-700">
                {u.services?.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </Section>
          )}

          <Section title="Languages">
            <div className="flex flex-wrap gap-2">
              {(u?.languages || []).map((l) => <Chip key={l}>{l}</Chip>)}
            </div>
          </Section>

          {(u?.courts || []).length > 0 && (
            <Section title="Courts">
              <div className="flex flex-wrap gap-2">
                {u.courts?.map((c) => <Chip key={c}>{c}</Chip>)}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Experience" value={`${u?.yearsOfExperience || 0} years`} />
            <Stat label="Reviews" value={`${u?.reviewSum || 0} ★ (${u?.reviewCount || 0})`} />
            <Stat label="Verified" value={u?.isVerify ? "Yes" : "No"} />
            <Stat label="Active" value={u?.isActive ? "Yes" : "No"} />
          </div>

          <Section title="Contact">
            <div className="space-y-1 text-sm text-slate-700">
              {u?.email && (
                <p>
                  Email:{" "}
                  <a className="text-slate-900 underline decoration-slate-300 underline-offset-2" href={`mailto:${u.email}`}>
                    {u.email}
                  </a>
                </p>
              )}
              {u?.phoneNumber && (
                <p>
                  Phone:{" "}
                  <a className="text-slate-900" href={`tel:${u.phoneNumber}`}>
                    {u.phoneNumber}
                  </a>
                </p>
              )}
              {u?.completeAddress && <p>Address: {u.completeAddress}</p>}
              {joined && <p>Joined: {joined.toLocaleDateString()}</p>}
            </div>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

/* ---------- tiny UI helpers ---------- */
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
        ← Back to Lawyers
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
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{children}</span>;
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
          <div className="h-40 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-28 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="h-28 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </>
  );
}
function capitalize(s?: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
