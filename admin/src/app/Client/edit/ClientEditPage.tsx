import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClientsAPI, type Client } from "../../../config/api";
import { uploadImage, validateImageFile } from "../../../config/storage";
import type { UploadProgress } from "../../../config/storage";

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState<Client>({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    profilePic: "",
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
        const response = await ClientsAPI.getById(id);
        const client: Client = response.data;
        if (mounted && client) setForm(client);
      } catch (e: any) {
        setError(e?.message || "Failed to load client");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  function onChange<K extends keyof Client>(key: K, value: Client[K]) {
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
          finalProfilePic = await uploadImage(selectedFile, 'clients', setUploadProgress);
          setForm(prev => ({ ...prev, profilePic: finalProfilePic }));
        } catch (uploadError: unknown) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          setError(`Image upload failed: ${errorMessage}`);
          return;
        }
      }

      await ClientsAPI.update(id, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        profilePic: finalProfilePic,
      });

      navigate(`/clients/${id}`);
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
        <Card className="p-6">Missing client id in URL.</Card>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Edit Client"><Skeleton /></PageShell>;

  return (
    <PageShell title="Edit Client">
      <BackBar to={`/clients/${id}`} label="← Back to profile" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Client Information</h3>
            <Input
              label="Full Name"
              value={form.fullName || ""}
              onChange={(v) => onChange("fullName", v)}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.email || ""}
                onChange={(v) => onChange("email", v)}
                required
              />
              <Input
                label="Phone Number"
                value={form.phone || ""}
                onChange={(v) => onChange("phone", v)}
              />
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
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Account Details</h3>
            <Readonly label="Client ID" value={form.id} />
            <Readonly
              label="Created At"
              value={form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "Unknown"}
            />
            <Readonly
              label="Updated At"
              value={form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Unknown"}
            />
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
              to={`/clients/${id}`}
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

function BackBar({ to = "/clients", label = "← Back to list" }: { to?: string; label?: string }) {
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
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
        }`}
      />
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
          <div className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </>
  );
}
