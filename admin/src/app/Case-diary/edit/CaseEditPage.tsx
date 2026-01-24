import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CasesAPI, type Case } from "../../../config/api";

export default function CaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Partial<Case>>({
    caseNumber: "",
    caseTypeAndRegistration: "",
    firNumber: "",
    partitionarName: "",
    clientNumber: "",
    respondentName: "",
    secondPartyNumber: "",
    courtName: "",
    roomNumber: "",
    amountReceived: undefined,
    judgeName: "",
    judgePost: "",
    remarks: "",
    purpose: "",
    status: "OPEN",
    nextHearingDate: "",
    lastHearingDate: "",
    remindMeDate: "",
  });

  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      return;
    }
    if (!id) return;
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      const response = await CasesAPI.getById(id!);
      setForm(response.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load case");
    } finally {
      setLoading(false);
    }
  };

  function onChange<K extends keyof Case>(key: K, value: Case[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      // Validation
      if (!form.caseNumber?.trim()) {
        setError("Case number is required");
        return;
      }
      if (!form.partitionarName?.trim()) {
        setError("Petitioner name is required");
        return;
      }
      if (!form.respondentName?.trim()) {
        setError("Respondent name is required");
        return;
      }
      if (!form.courtName?.trim()) {
        setError("Court name is required");
        return;
      }
      if (!form.judgeName?.trim()) {
        setError("Judge name is required");
        return;
      }
      if (!form.purpose?.trim()) {
        setError("Purpose is required");
        return;
      }

      const submitData = {
        ...form,
        amountReceived: form.amountReceived || undefined,
        nextHearingDate: form.nextHearingDate || undefined,
        lastHearingDate: form.lastHearingDate || undefined,
        remindMeDate: form.remindMeDate || undefined,
      };

      if (id === "new") {
        const response = await CasesAPI.create(submitData as Omit<Case, 'id' | 'createdAt' | 'updatedAt'>);
        navigate(`/cases/${response.data.id}`);
      } else {
        await CasesAPI.update(id!, submitData);
        navigate(`/cases/${id}`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save case");
    } finally {
      setSaving(false);
    }
  }

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
      <PageShell title={id === "new" ? "Create Case" : "Edit Case"}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={id === "new" ? "Create Case" : "Edit Case"}>
      <BackBar to={id === "new" ? "/cases" : `/cases/${id}`} />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Basic Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Case Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Case Number *"
                value={form.caseNumber || ""}
                onChange={(v) => onChange("caseNumber", v)}
                required
                placeholder="e.g. 2024/CR/001"
              />
              <Input
                label="Case Type & Registration *"
                value={form.caseTypeAndRegistration || ""}
                onChange={(v) => onChange("caseTypeAndRegistration", v)}
                required
                placeholder="e.g. Criminal Case under Section 420"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="FIR Number"
                value={form.firNumber || ""}
                onChange={(v) => onChange("firNumber", v)}
                placeholder="FIR registration number"
              />
              <Input
                label="Purpose *"
                value={form.purpose || ""}
                onChange={(v) => onChange("purpose", v)}
                required
                placeholder="Brief description of the case"
              />
            </div>
            <Textarea
              label="Remarks"
              value={form.remarks || ""}
              onChange={(v) => onChange("remarks", v)}
              rows={3}
              placeholder="Additional notes or remarks about the case"
            />
          </Card>

          {/* Parties Involved */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Parties Involved</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">Petitioner/Plaintiff</h4>
                <Input
                  label="Full Name *"
                  value={form.partitionarName|| ""}
                  onChange={(v) => onChange("partitionarName", v)}
                  required
                  placeholder="Petitioner's full name"
                />
                <Input
                  label="Contact Number"
                  value={form.clientNumber || ""}
                  onChange={(v) => onChange("clientNumber", v)}
                  placeholder="Petitioner's phone number"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">Respondent/Defendant</h4>
                <Input
                  label="Full Name *"
                  value={form.respondentName || ""}
                  onChange={(v) => onChange("respondentName", v)}
                  required
                  placeholder="Respondent's full name"
                />
                <Input
                  label="Contact Number"
                  value={form.secondPartyNumber || ""}
                  onChange={(v) => onChange("secondPartyNumber", v)}
                  placeholder="Respondent's phone number"
                />
              </div>
            </div>
          </Card>

          {/* Court Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Court Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Court Name *"
                value={form.courtName || ""}
                onChange={(v) => onChange("courtName", v)}
                required
                placeholder="Name of the court"
              />
              <Input
                label="Room Number"
                value={form.roomNumber || ""}
                onChange={(v) => onChange("roomNumber", v)}
                placeholder="Court room number"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Judge Name *"
                value={form.judgeName || ""}
                onChange={(v) => onChange("judgeName", v)}
                required
                placeholder="Presiding judge's name"
              />
              <Input
                label="Judge Post"
                value={form.judgePost || ""}
                onChange={(v) => onChange("judgePost", v)}
                placeholder="Judge's designation"
              />
            </div>
          </Card>

          {/* Hearing Schedule */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Hearing Schedule</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Next Hearing Date"
                type="datetime-local"
                value={form.nextHearingDate || ""}
                onChange={(v) => onChange("nextHearingDate", v)}
              />
              <Input
                label="Last Hearing Date"
                type="datetime-local"
                value={form.lastHearingDate || ""}
                onChange={(v) => onChange("lastHearingDate", v)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Reminder Date"
                type="datetime-local"
                value={form.remindMeDate || ""}
                onChange={(v) => onChange("remindMeDate", v)}
              />
              <Input
                label="Amount Received (₹)"
                type="number"
                min={0}
                value={form.amountReceived?.toString() || ""}
                onChange={(v) => onChange("amountReceived", v ? parseFloat(v) : undefined)}
                placeholder="0.00"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Case Status</h3>
            <Select
              label="Status"
              value={form.status || "OPEN"}
              onChange={(v) => onChange("status", v as Case['status'])}
              options={[
                { value: "OPEN", label: "Open" },
                { value: "CLOSED", label: "Closed" },
                { value: "ADJOURNED", label: "Adjourned" },
              ]}
            />
          </Card>

          {/* Save Actions */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : (id === "new" ? "Create Case" : "Save Changes")}
              </button>
              <Link
                to={id === "new" ? "/cases" : `/cases/${id}`}
                className="w-full inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </Card>

          {/* Case ID (for existing cases) */}
          {id !== "new" && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Case Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Case ID:</span>
                  <span className="font-medium text-slate-900">{form.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Created:</span>
                  <span className="font-medium text-slate-900">
                    {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Updated:</span>
                  <span className="font-medium text-slate-900">
                    {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
              </div>
            </Card>
          )}
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  min?: number;
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
        min={min}
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
