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

  // --- arrows ---
  const Prev = ({ onClick }: { onClick?: () => void }) => (
    <button
      type="button"
      aria-label="Previous"
      onClick={onClick}
      className="absolute -left-2 sm:-left-4 top-1/2 z-20 -translate-y-1/2 rounded-xl bg-white p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-[#FFA800] hover:text-white group active:scale-95 border border-gray-100/50"
    >
      <FaChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );

  const Next = ({ onClick }: { onClick?: () => void }) => (
    <button
      type="button"
      aria-label="Next"
      onClick={onClick}
      className="absolute -right-2 sm:-right-4 top-1/2 z-20 -translate-y-1/2 rounded-xl bg-white p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-[#FFA800] hover:text-white group active:scale-95 border border-gray-100/50"
    >
      <FaChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );

  // --- computed values ---
  const slidesToShow = isDesktop ? Math.min(4, filteredProfiles.length) : Math.min(2, filteredProfiles.length);
  const infinite = filteredProfiles.length > slidesToShow;

  const settings = {
    infinite,
    speed: 600,
    slidesToShow,
    slidesToScroll: 1,
    arrows: true,
    swipeToSlide: true,
    touchMove: true,
    dots: false,
    nextArrow: <Next />,
    prevArrow: <Prev />,
    responsive: [
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1.2,
          slidesToScroll: 1,
          arrows: false,
          centerMode: true,
          centerPadding: '20px',
        }
      }
    ] as any[]
  } as const;

  // --- render ---
  if (loading) {
    return (
      <section className="relative w-full bg-[#FBFBFB] py-12 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[#FFA800] border-t-transparent" />
        </div>
      </section>
    );
  }

  if (!filteredProfiles.length) return null;

  return (
    <section className="relative w-full bg-gradient-to-b from-white to-[#FBFBFB] py-12 sm:py-20 overflow-hidden">
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="mb-10 sm:mb-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-[#FFA800]/30" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFA800]">
              Elite Legal Professionals
            </span>
            <div className="h-px w-8 bg-[#FFA800]/30" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-5xl">
            Top Rated <span className="text-[#FFA800]">Advocates</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 sm:text-lg">
            Connect with the highest-rated legal experts verified for excellence and client satisfaction.
          </p>
        </div>

        {/* Slider Section */}
        <div className="relative profile-slider-container">
          <Slider key={isDesktop ? "desktop" : "mobile"} {...settings}>
            {filteredProfiles.map((p) => (
              <div key={p.id} className="p-2 sm:p-4 h-full">
                <ProfileCard profile={p} ratingStats={ratingStats[p.id]} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
