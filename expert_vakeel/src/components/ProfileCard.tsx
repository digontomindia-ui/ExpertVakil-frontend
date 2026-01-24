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
    // verified,
    badges = [],
  } = profile;

  const pill = badges[0] ?? "Individual Profile";

  // Use actual rating stats if available, otherwise fall back to profile rating
  const displayRating = ratingStats?.averageRating || rating;
  const displayRatingCount = ratingStats?.ratingCount || 0;

  const handleProfileClick = () => {
    console.log("Navigating to profile:", id);
    navigate(`/profileview?id=${id}`);
  };

  const renderStars = (ratingValue: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
              star <= Math.round(ratingValue) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
            aria-hidden
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative rounded-[16px] sm:rounded-[20px] border border-[#F1F1F1] bg-white p-4 sm:p-6 h-full cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      onClick={handleProfileClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleProfileClick(); }}
    >
      {/* Profile Image */}
      <div className="flex flex-col items-center text-center">
        <div className="grid h-30 w-30 sm:h-24 sm:w-24 md:h-28 md:w-28 place-items-center overflow-hidden rounded-full ring-2 ring-white shadow-md">
          <img
            src={avatarUrl}
            alt={`${name} avatar`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Name and Verification */}
        <div className="mt-4 sm:mt-5 flex items-center gap-1">
          <p className="text-sm sm:text-[15px] font-semibold text-black truncate max-w-[120px] sm:max-w-none">
            {name}
          </p>
          {/* {verified === true && (
            <FaCheckCircle
              className="h-3 sm:h-4 w-3 sm:w-4 text-[#1DA1F2] flex-shrink-0"
              aria-label="Verified"
            />
          )} */}
        </div>
        <p className="text-[11px] sm:text-[12px] text-gray-500 truncate max-w-full">
          {title}
        </p>

        {/* --- MOVED: Rating row (now shown normally under name/title) --- */}
        <div className="mt-2 flex items-center gap-2">
          {displayRatingCount > 0 ? (
            <>
              {renderStars(displayRating)}
              <span className="text-[12px] sm:text-sm text-gray-700 font-medium">
                {displayRating.toFixed(1)}
              </span>
              <span className="text-[11px] sm:text-[12px] text-gray-500">
                ({displayRatingCount})
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {renderStars(0)}{/* will render gray stars */}
              <span className="text-[12px] sm:text-sm text-gray-700 font-medium">New</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <ul className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2 text-[11px] sm:text-[12.5px] text-gray-700">
        <li className="flex items-center gap-2">
          <FaShieldAlt className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-500 flex-shrink-0" />
          <span className="truncate">
            <span className="font-semibold">{experienceYears}+ Years</span>{" "}
            Experience
          </span>
        </li>
        <li className="flex items-start gap-2">
          <FaMapMarkerAlt className="mt-0.5 h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-500 flex-shrink-0" />
          <span className="line-clamp-1 text-xs sm:text-[12.5px]">{court}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-[6px] w-[6px] sm:h-[7px] sm:w-[7px] rounded-full bg-gray-400 flex-shrink-0" />
          <span className="line-clamp-1 text-xs sm:text-[12.5px]">
            {specialty}
          </span>
        </li>
      </ul>

      {/* Badge */}
      <div className="mt-3 sm:mt-4">
        <span className="inline-block rounded-full border border-[#F1EAD7] bg-[#FFF9E6] px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10.5px] font-medium text-[#7A6424] truncate max-w-full">
          {pill}
        </span>
      </div>
    </div>
  );
}
