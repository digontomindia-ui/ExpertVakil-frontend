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
import {
  X, User, Phone, MapPin, ChevronDown, Search, ShieldCheck,
  RotateCcw, ArrowLeft, Loader, ArrowRight
} from "lucide-react";
import api, { publicUserAPI } from "../services/api";
import { useEffect, useRef } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";

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

  // Auth/OTP Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [cities, setCities] = useState<string[]>(["New Delhi", "Mumbai", "Pune", "Noida", "Gurugram", "Chennai", "Kolkata", "Chandigarh", "Bengaluru", "Hyderabad"]);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAuthModal) return;
    const fetchCities = async () => {
      try {
        const resp = await publicUserAPI.getAll({ limit: "100" }).catch(() => null);
        if (resp?.data?.data && Array.isArray(resp.data.data)) {
          const citiesSet = new Set<string>();
          resp.data.data.forEach((u: any) => u.city && citiesSet.add(u.city.trim()));
          if (citiesSet.size > 0) setCities(Array.from(citiesSet).sort());
        }
      } catch (err) { console.error(err); }
    };
    fetchCities();
  }, [showAuthModal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node))
        setCityDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = cities.filter(c =>
    !citySearch.trim() || new RegExp(citySearch.trim(), "i").test(c)
  );

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

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profileview?id=${id}`);
  };

  const clearAuthModal = () => {
    setShowAuthModal(false);
    setAuthStep(1);
    setOtp("");
    setAuthError(null);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formCity) { setAuthError("Please fill all fields"); return; }
    setAuthLoading(true);
    setAuthError(null);

    try {
      await api.post("/api/verify/generate-otp", {
        name: formName, city: formCity, phoneNumber: formPhone,
      });

      if (typeof window.sendOtp === "function") {
        window.sendOtp("91" + formPhone,
          () => { setAuthStep(2); setAuthLoading(false); },
          (err) => { setAuthError(err?.message || "Failed to send OTP."); setAuthLoading(false); }
        );
      } else {
        setAuthError("OTP Service not ready.");
        setAuthLoading(false);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || "Failed to initiate login");
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) { setAuthError("Enter OTP"); return; }
    setAuthLoading(true);
    setAuthError(null);

    if (typeof window.verifyOtp === "function") {
      window.verifyOtp(otp, async (data) => {
        try {
          const tokenValue = typeof data === 'string' ? data : data?.message;
          const response = await api.post("/api/verify/verify-msg91-token", {
            token: tokenValue, phoneNumber: formPhone, name: formName, city: formCity
          });

          if (response.data.success) {
            const { token, client, firebaseToken } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("client", JSON.stringify(client));
            if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);

            navigate(`/profileview?id=${id}`);
            clearAuthModal();
          } else {
            throw new Error(response.data.message || "Verification failed");
          }
        } catch (err: any) {
          setAuthError(err.response?.data?.message || err.message || "Login failed");
          setAuthLoading(false);
        }
      }, () => {
        setAuthError("Invalid OTP.");
        setAuthLoading(false);
      });
    }
  };

  const handleResendOTP = () => {
    setResending(true); setAuthError(null);
    if (typeof window.retryOtp === "function") {
      window.retryOtp(null, () => setResending(false), (err) => { setAuthError(err?.message); setResending(false); });
    }
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
      onClick={(e) => handleProfileClick(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleProfileClick(e as any); }}
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
          onClick={(e) => handleProfileClick(e)}
          className="flex-1 rounded-xl bg-[#FFA800] py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-lg shadow-[#FFA800]/20 hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wide"
        >
          View Profile
        </button>
        <button
          onClick={(e) => handleProfileClick(e)}
          className="flex-1 rounded-xl bg-[#0f172a] py-2.5 text-[9px] sm:text-[11px] font-bold text-white uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all"
        >
          {pill}
        </button>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-left" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={clearAuthModal} />

          <div className="relative w-full max-w-[400px] bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={clearAuthModal} className="absolute right-6 top-6 z-10 p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="px-6 pt-12 pb-12">
              <div className="text-center mb-10">
                <h1 className="text-[24px] font-black text-gray-900 leading-tight">Verify Identity</h1>
                <p className="mt-2 text-xs font-medium text-gray-500">
                  {authStep === 1 ? "Verify to view expert profile details" : `Enter the OTP sent to +91 ${formPhone}`}
                </p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-[11px]">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
                  <p className="font-semibold">{authError}</p>
                </div>
              )}

              {authStep === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FFA800]" />
                    <input type="text" placeholder="Full Name" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-[#F6F6F6] rounded-[20px] outline-none text-sm font-bold text-gray-800 border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5" required />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FFA800]" />
                    <input type="tel" placeholder="Mobile Number" value={formPhone} onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full h-12 pl-12 pr-4 bg-[#F6F6F6] rounded-[20px] outline-none text-sm font-bold text-gray-800 border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5" required />
                  </div>
                  <div className="relative" ref={cityDropdownRef}>
                    <button type="button" onClick={() => setCityDropdownOpen(!cityDropdownOpen)} className="w-full h-12 pl-4 pr-10 bg-[#F6F6F6] rounded-[20px] text-left flex items-center justify-between outline-none border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm font-bold ${formCity ? "text-gray-800" : "text-gray-400"}`}>{formCity || "Select City"}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {cityDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-gray-50">
                          <input type="text" placeholder="Search city..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full px-3 py-1.5 bg-gray-50 rounded-[12px] text-xs border-none outline-none" autoFocus />
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {filteredCities.map(c => (
                            <button key={c} type="button" onClick={() => { setFormCity(c); setCityDropdownOpen(false); }} className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-orange-50 ${formCity === c ? "text-[#FFA800]" : "text-gray-700"}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={authLoading} className="w-full h-12 bg-[#FFA800] text-white rounded-[20px] text-sm font-black shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                    {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="0 0 0 0 0 0" className="w-full h-16 text-center bg-[#F6F6F6] rounded-[20px] outline-none text-[28px] font-black tracking-[0.4em] transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white placeholder:tracking-normal placeholder:text-gray-200" autoFocus />
                  <button onClick={handleVerifyOTP} disabled={authLoading || otp.length < 4} className="w-full h-12 bg-gray-900 text-white rounded-[20px] text-sm font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                    {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                  </button>
                  <div className="flex items-center justify-between">
                    <button onClick={() => { setAuthStep(1); setOtp(""); setAuthError(null); }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-1.5">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <button onClick={handleResendOTP} disabled={resending} className="text-[10px] font-black text-[#FFA800] uppercase tracking-widest hover:text-orange-600 flex items-center gap-1.5 disabled:opacity-50">
                      {resending ? <Loader className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
