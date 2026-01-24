import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminsAPI } from "../../../config/api";

export default function AdminPostPage() {
  const navigate = useNavigate();

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState<{
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    isActive: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    isActive: true,
  });

  function onChange<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const response = await AdminsAPI.create({
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
        isActive: form.isActive,
      });

      const newAdmin = response.data;
      navigate(`/admins/${newAdmin.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Create Admin">
      <BackBar to="/admins" label="← Back to Admins" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Admin Information</h3>
            <Input
              label="Full Name"
              value={form.name}
              onChange={(v) => onChange("name", v)}
              required
              placeholder="Enter admin's full name..."
            />
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => onChange("email", v)}
              required
              placeholder="admin@example.com"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={form.phoneNumber}
              onChange={(v) => onChange("phoneNumber", v)}
              placeholder="+1 (555) 123-4567"
            />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Security</h3>
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => onChange("password", v)}
              required
              placeholder="Enter a secure password..."
            />
            <div className="text-xs text-slate-600">
              Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Account Settings</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Switch
                label="Active Account"
                checked={form.isActive}
                onChange={(v) => onChange("isActive", v)}
              />
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>• <strong>Active:</strong> Admin can access the system immediately</p>
              <p>• <strong>Inactive:</strong> Admin account is created but disabled</p>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Admin Role</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p>• New admins will have full administrative privileges</p>
              <p>• They can manage all system resources and users</p>
              <p>• Account activation can be changed later if needed</p>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Admin"}
            </button>
            <Link
              to="/admins"
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

function BackBar({ to = "/admins", label = "← Back to list" }: { to?: string; label?: string }) {
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
