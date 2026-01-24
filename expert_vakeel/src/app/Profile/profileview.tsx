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

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    const clientData = localStorage.getItem("client");

    // If no token and no client data, redirect to login
    if (!token && (!clientData || clientData === "undefined")) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Refresh page at least twice when component mounts
  useEffect(() => {
    const refreshKey = `profileview_refresh_${userId}`;
    let refreshCount = parseInt(sessionStorage.getItem(refreshKey) || '0');
    const maxRefreshes = 2;

    console.log(`Current refresh count: ${refreshCount}/${maxRefreshes}`);

    if (refreshCount < maxRefreshes) {
      refreshCount++;
      sessionStorage.setItem(refreshKey, refreshCount.toString());

      console.log(`Refreshing page (${refreshCount}/${maxRefreshes})`);

      // Small delay before refresh to ensure component is fully loaded
      const timer = setTimeout(() => {
        window.location.reload();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // Reset the counter after max refreshes are done
      sessionStorage.removeItem(refreshKey);
      console.log('Reached maximum refreshes, stopping auto-refresh');
    }
  }, [userId]);


  const handleSendMessage = () => {
    if (userId && profileData) startConversation(userId, profileData.name);
  };

  // client (optional auth)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const clientData = localStorage.getItem("client");
    if (token && clientData && clientData !== "undefined") {
      try {
        const c = JSON.parse(clientData);
        setClientId(c.id || c._id);
        setClientName(c.fullName || "Anonymous User");
      } catch {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setClientId(payload.id);
          setClientName("Anonymous User");
        } catch {}
      }
    }
  }, []);

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
            `Professional ${user.userType === "individual" ? "lawyer" : "law firm"} with ${
              user.yearsOfExperience || 0
            } years of experience in ${user.specializations?.join(", ") || "general practice"}. Specializing in ${
              user.courts?.join(", ") || "various courts"
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

        // similar
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
        {/* Back */}
        <div className="mb-4">
          <button
            onClick={() => navigate("/findprofile")}
            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Profile Card */}
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
                <div className="h-24 w-24 overflow-hidden rounded-full shadow-lg ring-4 ring-white sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40">
                  <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                </div>
                {/* {p.isTopRated && (
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                )} */}
              </div>
            </div>

            {/* Info (min-w-0 is CRUCIAL) */}
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

            {/* Actions (min-w-0 and full-width on mobile) */}
            <div className="flex min-w-0 justify-stretch gap-2 sm:gap-3 md:col-span-2 md:justify-end lg:col-span-1 lg:flex-col">
              <GhostButton
                className="w-full"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  const clientData = localStorage.getItem("client");
                  if (!clientId) {
                    if (!token) return navigate("/login");

                    let id: string | null = null;
                    let name: string | null = null;

                    if (clientData && clientData !== "undefined") {
                      try {
                        const c = JSON.parse(clientData);
                        id = c.id || c._id;
                        name = c.fullName;
                        setClientName(name || "Anonymous User");
                      } catch {}
                    }
                    if (!id && token) {
                      try {
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        id = payload.id;
                      } catch {}
                    }
                    if (id) {
                      setClientId(id);
                      setTimeout(() => setShowRatingModal(true), 100);
                    } else {
                      navigate("/login");
                    }
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

          {/* Tabs (scrollable on mobile) */}
          <div className="mt-8">
            <div className="no-scrollbar inline-flex w-full max-w-full overflow-x-auto rounded-full bg-gray-100 p-1">
              <div className="flex w-max gap-1">
                <button
                  onClick={() => setActiveTab("bio")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "bio" ? "bg-[#FFC928] text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Bio
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "reviews" ? "bg-[#FFC928] text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Reviews ({Array.isArray(reviews) ? reviews.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab("share")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "share" ? "bg-[#FFC928] text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Share Profile
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "report" ? "bg-[#FFC928] text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Report Profile
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
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
                {/* Personal */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Personal Details</h3>
                  <div className="space-y-3 text-sm">
                    {p.gender && (
                      <div className="flex items-start">
                        <span className="w-24 font-medium text-gray-700">Gender:</span>
                        <span className="capitalize text-gray-600">{p.gender}</span>
                      </div>
                    )}
                    {p.city && (
                      <div className="flex items-start">
                        <span className="w-24 font-medium text-gray-700">City:</span>
                        <span className="text-gray-600">{p.city}</span>
                      </div>
                    )}
                    {p.completeAddress && p.isAddressPublic && (
                      <div className="flex items-start">
                        <span className="w-24 font-medium text-gray-700">Address:</span>
                        <span className="text-gray-600">{p.completeAddress}</span>
                      </div>
                    )}
                    {p.languages?.length ? (
                      <div className="flex items-start">
                        <span className="w-24 font-medium text-gray-700">Languages:</span>
                        <span className="text-gray-600">{p.languages.join(", ")}</span>
                      </div>
                    ) : null}
                    {p.travelPreference && (
                      <div className="flex items-start">
                        <span className="w-24 font-medium text-gray-700">Travel:</span>
                        <span className="capitalize text-gray-600">{p.travelPreference}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Stats */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact & Stats</h3>
                  <div className="space-y-3 text-sm">
                    {p.email && (
                      <div className="flex items-start">
                        <span className="w-32 font-medium text-gray-700">Email:</span>
                        <span className="break-all text-gray-600">{p.email}</span>
                      </div>
                    )}
                    {p.phoneNumber && (
                      <div className="flex items-start">
                        <span className="w-32 font-medium text-gray-700">Phone:</span>
                        <span className="text-gray-600">{p.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="w-32 font-medium text-gray-700">Total Reviews:</span>
                      <span className="text-gray-600">
                        {p.ratingStats
                          ? p.ratingStats.reviewCount > 0
                            ? `${p.ratingStats.reviewCount} review${p.ratingStats.reviewCount !== 1 ? "s" : ""}`
                            : "No reviews yet"
                          : p.reviewCount || "0"}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 font-medium text-gray-700">Average Rating:</span>
                      <span className="text-gray-600">
                        {p.ratingStats ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= Math.round(p.ratingStats!.averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="ml-1">
                              {p.ratingStats.ratingCount > 0
                                ? `${p.ratingStats.averageRating.toFixed(1)} (${p.ratingStats.ratingCount} rating${
                                    p.ratingStats.ratingCount !== 1 ? "s" : ""
                                  })`
                                : "No ratings yet"}
                            </span>
                          </div>
                        ) : (
                          <span>{p.rating.toFixed(1)} ⭐</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 font-medium text-gray-700">Account Type:</span>
                      <span className="capitalize text-gray-600">{p.userType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              {p.specializations?.length ? (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Areas of Specialization</h3>
                  <div className="flex flex-wrap gap-2">
                    {p.specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex max-w-full items-center rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-200"
                      >
                        <span className="truncate">{spec}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Services */}
              {p.services?.length ? (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Services Offered</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {p.services.map((service, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-gray-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Courts */}
              {p.courts?.length ? (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 p-4 sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Courts of Practice</h3>
                  <div className="flex flex-wrap gap-2">
                    {p.courts.map((court, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{court}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <div className="mt-6">
              <div className="rounded-2xl bg-gray-50 p-4 sm:p-5 md:p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Reviews & Ratings</h3>

                {!Array.isArray(reviews) || reviews.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mb-2 text-gray-400">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No reviews yet</p>
                    <p className="mt-1 text-xs text-gray-400">Be the first to leave a review!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const displayName = review.clientName || `Client ${review.clientId?.slice(0, 8) || "Unknown"}...`;
                      const date = timestampToDate(review.createdAt);
                      return (
                        <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                                <span className="text-xs font-medium text-gray-600">
                                  {(displayName || "A").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3 w-3 ${
                                        s <= (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                  {review.rating && <span className="ml-1 text-xs text-gray-500">{review.rating}/5</span>}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {date
                                ? date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                                : "Unknown date"}
                            </span>
                          </div>
                          {review.review && <p className="text-sm leading-relaxed text-gray-700">{review.review}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Share */}
          {activeTab === "share" && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-4 sm:p-5 md:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Share Profile</h3>
              <p className="mb-6 text-sm text-gray-600">Share this profile with others who might need legal assistance.</p>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Check out ${p.name} - Expert Legal Professional on Expert Vakeel`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700"
                >
                  <Facebook className="h-4 w-4" />
                  <span className="text-sm font-medium">Facebook</span>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(
                      `Check out ${p.name} - Expert Legal Professional on Expert Vakeel #LegalExpert`
                    );
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 p-3 text-white transition-colors hover:bg-sky-600"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="text-sm font-medium">Twitter</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.href}\n\nCheck out ${p.name} - Expert Legal Professional on Expert Vakeel`
                    );
                    alert("Profile link copied! You can now paste it on Instagram.");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-3 text-white transition-colors hover:from-purple-600 hover:to-pink-600"
                >
                  <Instagram className="h-4 w-4" />
                  <span className="text-sm font-medium">Instagram</span>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const title = encodeURIComponent(`${p.name} - Expert Legal Professional`);
                    const summary = encodeURIComponent(
                      `Connect with ${p.name}, an experienced legal professional specializing in ${
                        p.specializations?.join(", ") || "various legal matters"
                      }.`
                    );
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`,
                      "_blank"
                    );
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 p-3 text-white transition-colors hover:bg-blue-800"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Check out ${p.name} - Expert Vakeel\n\n${url}`);
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-500 p-3 text-white transition-colors hover:bg-green-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Profile link copied to clipboard!");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 p-3 text-white transition-colors hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm font-medium">Copy Link</span>
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
                Share this profile to help others find qualified legal professionals
              </p>
            </div>
          )}

          {/* Report */}
          {activeTab === "report" && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-4 sm:p-5 md:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Report Profile</h3>
              <p className="mb-6 text-sm text-gray-600">
                If you believe this profile violates our community guidelines or contains inappropriate content,
                please report it. We'll review your report and take appropriate action.
              </p>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for reporting <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="inappropriate_content">Inappropriate content</option>
                    <option value="spam">Spam or misleading information</option>
                    <option value="harassment">Harassment or abusive behavior</option>
                    <option value="fraud">Potential fraud or scam</option>
                    <option value="fake_profile">Fake or impersonation profile</option>
                    <option value="copyright">Copyright infringement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Please provide more details about your report..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Submit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bio")}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Your report will be reviewed by our team within 24-48 hours.
                  We take all reports seriously and maintain confidentiality.
                </p>
              </form>
            </div>
          )}
        </section>

        {/* Similar Profiles */}
        <section className="mt-12 sm:mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Similar Profiles</h2>
          <p className="mt-1 text-sm text-gray-500">From Same Court &amp; Specialization</p>

          {/* Mobile: horizontal scroll; md+: grid */}
          <div className="mt-6">
            <div
              className="
              no-scrollbar flex gap-4 overflow-x-auto pb-2
              md:grid md:grid-cols-2 md:gap-5 md:overflow-visible
              lg:grid-cols-3 xl:grid-cols-4
            "
            >
              {similarProfiles.map((sp) => (
                <SimilarProfileCard key={sp.id} p={sp} />
              ))}
            </div>
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
            if (!userId) return;
            (async () => {
              try {
                const response = await userAPI.getById(userId);
                const user: User = response.data.data;
                let stats: RatingReviewStats;
                try {
                  const r = await ratingReviewAPI.getStats(user.id);
                  stats = r.data.data;
                } catch {
                  stats = { averageRating: 0, ratingCount: 0, reviewCount: 0, userId: user.id, reviews: [] };
                }
                setProfileData((prev) =>
                  prev ? { ...prev, rating: stats.averageRating || 0, ratingStats: stats } : prev
                );
                setReviews(stats.reviews || []);
              } catch (e) {
                console.error("Error refreshing profile data:", e);
              }
            })();
          }}
        />
      )}
    </main>
  );
}

/* ---------------- Similar Profile Card ---------------- */

function SimilarProfileCard({ p }: { p: SimilarProfile }) {
  const navigate = useNavigate();
  const go = () => navigate(`/profileview?id=${p.id}`);

  return (
    <div
      onClick={go}
      className="w-[220px] cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:w-auto md:min-w-0"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="relative">
          <img
            src={p.avatar}
            alt={p.name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
          {/* {p.verified && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
              <CheckCircle2 className="h-2.5 w-2.5 text-white" />
            </div>
          )} */}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">{p.name}</h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-2.5 w-2.5 ${s <= Math.round(p.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
            <span className="ml-1 text-xs text-gray-600">{p.rating > 0 ? p.rating.toFixed(1) : "New"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <p className="truncate">{p.experience}</p>
        <p className="truncate">{p.court}</p>
        <p className="truncate">{p.specialization}</p>
      </div>
    </div>
  );
}
