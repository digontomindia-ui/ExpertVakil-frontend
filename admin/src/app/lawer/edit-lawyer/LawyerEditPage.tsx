import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URLS } from "../../../config/api";
import { uploadImage, validateImageFile } from "../../../config/storage";
import type { UploadProgress } from "../../../config/storage";

// --- Types from your model ---
interface User {
  id: string;
  email?: string;
  loginType?: string;
  profilePic?: string;
  fcmToken?: string;
  countryCode?: string;
  phoneNumber?: string;
  walletAmount: string;
  isActive?: boolean;
  isVerify?: boolean;
  travelPreference?: any;
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
  isAddressPublic?: boolean;
  yearsOfExperience?: number;
  languages?: string[];
  gender?: string;
  isOnline?: boolean;
  lastSeen?: any;
  updatedAt?: any;
  state?: string;
}

// --- Helpers to convert arrays <-> csv ---
const toCSV = (arr?: string[]) => (arr && arr.length ? arr.join(", ") : "");
const toArray = (csv: string) =>
  csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// --- UI ---
export default function LawyerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState<User>({
    id: "",
    walletAmount: "0",
    reviewCount: "0",
    reviewSum: "0",
    bio: "",
  });

  // Image upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress>({
    progress: 0,
    isUploading: false,
    error: null,
  });

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const url = API_URLS.USER_BY_ID(id);
        const res = await fetch(url, { cache: "no-store" as RequestCache });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const u: User = payload?.data ?? null;
        if (mounted && u) setForm(u);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  function onChange<K extends keyof User>(key: K, value: User[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadProgress({
        progress: 0,
        isUploading: false,
        error: validation.error || "Invalid file"
      });
      return;
    }

    setSelectedFile(file);
    setUploadProgress({ progress: 0, isUploading: false, error: null });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Remove selected file
  function handleRemoveFile() {
    setSelectedFile(null);
    setImagePreview("");
    setUploadProgress({ progress: 0, isUploading: false, error: null });
    // Clear the profilePic from form if it was previously uploaded
    if (form.profilePic) {
      setForm(prev => ({ ...prev, profilePic: "" }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError("");

      let finalProfilePic = form.profilePic;

      // Upload image to Firebase Storage if a file is selected
      if (selectedFile) {
        try {
          setUploadProgress({ progress: 0, isUploading: true, error: null });
          finalProfilePic = await uploadImage(selectedFile, 'lawyers', setUploadProgress);
          setForm(prev => ({ ...prev, profilePic: finalProfilePic }));
        } catch (uploadError: unknown) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          setError(`Image upload failed: ${errorMessage}`);
          return;
        }
      }

      // Build payload — keep arrays normalized from CSV inputs
      const payload: User = {
        ...form,
        profilePic: finalProfilePic,
        yearsOfExperience: Number(form.yearsOfExperience || 0),
        reviewCount: String(form.reviewCount ?? "0"),
        reviewSum: String(form.reviewSum ?? "0"),
        walletAmount: String(form.walletAmount ?? "0"),
        specializations: toArray((form as any)._specializations_csv || toCSV(form.specializations)),
        services: toArray((form as any)._services_csv || toCSV(form.services)),
        courts: toArray((form as any)._courts_csv || toCSV(form.courts)),
        languages: toArray((form as any)._languages_csv || toCSV(form.languages)),
      };

      const res = await fetch(API_URLS.USER_BY_ID(id), {
        method: "PUT", // assuming PUT updates all fields
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Navigate back to details page after save
      navigate(`/lawyers/${id}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to save";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return (
      <PageShell title="Invalid request">
        <BackBar />
        <Card className="p-6">Missing user id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Edit Lawyer"><Skeleton /></PageShell>;

  return (
    <PageShell title="Edit Lawyer">
      <BackBar to={`/lawyers/${id}`} label="← Back to profile" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Basic Info</h3>
            <Input label="Full Name" value={form.fullName || ""} onChange={(v) => onChange("fullName", v)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" value={form.email || ""} onChange={(v) => onChange("email", v)} />
              <Input label="Phone Number" value={form.phoneNumber || ""} onChange={(v) => onChange("phoneNumber", v)} />
              <Input label="Country Code" value={form.countryCode || ""} onChange={(v) => onChange("countryCode", v)} />
              <Select
                label="User Type"
                value={form.userType || "individual"}
                options={["individual", "firm", "advocate", "lawyer"]}
                onChange={(v) => onChange("userType", v)}
              />
              <Input
                label="Years of Experience"
                type="number"
                min={0}
                value={String(form.yearsOfExperience ?? 0)}
                onChange={(v) => onChange("yearsOfExperience", Number(v))}
              />
              <Input label="Gender" value={form.gender || ""} onChange={(v) => onChange("gender", v)} />
            </div>
            {/* Profile Picture Upload Section */}
            <div className="space-y-3">
              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-600">
                  Profile Picture
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                </div>
              </label>

              {/* Current or Preview Image */}
              {(imagePreview || form.profilePic) && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || form.profilePic}
                    alt="Profile"
                    className="max-w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Upload Progress */}
              {uploadProgress.isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Uploading...</span>
                    <span className="text-slate-600">{uploadProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-slate-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadProgress.error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  {uploadProgress.error}
                </div>
              )}

              {/* Alternative URL input (for existing images or external URLs) */}
              <div className="border-t pt-3">
                <Input
                  label="Or enter Profile Picture URL"
                  value={form.profilePic || ""}
                  onChange={(v) => onChange("profilePic", v)}
                  placeholder="https://example.com/profile.jpg"
                  disabled={!!selectedFile}
                />
                {selectedFile && (
                  <div className="mt-1 text-xs text-slate-500">
                    URL input disabled when file is selected
                  </div>
                )}
              </div>
            </div>
            <Textarea label="Bio" value={form.bio || ""} onChange={(v) => onChange("bio", v)} rows={5} />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Location</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="City" value={form.city || ""} onChange={(v) => onChange("city", v)} />
              <Input label="State" value={form.state || ""} onChange={(v) => onChange("state", v)} />
            </div>
            <Input label="Complete Address" value={form.completeAddress || ""} onChange={(v) => onChange("completeAddress", v)} />
            <Switch label="Show Address Publicly" checked={!!form.isAddressPublic} onChange={(v) => onChange("isAddressPublic", v)} />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Professional</h3>
            <CSVInput
              label="Specializations (comma-separated)"
              value={(form as any)._specializations_csv ?? toCSV(form.specializations)}
              onChange={(v) => setForm((p) => ({ ...p, _specializations_csv: v } as any))}
            />
            <CSVInput
              label="Services (comma-separated)"
              value={(form as any)._services_csv ?? toCSV(form.services)}
              onChange={(v) => setForm((p) => ({ ...p, _services_csv: v } as any))}
            />
            <CSVInput
              label="Courts (comma-separated)"
              value={(form as any)._courts_csv ?? toCSV(form.courts)}
              onChange={(v) => setForm((p) => ({ ...p, _courts_csv: v } as any))}
            />
            <CSVInput
              label="Languages (comma-separated)"
              value={(form as any)._languages_csv ?? toCSV(form.languages)}
              onChange={(v) => setForm((p) => ({ ...p, _languages_csv: v } as any))}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Account</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Login Type" value={form.loginType || ""} onChange={(v) => onChange("loginType", v)} />
              <Input label="FCM Token" value={form.fcmToken || ""} onChange={(v) => onChange("fcmToken", v)} />
              <Input label="Wallet Amount" type="number" value={String(form.walletAmount ?? "0")} onChange={(v) => onChange("walletAmount", v)} />
              <Input label="Review Count" type="number" value={String(form.reviewCount ?? "0")} onChange={(v) => onChange("reviewCount", v)} />
              <Input label="Review Sum (rating total)" type="number" value={String(form.reviewSum ?? "0")} onChange={(v) => onChange("reviewSum", v)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Switch label="Active" checked={!!form.isActive} onChange={(v) => onChange("isActive", v)} />
              <Switch label="Verified" checked={!!form.isVerify} onChange={(v) => onChange("isVerify", v)} />
              <Switch label="Online (display only)" checked={!!form.isOnline} onChange={(v) => onChange("isOnline", v)} />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Timestamps</h3>
            <Readonly label="Created At" value={formatTs(form.createdAt)} />
            <Readonly label="Updated At" value={formatTs(form.updatedAt)} />
            <Readonly label="Last Seen" value={formatTs(form.lastSeen)} />
          </Card>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || uploadProgress.isUploading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? (selectedFile ? "Uploading & Saving..." : "Saving...")
                : selectedFile
                ? "Upload & Save Changes"
                : "Save Changes"
              }
            </button>
            <Link
              to={`/lawyers/${id}`}
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

function BackBar({ to = "/lawyers", label = "← Back to list" }: { to?: string; label?: string }) {
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
  placeholder = "",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  min?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
        }`}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function CSVInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. criminal law, divorce, corporate"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />
      <div className="mt-1 text-[11px] text-slate-500">Separate values with commas</div>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {capitalize(o)}
          </option>
        ))}
      </select>
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

function capitalize(s?: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
function formatTs(ts: any) {
  if (!ts) return "";
  if (typeof ts === "number") return new Date(ts * 1000).toLocaleString();
  if (ts?._seconds) return new Date(ts._seconds * 1000).toLocaleString();
  return String(ts);
}
