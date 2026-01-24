// app/support/support.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone } from "lucide-react";
import { supportAPI, type SupportInput } from "../../services/api";
import { useUser } from "../../context/UserContext";

export default function SupportPage() {
  const { user } = useUser();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    category: "General Inquiry", // Add category field
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);

  // Support categories
  const categories = [
    "General Inquiry",
    "Technical Support",
    "Account Issues",
    "Billing & Payments",
    "Legal Consultation",
    "Bug Report",
    "Feature Request",
    "Other"
  ];

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    try {
      // Prepare support ticket data
      const supportData: SupportInput = {
        userId: user?.id || "anonymous",
        userType: user?.userType === "firm" ? "LAWYER" : "CLIENT", // Map user types
        purpose: "Support Request",
        category: form.category,
        title: form.category, // Use category as title, or could be more specific
        description: form.message,
        status: "PENDING",
      };

      const response = await supportAPI.create(supportData);

      if (response.data.success) {
        console.log("Support ticket created:", response.data.data);
        setResponseMsg("✅ Thanks! Your support request has been submitted. We'll get back to you within 24 hours.");
        setForm({
          name: "",
          email: "",
          phone: "",
          message: "",
          category: "General Inquiry"
        });
      } else {
        throw new Error("Failed to submit support request");
      }
    } catch (err: any) {
      console.error("Error submitting support request:", err);
      setResponseMsg("❌ Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-white text-[#1a1a1a]">
      {/* Top intro */}
      <section className="mx-auto max-w-6xl px-4 pt-12 text-center">
        <h1 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
          We’re Eagerly Waiting To
          <br />
          Hear From You!
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">
          We offer our services to a range of client base including those
          dealing with commerce and industry. Our beneficiaries in criminal
          litigation cases also include different multinational corporations,
          public sector bodies, and individual business owners.
        </p>
      </section>

      {/* Form + Contact */}
      <section className="mx-auto mt-10 max-w-6xl grid-cols-2 gap-8 px-4 md:grid">
        {/* Left: Dark card with form */}
        <div className="rounded-2xl bg-black p-6 md:p-8">
          <h2 className="text-center text-2xl font-semibold text-white">
            Fill Up Our Quick Form & We’ll
            <br />
            Be In Touch!
          </h2>
          <p className="mt-2 text-center text-xs text-gray-300">
            We’ll get back to you within 24 hours. Thanks.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <input
                id="name"
                required
                value={form.name}
                onChange={onChange("name")}
                placeholder="Enter Your Full Name"
                className="w-full rounded-full border-0 bg-white/95 px-5 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none ring-1 ring-white focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={onChange("email")}
                placeholder="Enter your Email"
                className="w-full rounded-full border-0 bg-white/95 px-5 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none ring-1 ring-white focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <input
                id="phone"
                inputMode="tel"
                value={form.phone}
                onChange={onChange("phone")}
                placeholder="Enter Your Contact Number"
                className="w-full rounded-full border-0 bg-white/95 px-5 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none ring-1 ring-white focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <select
                id="category"
                required
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-full border-0 bg-white/95 px-5 py-3 text-sm text-gray-900 outline-none ring-1 ring-white focus:ring-2 focus:ring-orange-400"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={onChange("message")}
                placeholder="Explain in brief here!"
                className="w-full resize-none rounded-2xl border-0 bg-white/95 px-5 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none ring-1 ring-white focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {responseMsg && (
              <p
                className={`text-center text-sm ${
                  responseMsg.startsWith("✅")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {responseMsg}
              </p>
            )}

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Contact information */}
        <div className="flex items-stretch">
          <div className="relative flex w-full flex-col justify-center rounded-2xl border border-gray-200 bg-white p-6 md:p-10">
            <div>
              <h3 className="text-2xl font-semibold">Write To Us</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a
                    href="mailto:info@expertvakeel.in"
                    className="hover:underline"
                  >
                    info@expertvakeel.in
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+91-9711840150</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+91-9711840150</span>
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h4 className="text-xl font-medium">Connect Us On WhatsApp</h4>
            </div>

            <div className="pointer-events-none absolute inset-y-6 left-0 hidden w-px bg-gray-200 md:block" />
          </div>
        </div>
      </section>

      {/* Bottom black band */}
      <section className="mt-16 w-full bg-black py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            10 Years Of Experience In The
            <br />
            Field Of Law
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-gray-300 md:text-sm">
            As a leading law firm, our team of Lawyers at AQC &amp; Partners
            commits itself to resolve the legal issues of our clients in an
            effective manner.
          </p>
        </div>
      </section>
    </main>
  );
}
