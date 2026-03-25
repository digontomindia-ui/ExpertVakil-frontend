// src/pages/profileview/ProfileView.tsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Star,
  ShieldCheck,
  MessageCircle,
  Flag,
  ThumbsUp,
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Copy,
} from "lucide-react";
import { FaWhatsapp, FaFacebook, FaLinkedin, FaTwitter } from "react-icons/fa";
import {
  userAPI,
  ratingReviewAPI,
  type User,
  type RatingReviewStats,
  type RatingReview,
} from "../../services/api";
import { useChat } from "../../context/ChatContext";
import RatingModal from "../../components/RatingModal";

/* ---------------- Types ---------------- */

interface ProfileData {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  ratingStats?: RatingReviewStats;
  isTopRated: boolean;
  experiences: Array<{ icon: React.ReactNode; label: string }>;
  bio: string;
  userType: string;
  specializations: string[];
  courts: string[];
  yearsOfExperience: number;
  email?: string;
  phoneNumber?: string;
  city?: string;
  completeAddress?: string;
  isAddressPublic?: boolean;
  languages?: string[];
  gender?: string;
  services?: string[];
  reviewCount?: string;
  travelPreference?: string | null;
  walletAmount?: string;
}

type SimilarProfile = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  experience: string;
  court: string;
  specialization: string;
  verified?: boolean;
};

/* ---------------- Small UI helpers ---------------- */

function GhostButton({
  children,
  className = "",
  ...props
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  className = "",
  ...props
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Utils ---------------- */

function timestampToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "object" && ts.toDate) return ts.toDate();
  if (typeof ts === "object" && ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === "object" && ts._seconds) return new Date(ts._seconds * 1000);
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === "number") return new Date(ts);
  return null;
}

/* ---------------- Component ---------------- */

export default function ProfileView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("id");

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [similarProfiles, setSimilarProfiles] = useState<SimilarProfile[]>([]);
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const TAB_TYPES = ["bio", "reviews", "share", "report"] as const;
  type TabType = (typeof TAB_TYPES)[number];
  const [activeTab, setActiveTab] = useState<TabType>("bio");

  const { startConversation } = useChat();

  // rating modal
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Authenticated state check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const clientData = localStorage.getItem("client");

    if (token && clientData && clientData !== "undefined") {
      try {
        const c = JSON.parse(clientData);
        setClientId(c.id || c._id);
        setClientName(c.fullName || "Anonymous User");
      } catch (err) {
        console.error("Error parsing client data:", err);
      }
    }
  }, []);

  // Auto-open rating modal if returning from login
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "rate" && clientId) {
      setShowRatingModal(true);
    }
  }, [clientId, searchParams]);

  const handleSendMessage = () => {
    if (profileData) {
      const message = encodeURIComponent(`Hello ${profileData.name}, I found your profile on Expert Vakeel and would like to connect.`);
      const whatsappUrl = `https://wa.me/919968739968?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  // fetch data
  useEffect(() => {
    const run = async () => {
      if (!userId) {
        setError("No profile ID provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const res = await userAPI.getById(userId);
        const user: User = res.data.data;

        let stats: RatingReviewStats;
        try {
          const s = await ratingReviewAPI.getStats(user.id);
          stats = s.data.data;
        } catch {
          stats = { averageRating: 0, ratingCount: 0, reviewCount: 0, userId: user.id, reviews: [] };
        }

        const pd: ProfileData = {
          id: user.id,
          name: user.fullName || "Unknown User",
          avatar: user.profilePic || "/assets/default-avatar.png",
          location: user.courts?.join(", ") || "Not specified",
          rating: stats.averageRating || 0,
          ratingStats: stats,
          isTopRated: Boolean(user.isVerify),
          experiences: [
            { icon: <ShieldCheck className="h-4 w-4" />, label: `${user.yearsOfExperience || 0} Years Experience` },
            { icon: <MapPin className="h-4 w-4" />, label: user.courts?.join(", ") || "Not specified" },
            { icon: <ThumbsUp className="h-4 w-4" />, label: user.specializations?.join(" & ") || "General Practice" },
          ],
          bio:
            user.bio ||
            `Professional ${user.userType === "individual" ? "lawyer" : "law firm"} with ${user.yearsOfExperience || 0
            } years of experience in ${user.specializations?.join(", ") || "general practice"}. Specializing in ${user.courts?.join(", ") || "various courts"
            }.`,
          userType: user.userType,
          specializations: user.specializations || [],
          courts: user.courts || [],
          yearsOfExperience: user.yearsOfExperience || 0,
          email: user.email,
          phoneNumber: user.phoneNumber,
          city: user.city,
          completeAddress: user.completeAddress,
          isAddressPublic: user.isAddressPublic,
          languages: user.languages,
          gender: user.gender,
          services: user.services,
          reviewCount: user.reviewCount,
          travelPreference: user.travelPreference,
          walletAmount: user.walletAmount,
        };

        setProfileData(pd);
        setReviews(stats.reviews || []);

        // similar profiles
        try {
          const all = await userAPI.getAll();
          const users: User[] = all.data.data || [];
          const ids = users.filter((u) => u.id !== userId).slice(0, 8).map((u) => u.id);

          const sres = await Promise.all(
            ids.map(async (id) => {
              try {
                const r = await ratingReviewAPI.getStats(id);
                return { id, stats: r.data.data as RatingReviewStats };
              } catch {
                return { id, stats: { averageRating: 0, ratingCount: 0, reviewCount: 0, userId: id, reviews: [] } };
              }
            })
          );
          const smap = Object.fromEntries(sres.map(({ id, stats }) => [id, stats]));

          const sim: SimilarProfile[] = users
            .filter((u) => u.id !== userId)
            .slice(0, 8)
            .map((u) => ({
              id: u.id,
              name: u.fullName || "Unknown User",
              avatar: u.profilePic || "/assets/default-avatar.png",
              rating: smap[u.id]?.averageRating || 0,
              experience: `${u.yearsOfExperience || 0} Years Experience`,
              court: u.courts?.join(", ") || "Not specified",
              specialization: u.specializations?.join(" & ") || "General Practice",
              verified: Boolean(u.isVerify),
            }));
          setSimilarProfiles(sim);
        } catch {
          setSimilarProfiles([]);
        }
      } catch (e) {
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#FFA800]" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || "Profile not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg bg-[#FFA800] px-4 py-2 text-white hover:bg-[#FFB800]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const p = profileData;

  return (
    <main className="min-h-[100dvh] bg-[#FAFAFA] overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl box-border px-3 pb-12 pt-4 sm:px-4 sm:pb-16 sm:pt-6 md:px-6">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate("/findprofile")}
            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Profile Card Section */}
        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:rounded-2xl sm:p-5 md:p-7">
          <div
            className="
            grid grid-cols-1 items-center gap-4 sm:gap-6
            md:grid-cols-[200px_1fr] md:gap-7
            lg:grid-cols-[240px_1fr_auto] lg:gap-8
          "
          >
            {/* Avatar */}
            <div className="flex justify-center md:block">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full shadow-lg ring-4 ring-white md:h-36 md:w-36 lg:h-40 lg:w-40 bg-gradient-to-br from-[#1a365d] to-[#2a4a7d]">
                  {p.avatar && !p.avatar.includes("default-avatar.png") ? (
                    <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white md:text-4xl lg:text-5xl">
                      {p.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 space-y-3">
              <h1 className="truncate text-center text-xl font-semibold sm:text-2xl md:text-left md:text-3xl">
                {p.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-200">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="truncate">
                    {p.ratingStats && p.ratingStats.ratingCount > 0
                      ? p.ratingStats.averageRating.toFixed(1)
                      : "No Ratings"}
                  </span>
                </span>
                {p.isTopRated && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="truncate">Top Rated</span>
                  </span>
                )}
              </div>

              <div className="min-w-0 flex items-center justify-center gap-2 text-sm text-gray-700 md:justify-start">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate md:whitespace-normal md:break-words">{p.location}</span>
              </div>

              <ul className="min-w-0 grid gap-2 text-sm text-gray-700">
                {p.experiences.map((e, i) => (
                  <li key={i} className="flex min-w-0 items-center gap-2">
                    {e.icon}
                    <span className="break-words">{e.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex min-w-0 justify-stretch gap-2 sm:gap-3 md:col-span-2 md:justify-end lg:col-span-1 lg:flex-col">
              <GhostButton
                className="w-full"
                onClick={() => {
                  if (!clientId) {
                    alert("Rating feature requires login as a lawyer.");
                    // navigate(`/login?redirect=${encodeURIComponent(currentPath)}&action=rate`);
                    return;
                  }
                  setShowRatingModal(true);
                }}
              >
                Rate Profile
              </GhostButton>

              <GhostButton className="w-full" onClick={() => setActiveTab("report")}>
                <Flag className="mr-2 h-4 w-4" /> Report Profile
              </GhostButton>

              <PrimaryButton className="w-full" onClick={handleSendMessage}>
                Send Message <MessageCircle className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="no-scrollbar inline-flex w-full max-w-full overflow-x-auto rounded-full bg-gray-100 p-1">
              <div className="flex w-max gap-1">
                <button
                  onClick={() => setActiveTab("bio")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${activeTab === "bio" ? "bg-[#FFC928] text-gray-900 shadow-sm border border-black" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Bio
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${activeTab === "reviews" ? "bg-[#FFC928] text-gray-900 shadow-sm border border-black" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Reviews ({Array.isArray(reviews) ? reviews.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab("share")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${activeTab === "share" ? "bg-[#FFC928] text-gray-900 shadow-sm border border-black" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Share Profile
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${activeTab === "report" ? "bg-[#FFC928] text-gray-900 shadow-sm border border-black" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Report Profile
                </button>
              </div>
            </div>
          </div>

          {/* Bio Tab Content */}
          {activeTab === "bio" && (
            <div>
              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-[13.75px] leading-7 text-gray-700 sm:p-5 md:p-6">
                {p.bio.split("\n\n").map((para, idx) => (
                  <p key={idx} className={idx ? "mt-4" : ""}>
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Personal Details</h3>
                  <div className="space-y-3 text-sm">
                    {p.gender && (
                      <div className="flex items-start">
                        <span className="w-24 sm:w-32 shrink-0 font-medium text-gray-700">Gender:</span>
                        <span className="capitalize text-gray-600">{p.gender}</span>
                      </div>
                    )}
                    {p.city && (
                      <div className="flex items-start">
                        <span className="w-24 sm:w-32 shrink-0 font-medium text-gray-700">City:</span>
                        <span className="text-gray-600">{p.city}</span>
                      </div>
                    )}
                    {p.completeAddress && p.isAddressPublic && (
                      <div className="flex items-start">
                        <span className="w-24 sm:w-32 shrink-0 font-medium text-gray-700">Address:</span>
                        <span className="text-gray-600">{p.completeAddress}</span>
                      </div>
                    )}
                    {p.languages?.length ? (
                      <div className="flex items-start">
                        <span className="w-24 sm:w-32 shrink-0 font-medium text-gray-700">Languages:</span>
                        <span className="text-gray-600">{p.languages.join(", ")}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact & Stats</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <span className="w-32 shrink-0 font-medium text-gray-700">Total Reviews:</span>
                      <span className="text-gray-600">{p.ratingStats?.reviewCount || 0}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 shrink-0 font-medium text-gray-700">Average Rating:</span>
                      <span className="text-gray-600">{p.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specializations & Services */}
              <div className="mt-6 space-y-6">
                {p.specializations?.length ? (
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-5 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.specializations.map((spec, idx) => (
                        <span key={idx} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {p.services?.length ? (
                  <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-5 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.services.map((service, idx) => (
                        <span key={idx} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {p.courts?.length ? (
                  <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 p-4 sm:p-5 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Courts</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.courts.map((court, idx) => (
                        <span key={idx} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                          {court}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-gray-500">No reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{review.clientName}</span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold text-gray-700">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.review}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === "share" && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 text-center">Share Profile</h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="rounded-full bg-slate-100 p-3 hover:bg-slate-200 transition">
                    <Copy className="h-6 w-6 text-slate-700" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Link</span>
                </button>

                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Check out this legal expert on Expert Vakeel: ${window.location.href}`);
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="rounded-full bg-green-100 p-3 hover:bg-green-200 transition">
                    <FaWhatsapp className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="rounded-full bg-blue-100 p-3 hover:bg-blue-200 transition">
                    <FaFacebook className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Facebook</span>
                </button>

                <button
                  onClick={() => {
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="rounded-full bg-sky-100 p-3 hover:bg-sky-200 transition">
                    <FaLinkedin className="h-6 w-6 text-sky-600" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">LinkedIn</span>
                </button>
              </div>
            </div>
          )}

          {/* Report Tab */}
          {activeTab === "report" && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center">
              <Flag className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Report Profile</h3>
              <p className="mb-4 text-sm text-gray-500">Report this profile if it violates community guidelines.</p>
              <button
                onClick={() => {
                  if (!p) return;
                  const message = encodeURIComponent(`Hello Expert Vakeel Support,\n\nI want to report a profile for violation of community guidelines:\n- Lawyer Name: ${p.name}\n- Lawyer ID: ${p.id}\n- Profile URL: ${window.location.href}`);
                  window.open(`https://wa.me/919968739968?text=${message}`, "_blank");
                }}
                className="rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                Submit Report
              </button>
            </div>
          )}
        </section>

        {/* Similar Profiles */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Profiles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarProfiles.map((sp) => (
              <div
                key={sp.id}
                className="cursor-pointer group"
                onClick={() => navigate(`/profileview?id=${sp.id}`)}
              >
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 group-hover:shadow-md transition">
                  <div className="flex h-16 w-16 mx-auto mb-3 items-center justify-center overflow-hidden rounded-full shadow-sm bg-gradient-to-br from-[#1a365d] to-[#2a4a7d]">
                    {sp.avatar && !sp.avatar.includes("default-avatar.png") ? (
                      <img src={sp.avatar} alt={sp.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-white">
                        {sp.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-center truncate">{sp.name}</h3>
                  <div className="flex justify-center items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold">{sp.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Rating Modal */}
      {clientId && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          userId={userId!}
          clientId={clientId}
          clientName={clientName}
          onSuccess={() => {
            setShowRatingModal(false);
            window.location.reload(); // Refresh to show new rating
          }}
        />
      )}
    </main>
  );
}
