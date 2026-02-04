import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaShieldAlt,
  FaStar,
  // FaCheckCircle,
} from "react-icons/fa";

export type Profile = {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  rating: number;
  experienceYears: number;
  court: string;
  specialty: string;
  verified?: boolean;
  badges?: string[];
};

export type RatingReviewStats = {
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  userId: string;
};

interface ProfileCardProps {
  profile: Profile;
  ratingStats?: RatingReviewStats;
}

export default function ProfileCard({ profile, ratingStats }: ProfileCardProps) {
  const navigate = useNavigate();
  const {
    id,
    name,
    title,
    avatarUrl,
    rating,
    experienceYears,
    court,
    specialty,
    badges = [],
  } = profile;

  const pill = badges[0] ?? "Elite Professional";

  const displayRating = ratingStats?.averageRating || rating;
  const displayRatingCount = ratingStats?.ratingCount || 0;

  const handleProfileClick = () => {
    navigate(`/profileview?id=${id}`);
  };

  const renderStars = (ratingValue: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${star <= Math.round(ratingValue) ? "text-[#FFA800]" : "text-gray-200"
              }`}
            aria-hidden
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="group relative h-full flex flex-col rounded-[24px] border border-gray-100 bg-white p-5 sm:p-6 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-[#FFA800]/20 cursor-pointer"
      onClick={handleProfileClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleProfileClick(); }}
    >
      {/* Dynamic Brand Accent */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-[#FFA800]/5 to-transparent rounded-tr-[24px] pointer-events-none" />

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4 sm:mb-6">
          <div className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full ring-4 ring-white shadow-xl transition-transform duration-500 group-hover:scale-105">
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {/* Status Badge */}
          <div className="absolute -bottom-1 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 border-2 border-white shadow-sm">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Name & Role */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#FFA800] transition-colors">
            {name}
          </h3>
          <p className="text-[12px] font-medium text-[#FFA800] uppercase tracking-wider">
            {title}
          </p>
        </div>

        {/* Rating Row */}
        <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
          {renderStars(displayRating)}
          <span className="text-[12px] font-bold text-gray-800">
            {displayRating.toFixed(1)}
          </span>
          <span className="text-[11px] font-medium text-gray-400">
            ({displayRatingCount})
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

      {/* Profile Metrics */}
      <div className="flex-grow space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FFA800]">
            <FaShieldAlt className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Experience</span>
            <span className="text-xs font-semibold text-gray-700">{experienceYears}+ Years</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <FaMapMarkerAlt className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</span>
            <span className="text-xs font-semibold text-gray-700 line-clamp-1">{court}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
            <div className="h-2 w-2 rounded-full bg-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Specialization</span>
            <span className="text-xs font-semibold text-gray-700 line-clamp-1">{specialty}</span>
          </div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="mt-6 flex items-center justify-between">
        <span className="inline-flex rounded-lg bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-widest">
          {pill}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFA800] text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 shadow-lg shadow-[#FFA800]/30">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
