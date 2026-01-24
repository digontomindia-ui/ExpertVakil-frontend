import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CasesAPI, type Case } from "../../../config/api";

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      const response = await CasesAPI.getById(id!);
      setCaseData(response.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load case");
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <PageShell title="Invalid request">
        <BackBar />
        <Card className="p-6">Missing case id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell title="Case Details">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-slate-200 rounded-2xl"></div>
              <div className="h-48 bg-slate-200 rounded-2xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-slate-200 rounded-2xl"></div>
              <div className="h-40 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !caseData) {
    return (
      <PageShell title="Error">
        <BackBar />
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-slate-900">Couldn't load case</h1>
          <p className="mt-1 text-slate-600">{error || "Case not found"}</p>
        </Card>
      </PageShell>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "ADJOURNED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <PageShell title={`Case #${caseData.caseNumber}`}>
      <BackBar />

      {/* Header */}
      <Card className="flex items-center justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-slate-900">
              Case #{caseData.caseNumber}
            </h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(caseData.status)}`}>
              {caseData.status}
            </span>
          </div>
          <p className="text-slate-600">
            {caseData.partitionarName} vs {caseData.respondentName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/cases/${id}/edit`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit Case
          </Link>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Information */}
          <Section title="Case Details">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label="Case Type & Registration" value={caseData.caseTypeAndRegistration} />
              <InfoItem label="FIR Number" value={caseData.firNumber} />
              <InfoItem label="Purpose" value={caseData.purpose} />
              <InfoItem label="Amount Received" value={caseData.amountReceived ? `₹${caseData.amountReceived.toLocaleString()}` : "Not specified"} />
            </div>
          </Section>

          {/* Parties Involved */}
          <Section title="Parties Involved">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Petitioner/Plaintiff</h4>
                <InfoItem label="Name" value={caseData.partitionarName} />
                <InfoItem label="Contact" value={caseData.clientNumber} />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Respondent/Defendant</h4>
                <InfoItem label="Name" value={caseData.respondentName} />
                <InfoItem label="Contact" value={caseData.secondPartyNumber} />
              </div>
            </div>
          </Section>

          {/* Court Information */}
          <Section title="Court Information">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label="Court Name" value={caseData.courtName} />
              <InfoItem label="Room Number" value={caseData.roomNumber} />
              <InfoItem label="Judge Name" value={caseData.judgeName} />
              <InfoItem label="Judge Post" value={caseData.judgePost} />
            </div>
          </Section>

          {/* Hearing Schedule */}
          <Section title="Hearing Schedule">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label="Next Hearing Date" value={formatDate(caseData.nextHearingDate)} />
              <InfoItem label="Last Hearing Date" value={formatDate(caseData.lastHearingDate)} />
              <InfoItem label="Reminder Date" value={formatDate(caseData.remindMeDate)} />
            </div>
          </Section>

          {/* Remarks */}
          {caseData.remarks && (
            <Section title="Remarks">
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{caseData.remarks}</p>
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Section title="Case Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Current Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </span>
              </div>
            </div>
          </Section>

          {/* Timestamps */}
          <Section title="Timeline">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Created:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(caseData.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Last Updated:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(caseData.updatedAt)}
                </span>
              </div>
            </div>
          </Section>

          {/* Quick Actions */}
          <Section title="Quick Actions">
            <div className="space-y-2">
              <Link
                to={`/cases/${id}/edit`}
                className="w-full inline-flex justify-center items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Case Details
              </Link>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this case?")) {
                    // Handle delete
                  }
                }}
                className="w-full inline-flex justify-center items-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete Case
              </button>
            </div>
          </Section>
        </div>
      </div>
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

function BackBar({ to = "/cases", label = "← Back to Cases" }: { to?: string; label?: string }) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}
