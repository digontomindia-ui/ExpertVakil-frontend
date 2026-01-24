import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { userAPI, ratingReviewAPI } from "../services/api";
import ProfileCard, { type Profile, type RatingReviewStats } from "./ProfileCard";

export default function TopRatedProfiles() {
  // --- state ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [ratingStats, setRatingStats] = useState<Record<string, RatingReviewStats>>({});
  const [loading, setLoading] = useState(true);

  // media query: >=1024px => desktop/laptop (hook always called)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // fetch rating stats (helper — not a hook)
  const fetchRatingStats = async (profileIds: string[]) => {
    if (!profileIds.length) return;
    const stats: Record<string, RatingReviewStats> = {};
    try {
      const results = await Promise.all(
        profileIds.map(async (userId) => {
          try {
            const response = await ratingReviewAPI.getStats(userId);
            return { userId, stats: response.data.data as RatingReviewStats };
          } catch {
            return {
              userId,
              stats: { averageRating: 0, ratingCount: 0, reviewCount: 0, userId, reviews: [] },
            };
          }
        })
      );
      results.forEach(({ userId, stats: s }) => (stats[userId] = s));
      setRatingStats(stats);
    } catch (err) {
      console.error("Error fetching rating stats:", err);
    }
  };

  // fetch profiles
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await userAPI.getAll();
        const data = response?.data?.data || [];

        // Filter out private profiles
        const visibleProfiles = data.filter((p: any) => p.visibility !== 'private');

        const mapped: Profile[] = visibleProfiles.map((user: any) => ({
          id: user.id,
          name: user.fullName,
          title: user.userType === "individual" ? "Expert Vakeel" : "Law Firm",
          avatarUrl: user.profilePic || "/assets/default-avatar.png",
          rating: 0,
          experienceYears: parseInt(user.yearsOfExperience) || 1,
          court: user.courts?.join(", ") || "Not specified",
          specialty: user.specializations?.join(" & ") || "General",
          verified: user.isVerify,
          badges: [user.userType === "individual" ? "Individual Profile" : "Law Firm"],
        }));
        setProfiles(mapped);
        await fetchRatingStats(mapped.map((p) => p.id));
      } catch (e) {
        console.error("Error fetching profiles:", e);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // filter profiles with rating >= 4
  useEffect(() => {
    const filtered = profiles.filter(profile => {
      const stats = ratingStats[profile.id];
      return stats && stats.averageRating >= 4;
    });
    setFilteredProfiles(filtered);
  }, [profiles, ratingStats]);

  // --- arrows (components defined inline but not as hooks) ---
  const Prev = ({ onClick }: { onClick?: () => void }) => (
    <button
      type="button"
      aria-label="Previous"
      onClick={onClick}
      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-gray-100"
    >
      <FaChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
    </button>
  );

  const Next = ({ onClick }: { onClick?: () => void }) => (
    <button
      type="button"
      aria-label="Next"
      onClick={onClick}
      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-gray-100"
    >
      <FaChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
    </button>
  );

  // --- computed (NOT hooks) so order never changes ---
  // show 2 on mobile, up to 4 on desktop
  const slidesToShow = isDesktop ? Math.min(4, filteredProfiles.length) : Math.min(2, filteredProfiles.length);
  // infinite only when there are more slides than visible
  const infinite = isDesktop ? filteredProfiles.length > 4 : filteredProfiles.length > 2;

  const settings = {
    infinite,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1, // scroll one card at a time while showing 2 on mobile
    arrows: true,
    swipeToSlide: true,
    touchMove: true,
    dots: false,
    adaptiveHeight: false, // keep consistent heights when showing multiple cards
    nextArrow: <Next />,
    prevArrow: <Prev />,
  } as const;

  // --- render (early returns AFTER all hooks/computed values) ---
  if (loading) {
    return (
      <section className="relative w-full bg-white">
        <div className="relative mx-auto max-w-[1280px] px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12 lg:px-8">
          <div className="mb-4 text-center sm:mb-6">
            <h2 className="text-xl font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[28px] md:text-[36px] lg:text-[44px]">
              Top Rated Profiles
            </h2>
            <p className="mt-1 text-xs text-black/60 sm:text-sm">Rated Top By Clients & Users</p>
          </div>
          <div className="py-8 text-center sm:py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Loading profiles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!filteredProfiles.length) {
    return (
      <section className="relative w-full bg-white">
        <div className="relative mx-auto max-w-[1280px] px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12 lg:px-8">
          <div className="mb-4 text-center sm:mb-6">
            <h2 className="text-xl font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[28px] md:text-[36px] lg:text-[44px]">
              Top Rated Profiles
            </h2>
            <p className="mt-1 text-xs text-black/60 sm:text-sm">Rated Top By Clients & Users</p>
          </div>
          <p className="text-center text-sm text-gray-600 sm:text-base">No profiles with rating 4 or higher available right now.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-white">
      <div className="relative mx-auto max-w-[1280px] px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12 lg:px-8">
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="text-xl font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[28px] md:text-[36px] lg:text-[44px]">
            Top Rated Profiles
          </h2>
          <p className="mt-1 text-xs text-black/60 sm:text-sm">Rated Top By Clients & Users</p>
        </div>

        {/* Force re-init when switching mobile<->desktop */}
        <div className="relative">
          <Slider key={isDesktop ? "desktop-4" : "mobile-2"} {...settings}>
            {filteredProfiles.map((p) => (
              <div key={p.id} className="px-1 sm:px-2">
                <ProfileCard profile={p} ratingStats={ratingStats[p.id]} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
