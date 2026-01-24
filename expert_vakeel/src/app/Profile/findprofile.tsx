// findprofile.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Search, X, Check } from "lucide-react";
import WhyExpertVakeel from "../../components/whyexpertVakeel";
import ProfileCard, {
  type Profile,
  type RatingReviewStats as CardRatingStats,
} from "../../components/ProfileCard";
import { ratingReviewAPI, publicUserAPI } from "../../services/api";
import type { RatingReviewStats } from "../../services/api";

/* ------------------------------ Frame ------------------------------ */

function Header() {
  return <header className="h-2" />;
}
function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-gray-600">
        © {new Date().getFullYear()} Legal Network · All rights reserved.
      </div>
    </footer>
  );
}

/* ------------------------------ Types/Consts ------------------------------ */

type Filters = {
  court: string;
  city: string;
  specialization: string;
  exp: string;
  language: string;
  profileType: string;
  verified: string;
  userType: string;
  languages: string;
};

const COURTS = [
  "Supreme Court of India",
  "Punjab & Haryana High Court",
  "Delhi High Court",
  "Bombay High Court",
  "Calcutta High Court",
  "District & Session Courts",
];
const CITIES = [
  "Chandigarh",
  "Mohali",
  "Panchkula",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Pune",
];
const SPECIALIZATIONS = [
  "Civil Matters",
  "Criminal Matters",
  "Family Matters",
  "Labour/Employee Matters",
  "Taxation Matters",
  "Documentation & Registration",
  "Trademark & Copyright Matters",
  "High Court Matters",
  "Supreme Court Matters",
  "Forums and Tribunal Matters",
  "Business Matters",
];
const YEARS_OF_EXP = ["0–1", "2–4", "5–7", "8–10", "10+"];
const LANGUAGES = [
  "English",
  "Hindi",
  "Punjabi",
  "Marathi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Kannada",
  "Gujarati",
  "Urdu",
];
// Map API values to display names
const getProfileTypeDisplayName = (apiValue: string) => {
  switch (apiValue) {
    case 'individual': return 'Individual Lawyer';
    case 'firm': return 'Law Firm';
    default: return apiValue;
  }
};

// Map display names back to API values
const getProfileTypeApiValue = (displayName: string) => {
  switch (displayName) {
    case 'Individual Lawyer': return 'individual';
    case 'Law Firm': return 'firm';
    default: return displayName;
  }
};

const PROFILE_TYPES = ["individual", "firm"];
const VERIFIED = ["Verified", "Unverified"];

type FindProfile = {
  id: string;
  fullName: string;
  profilePic?: string;
  city?: string;
  courts?: string[];
  yearsOfExperience?: number | string;
  specializations?: string[];
  isVerify?: boolean;
  bio?: string;
  completeAddress?: string;
  languages?: string[];
  userType?: 'individual' | 'firm';
  visibility?: string;
};

/* ------------------------------ Page ------------------------------ */

export default function FindProfilePage() {
  const [searchParams] = useSearchParams();

  // search & filters
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(true);

  // Expand filters by default on desktop
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 640) {
      setCollapsed(false);
    }
  }, []);
  const [filters, setFilters] = useState<Filters>({
    court: "",
    city: "",
    specialization: "",
    exp: "",
    language: "",
    profileType: "",
    verified: "",
    userType: "",
    languages: "",
  });

  // data
  const [profiles, setProfiles] = useState<FindProfile[]>([]);
  const [ratingStats, setRatingStats] = useState<Record<string, RatingReviewStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination (grid)
  const PAGE_SIZE = 20;
  const [visible, setVisible] = useState(PAGE_SIZE);

  // derived
  const matchingCount = useMemo(() => profiles.length, [profiles]);

  // Create stable filter string for useEffect dependencies
  const activeFiltersString = useMemo(() =>
    JSON.stringify({
      court: filters.court,
      city: filters.city,
      specialization: filters.specialization,
      exp: filters.exp,
      language: filters.language,
      profileType: filters.profileType,
      verified: filters.verified,

    }),
    [filters.court, filters.city, filters.specialization, filters.exp, filters.language, filters.profileType, filters.verified]
  );

  /* ------------------------------ Derived filter options (from ALL users - independent of filters) ------------------------------ */


  /* ------------------------------ Handlers ------------------------------ */

  const onChangeFilter = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value.trim() }));
  const resetFilters = () =>
    setFilters({
      court: "",
      city: "",
      specialization: "",
      exp: "",
      language: "",
      profileType: "",
      verified: "",
      userType: "",
      languages: "",
    });
  const clearAll = () => {
    setQ("");
    resetFilters();
  };

  /* ------------------------------ Data fetch ------------------------------ */

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
              stats: {
                averageRating: 0,
                ratingCount: 0,
                reviewCount: 0,
                userId,
                reviews: [],
              },
            };
          }
        })
      );
      results.forEach(({ userId, stats: s }) => {
        stats[userId] = s;
      });
      setRatingStats(stats);
    } catch (err) {
      console.error("Error fetching rating stats:", err);
    }
  };

  // Store all users for client-side filtering
  const [allUsers, setAllUsers] = useState<FindProfile[]>([]);

  const yearsToBucket = (years?: number | string) => {
    const numYears = typeof years === 'string' ? parseInt(years, 10) : years;
    if (typeof numYears !== "number" || isNaN(numYears)) return "";
    if (numYears <= 1) return "0–1";
    if (numYears <= 4) return "2–4";
    if (numYears <= 7) return "5–7";
    if (numYears <= 10) return "8–10";
    return "10+";
  };

  const derivedOptions = useMemo(() => {
    const courtsSet = new Set<string>();
    const citiesSet = new Set<string>();
    const specsSet = new Set<string>();
    const yearsSet = new Set<string>();
    const langSet = new Set<string>();
    const profileTypeSet = new Set<string>();
    const verifiedSet = new Set<string>();

    // Use ALL users for filter options, not filtered results
    for (const p of allUsers) {
      if (p.courts?.length) p.courts.forEach((c) => courtsSet.add(c));
      if (p.city) citiesSet.add(p.city);
      if (p.specializations?.length) p.specializations.forEach((s) => specsSet.add(s));
      if (typeof p.yearsOfExperience === "number" || typeof p.yearsOfExperience === "string") yearsSet.add(yearsToBucket(p.yearsOfExperience));
      // If your API returns languages array, add them here:
      // if (p.languages?.length) p.languages.forEach(l => langSet.add(l));
      if (p.isVerify === true) verifiedSet.add("Verified");
      if (p.isVerify === false) verifiedSet.add("Unverified");
      // Add user type if it exists
      if (p.userType) profileTypeSet.add(p.userType);
    }

    return {
      courts: courtsSet.size ? Array.from(courtsSet).sort() : COURTS,
      cities: citiesSet.size ? Array.from(citiesSet).sort() : CITIES,
      specializations: specsSet.size ? Array.from(specsSet).sort() : SPECIALIZATIONS,
      years: yearsSet.size ? Array.from(yearsSet).sort((a, b) => YEARS_OF_EXP.indexOf(a) - YEARS_OF_EXP.indexOf(b)) : YEARS_OF_EXP,
      languages: langSet.size ? Array.from(langSet).sort() : LANGUAGES,
      profileTypes: profileTypeSet.size ? Array.from(profileTypeSet).map(type => getProfileTypeDisplayName(type)).sort() : PROFILE_TYPES.map(type => getProfileTypeDisplayName(type)),
      verified: verifiedSet.size ? Array.from(verifiedSet).sort() : VERIFIED,
    };
  }, [allUsers]);

  const fetchAllUsers = async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      // Fetch ALL users without any filters
      const response = await publicUserAPI.getAll({});
      const data: FindProfile[] = response.data.data || [];

      // Filter out private profiles
      const visibleProfiles = data.filter(p => p.visibility !== 'private');

      setAllUsers(visibleProfiles);
      setProfiles(visibleProfiles); // Initially show all users
      setVisible(PAGE_SIZE);
      await fetchRatingStats(visibleProfiles.map((p) => p.id));
    } catch (err: any) {
      console.error("Error fetching users:", err);
      if (err?.response) {
        console.error("Server response status:", err.response.status);
        console.error("Server response body:", err.response.data);
        setError("Failed to load profiles. Please try again.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
      setAllUsers([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function
  const applyFilters = () => {
    let filtered = [...allUsers];

    // Apply search filter (name, courts, specializations, city)
    if (q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm) ||
        user.courts?.some(court => court.toLowerCase().includes(searchTerm)) ||
        user.specializations?.some(spec => spec.toLowerCase().includes(searchTerm)) ||
        user.city?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter (from URL)
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam);
      filtered = filtered.filter(user => {
        const specs = user.specializations || [];
        const courts = user.courts || [];

        switch (decodedCategory) {
          case 'Family Matters':
            return specs.some(s => ['Family', 'Divorce', 'Child Custody', 'Marriage'].includes(s));
          case 'Criminal Matters':
            return specs.some(s => ['Criminal', 'Crime', 'FIR', 'Bail'].includes(s));
          case 'Civil Matters':
            return specs.some(s => ['Civil', 'Property', 'Contract', 'Recovery'].includes(s));
          case 'Supreme Court Matters':
            return courts.includes('Supreme Court of India');
          default:
            return specs.some(s => s.toLowerCase().includes(decodedCategory.toLowerCase()));
        }
      });
    }

    // Apply court filter (partial matching)
    if (filters.court) {
      const courtTerm = filters.court.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.courts?.some(court => court.toLowerCase().includes(courtTerm))
      );
    }

    // Apply city filter (partial matching)
    if (filters.city) {
      const cityTerm = filters.city.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.city?.toLowerCase().includes(cityTerm)
      );
    }

    // Apply specialization filter
    if (filters.specialization) {
      filtered = filtered.filter(user =>
        user.specializations?.some(spec => spec === filters.specialization)
      );
    }

    // Apply experience filter
    if (filters.exp) {
      filtered = filtered.filter(user => {
        const expYears = typeof user.yearsOfExperience === 'string'
          ? parseInt(user.yearsOfExperience, 10)
          : user.yearsOfExperience;

        if (typeof expYears !== 'number' || isNaN(expYears)) return false;

        switch (filters.exp) {
          case '0–1': return expYears >= 0 && expYears <= 1;
          case '2–4': return expYears >= 2 && expYears <= 4;
          case '5–7': return expYears >= 5 && expYears <= 7;
          case '8–10': return expYears >= 8 && expYears <= 10;
          case '10+': return expYears >= 10;
          default: return true;
        }
      });
    }

    // Apply language filter
    if (filters.language) {
      filtered = filtered.filter(user =>
        user.languages?.some(lang => lang === filters.language)
      );
    }

    // Apply profile type filter
    if (filters.profileType) {
      const apiValue = getProfileTypeApiValue(filters.profileType);
      filtered = filtered.filter(user => user.userType === apiValue);
    }

    // Apply verified filter
    if (filters.verified) {
      const isVerified = filters.verified === "Verified";
      filtered = filtered.filter(user => user.isVerify === isVerified);
    }

    setProfiles(filtered);
    setVisible(PAGE_SIZE);
    // Update rating stats for filtered results (only if we have results)
    if (filtered.length > 0) {
      fetchRatingStats(filtered.map((p) => p.id));
    }
  };


  // URL → initial filters and search
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const specializationParam = searchParams.get("specialization");
    const cityParam = searchParams.get("city");
    const searchParam = searchParams.get("search");

    const decodedCategory = categoryParam ? decodeURIComponent(categoryParam) : null;
    const decodedSpecialization = specializationParam ? decodeURIComponent(specializationParam) : null;
    const decodedCity = cityParam ? decodeURIComponent(cityParam) : null;
    const decodedSearch = searchParam ? decodeURIComponent(searchParam) : null;

    let hasUrlFilters = false;

    if (decodedCategory || decodedSpecialization || decodedCity) {
      setFilters((prev) => ({
        ...prev,
        specialization: decodedSpecialization || decodedCategory || prev.specialization,
        city: decodedCity || prev.city,
      }));


      if (typeof window !== "undefined" && window.innerWidth >= 640) {
        setCollapsed(false);
      }
      hasUrlFilters = true;
    }

    if (decodedSearch) {
      setQ(decodedSearch);
    }

    // If we have URL filters and users are already loaded, apply filters immediately
    if (hasUrlFilters && allUsers.length > 0) {
      setTimeout(() => {
        const urlFilters = {
          specialization: decodedSpecialization || decodedCategory || "",
          city: decodedCity || "",
        };
        applyFiltersWithValues(urlFilters, decodedSearch || "");
      }, 100);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allUsers.length]);

  // Helper function to apply filters with specific values
  const applyFiltersWithValues = (filterValues: Partial<typeof filters>, searchValue: string) => {
    let filtered = [...allUsers];

    // Apply search filter
    if (searchValue.trim()) {
      const searchTerm = searchValue.trim().toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm) ||
        user.courts?.some(court => court.toLowerCase().includes(searchTerm)) ||
        user.specializations?.some(spec => spec.toLowerCase().includes(searchTerm)) ||
        user.city?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter (from URL)
    if (filterValues.specialization) {
      filtered = filtered.filter(user => {
        const specs = user.specializations || [];
        const courts = user.courts || [];

        switch (filterValues.specialization) {
          case 'Family Matters':
            return specs.some(s => ['Family', 'Divorce', 'Child Custody', 'Marriage'].includes(s));
          case 'Criminal Matters':
            return specs.some(s => ['Criminal', 'Crime', 'FIR', 'Bail'].includes(s));
          case 'Civil Matters':
            return specs.some(s => ['Civil', 'Property', 'Contract', 'Recovery'].includes(s));
          case 'Supreme Court Matters':
            return courts.includes('Supreme Court of India');
          default:
            return specs.some(s => s.toLowerCase().includes(filterValues.specialization!.toLowerCase()));
        }
      });
    }

    // Apply city filter (partial matching)
    if (filterValues.city) {
      const cityTerm = filterValues.city.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.city?.toLowerCase().includes(cityTerm)
      );
    }

    setProfiles(filtered);
    setVisible(PAGE_SIZE);
    if (filtered.length > 0) {
      fetchRatingStats(filtered.map((p) => p.id));
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // If we have all users loaded, apply filters immediately
      if (allUsers.length > 0) {
        applyFilters();
      } else {
        // Otherwise fetch all users first
        fetchAllUsers();
      }
    }, 300); // Debounce both search bar and filter changes by 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, activeFiltersString]);

  const handleApplyFilters = (e?: FormEvent) => {
    e?.preventDefault?.();
    if (allUsers.length > 0) {
      applyFilters();
    } else {
      fetchAllUsers();
    }
  };

  // FindProfile → Profile (for ProfileCard)
  const mapToProfileCard = (fp: FindProfile): Profile => ({
    id: fp.id,
    name: fp.fullName,
    title: "Expert Vakeel",
    avatarUrl: fp.profilePic || "/assets/default-avatar.png",
    rating: 0,
    experienceYears: typeof fp.yearsOfExperience === 'string'
      ? parseInt(fp.yearsOfExperience, 10) || 1
      : fp.yearsOfExperience || 1,
    court: fp.courts?.join(", ") || "Not specified",
    specialty: fp.specializations?.join(" & ") || "General",
    verified: fp.isVerify,
    badges: ["Individual Profile"],
  });

  /* ------------------------------ Render ------------------------------ */

  return (
    <div className="min-h-[100dvh] bg-white text-gray-900">
      <Header />

      {/* HERO */}
      <section className="mx-auto w-full max-w-screen-xl ">
        {/* Centered Image */}
        <div className="flex justify-center">
          <div className="w-full max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
            <div className="relative w-full overflow-hidden h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center">
              <img
                src="/assets/Group 131478.svg"
                alt="Find Top Rated Lawyers & Law Firms From All Over India"
                className="max-h-full max-w-full object-contain"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="mx-auto mb-10 w-full max-w-[1200px] px-3 sm:mb-14 sm:px-4 md:px-6">
        <div className="rounded-[20px] border border-black/5 bg-[#F5F6F7] p-4 shadow sm:rounded-[28px] sm:p-5 md:p-8">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-5 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <h2 className="text-xl font-semibold sm:text-[28px]">Apply Filters &amp; Search</h2>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                {matchingCount?.toLocaleString() || "0"} Matching Profiles Found
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setCollapsed((s) => !s)}
                className="rounded-full bg-[#EDEEEF] px-3 py-2 text-xs font-medium text-gray-800 shadow transition hover:bg-[#E6E7E8] sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {collapsed ? "Expand" : "Collapse"}
              </button>
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full bg-[#EDEEEF] px-3 py-2 text-xs font-medium text-gray-800 shadow transition hover:bg-[#E6E7E8] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <X size={14} /> <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {!collapsed && (
            <form onSubmit={handleApplyFilters} className="space-y-6">
              {/* Search */}
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
                  <Search size={18} className="text-gray-400" />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search Names, Courts, Categories & City Here"
                  className="w-full rounded-full border border-transparent bg-white px-12 py-4 text-sm text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-200"
                />
              </div>

              {/* Grid of select-like filters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SelectLike
                  label="Preferred Courts"
                  value={filters.court}
                  onChange={(v) => onChangeFilter("court", v)}
                  options={allUsers.length > 0 ? derivedOptions.courts : []}
                  disabled={allUsers.length === 0}
                  searchable={true}
                />
                <SelectLike
                  label="Preferred City"
                  value={filters.city}
                  onChange={(v) => onChangeFilter("city", v)}
                  options={allUsers.length > 0 ? derivedOptions.cities : []}
                  disabled={allUsers.length === 0}
                  searchable={true}
                />
                <SelectLike
                  label="Specialization"
                  value={filters.specialization}
                  onChange={(v) => onChangeFilter("specialization", v)}
                  options={allUsers.length > 0 ? derivedOptions.specializations : []}
                  disabled={allUsers.length === 0}
                />
                <SelectLike
                  label="Years Of Experience"
                  value={filters.exp}
                  onChange={(v) => onChangeFilter("exp", v)}
                  options={derivedOptions.years}
                />
                <SelectLike
                  label="Language"
                  value={filters.language}
                  onChange={(v) => onChangeFilter("language", v)}
                  options={allUsers.length > 0 ? derivedOptions.languages : []}
                  disabled={allUsers.length === 0}
                />
                <SelectLike
                  label="Profile Type"
                  value={filters.profileType}
                  onChange={(v) => onChangeFilter("profileType", v)}
                  options={allUsers.length > 0 ? derivedOptions.profileTypes : []}
                  disabled={allUsers.length === 0}
                />
                <SelectLike
                  label="Verification Status"
                  value={filters.verified}
                  onChange={(v) => onChangeFilter("verified", v)}
                  options={derivedOptions.verified}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#FFA800] px-6 py-3.5 text-sm font-semibold text-black shadow transition hover:brightness-95"
                >
                  Apply Filters &amp; Search
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full bg-[#EDEEEF] px-6 py-3.5 text-sm font-medium text-gray-800 shadow transition hover:bg-[#E6E7E8]"
                >
                  Reset Filters
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* RESULTS GRID — mobile shows 2 cards per row */}
      <section className="mx-auto w-full max-w-[1200px] px-3 sm:px-4 md:px-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Loading Profiles</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonGrid columnsMobile={2} />
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No profiles found.</p>
            {!error && (
              <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or search terms.</p>
            )}
          </div>
        ) : (
          <>
            <div
              className="
                grid
                grid-cols-2 gap-4
                sm:grid-cols-2 sm:gap-5
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
              "
            >
              {profiles.slice(0, visible).map((p) => (
                <div key={p.id} className="h-full">
                  <div className="h-full rounded-2xl border border-gray-100 bg-white p-1 shadow-sm transition hover:shadow-md">
                    <ProfileCard
                      profile={mapToProfileCard(p)}
                      ratingStats={ratingStats[p.id] as CardRatingStats}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              {visible < profiles.length ? (
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full bg-[#EDEEEF] px-5 py-2.5 text-sm font-medium text-gray-800 shadow transition hover:bg-[#E6E7E8]"
                >
                  Load More
                </button>
              ) : (
                <button
                  disabled
                  className="cursor-default rounded-full bg-[#F3F4F6] px-5 py-2.5 text-sm font-medium text-gray-400"
                >
                  No more results
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <WhyExpertVakeel />
      <Footer />
    </div>
  );
}

/* ------------------------------ Small Components ------------------------------ */

function SelectLike({
  label,
  value,
  onChange,
  options,
  disabled = false,
  searchable = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredOptions = searchable
    ? options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options;

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm("");
    setIsSearching(false);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsSearching(true);
    if (searchable) {
      // For searchable inputs, update the value as user types
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setIsSearching(false);
    onChange("");
    setIsOpen(false);
  };

  if (searchable) {
    // Show searchTerm while actively searching, otherwise show the selected value
    const displayValue = isSearching ? searchTerm : value;

    return (
      <div className="relative">
        <label className="relative block">
          <span className="sr-only">{label}</span>
          <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              if (!isSearching && value) {
                // When clicking on an input with existing value, prepare for search
                setSearchTerm("");
              }
            }}
            onBlur={() => setTimeout(() => {
              setIsOpen(false);
              setIsSearching(false);
            }, 200)}
            placeholder={disabled ? `${label} (Loading...)` : label}
            disabled={disabled}
            className={`w-full rounded-full border border-transparent bg-white px-5 py-4 pr-16 text-sm shadow-sm outline-none ring-1 ring-transparent focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed md:text-base ${value ? "text-green-700 font-medium" : "text-gray-900"
              }`}
          />
          {value && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''
              } ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
          />
        </label>

        {/* Dropdown */}
        {isOpen && !disabled && filteredOptions.length > 0 && (
          <div className="absolute top-full z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-xl last:rounded-b-xl transition-colors flex items-center justify-between ${value === option
                  ? "bg-green-50 text-green-700 font-medium"
                  : ""
                  }`}
              >
                <span>{option}</span>
                {value === option && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {isOpen && !disabled && searchTerm.trim() && filteredOptions.length === 0 && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
            No results found
          </div>
        )}
      </div>
    );
  }

  // Regular select for non-searchable fields
  const mergedOptions = value && value !== "" && !options.includes(value) ? [value, ...options] : options;

  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none rounded-full border border-transparent bg-white px-5 py-4 pr-12 text-sm shadow-sm outline-none ${disabled
          ? 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-60'
          : 'text-gray-800'
          }`}
      >
        <option value="">
          {disabled ? `${label} (Loading...)` : label}
        </option>
        {mergedOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${disabled ? 'text-gray-300' : 'text-gray-400'
          }`}
      />
    </label>
  );
}

function SkeletonGrid({ columnsMobile = 2 }: { columnsMobile?: number }) {
  const baseCols = columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div
      className={`
        ${baseCols}
        gap-4
        sm:grid-cols-2 sm:gap-5
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        grid
      `}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-200" />
          <div className="mt-4 h-4 w-2/3 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-5/6 rounded bg-gray-200" />
            <div className="h-3 w-3/5 rounded bg-gray-200" />
            <div className="h-3 w-4/5 rounded bg-gray-200" />
          </div>
          <div className="mt-4 h-8 w-32 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
