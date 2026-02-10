import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaShieldAlt,
  FaStar,
  FaGlobe,
  FaBriefcase,
  FaGavel,
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
  // Additional fields from API
  bio?: string;
  city?: string;
  languages?: string[];
  services?: string[];
  specializations?: string[];
  courts?: string[];
  isOnline?: boolean;
  email?: string;
  phoneNumber?: string;
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
  const [showFullSpecialty, setShowFullSpecialty] = useState(false);
  const [showFullServices, setShowFullServices] = useState(false);

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
    bio,
    city,
    languages = [],
    services = [],
    specializations = [],
    courts = [],
    isOnline,
  } = profile;

  const pill = badges[0] ?? "Elite Professional";

  const displayRating = ratingStats?.averageRating || rating;
  const displayRatingCount = ratingStats?.ratingCount || 0;

  // Get all specializations as string
  const allSpecializations = specializations.length > 0
    ? specializations.join(" & ")
    : specialty;
  const isSpecialtyLong = allSpecializations && allSpecializations.length > 40;

  // Get all courts as string
  const allCourts = courts.length > 0 ? courts.join(", ") : court;

  // Get all languages as string
  const allLanguages = languages.join(", ");

  // Get services (limit display)
  const displayServices = showFullServices ? services : services.slice(0, 3);
  const hasMoreServices = services.length > 3;

  const handleProfileClick = () => {
    navigate(`/profileview?id=${id}`);
  };

  const handleMoreClick = (e: React.MouseEvent, type: 'specialty' | 'services') => {
    e.stopPropagation(); // Prevent card click when clicking "more"
    if (type === 'specialty') {
      setShowFullSpecialty(!showFullSpecialty);
    } else {
      setShowFullServices(!showFullServices);
    }
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
      className="group relative h-full flex flex-col rounded-[24px] border border-gray-100 bg-white p-4 sm:p-6 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-[#FFA800]/20 cursor-pointer"
      onClick={handleProfileClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleProfileClick(); }}
    >
      {/* Dynamic Brand Accent */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-[#FFA800]/5 to-transparent rounded-tr-[24px] pointer-events-none" />

      {/* Online Status Badge */}
      {isOnline && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-medium text-green-700">Online</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-2 sm:mb-6">
          <div className="h-16 w-16 sm:h-28 sm:w-28 overflow-hidden rounded-full ring-4 ring-white shadow-xl transition-transform duration-500 group-hover:scale-105">
            <img
              src={avatarUrl || '/assets/default-avatar.png'}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=FFA800&color=fff&size=128';
              }}
            />
          </div>
          {/* Status Badge */}
          <div className={`absolute -bottom-1 right-2 flex h-6 w-6 items-center justify-center rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white shadow-sm`}>
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
          {city && (
            <p className="text-[11px] text-gray-500">{city}</p>
          )}
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
      <div className="hidden sm:block my-3 sm:my-5 h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

      {/* Profile Metrics */}
      <div className="flex-grow space-y-2.5 sm:space-y-4">
        {/* Experience */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FFA800]">
            <FaShieldAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Experience</span>
            <span className="text-xs font-semibold text-gray-700">{experienceYears}+ Years</span>
          </div>
        </div>

        {/* Location / Courts */}
        <div className="hidden sm:flex items-start gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <FaMapMarkerAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Courts</span>
            <span className="text-xs font-semibold text-gray-700">{allCourts || 'Not specified'}</span>
          </div>
        </div>

        {/* Specialization */}
        <div className="hidden sm:flex items-start gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
            <FaGavel className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Specialization</span>
            <span className={`text-xs font-semibold text-gray-700 ${!showFullSpecialty && isSpecialtyLong ? 'line-clamp-1' : ''}`}>
              {allSpecializations || 'Not specified'}
            </span>
            {isSpecialtyLong && (
              <button
                onClick={(e) => handleMoreClick(e, 'specialty')}
                className="mt-1 text-[10px] font-semibold text-[#FFA800] hover:text-[#e09700] transition-colors self-start"
              >
                {showFullSpecialty ? '← Show less' : 'Show more →'}
              </button>
            )}
          </div>
        </div>

        {/* Languages */}
        {languages.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-500">
              <FaGlobe className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Languages</span>
              <span className="text-xs font-semibold text-gray-700">{allLanguages}</span>
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="hidden sm:flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <FaBriefcase className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Services</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {displayServices.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                  >
                    {service}
                  </span>
                ))}
              </div>
              {hasMoreServices && (
                <button
                  onClick={(e) => handleMoreClick(e, 'services')}
                  className="mt-1 text-[10px] font-semibold text-[#FFA800] hover:text-[#e09700] transition-colors self-start"
                >
                  {showFullServices ? '← Show less' : `+${services.length - 3} more →`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {/* {bio && bio.trim() && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50">
            <p className="text-[11px] text-gray-600 italic line-clamp-2">"{bio}"</p>
          </div>
        )} */}
      </div>

      {/* Profile Actions */}
      <div className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleProfileClick}
          className="flex-1 rounded-xl bg-[#FFA800] py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-lg shadow-[#FFA800]/20 hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wide"
        >
          View Profile
        </button>
        <button
          onClick={handleProfileClick}
          className="flex-1 rounded-xl bg-[#0f172a] py-2.5 text-[9px] sm:text-[11px] font-bold text-white uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all"
        >
          {pill}
        </button>
      </div>
    </div>
  );
}
