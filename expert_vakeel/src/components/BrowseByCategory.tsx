"use client";

import { useState, useEffect, useRef } from "react";
import { categoriesAPI, type Category, publicUserAPI } from "../services/api";
import { X, User, Phone, MapPin, ChevronDown, Search, ShieldCheck, RotateCcw, ArrowLeft, Loader, ArrowRight } from "lucide-react";
import api from "../services/api";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

// Default categories as fallback if none exist in the database
const defaultCategories: Omit<Category, 'id' | 'order' | 'createdAt' | 'updatedAt'>[] = [
  { title: "Family Matters", subtitle: "Divorce, Custody, Heritage", image: "/assets/image1.png", isActive: true },
  { title: "Criminal Matters", subtitle: "Bail, Defense, Investigation", image: "/assets/image2.png", isActive: true },
  { title: "Labour Matters", subtitle: "Employment, Wages, Disputes", image: "/assets/image3.png", isActive: true },
  { title: "Taxation Matters", subtitle: "GST, IT, Corporate Tax", image: "/assets/images4.png", isActive: true },
  { title: "Business Matters", subtitle: "Startup, Compliance, Mergers", image: "/assets/images5.png", isActive: true },
  { title: "Civil Matters", subtitle: "Property, Contracts, Disputes", image: "/assets/image6.png", isActive: true },
  { title: "Trademark & IP", subtitle: "Copyright, Patents, Brands", image: "/assets/image7.png", isActive: true },
  { title: "Documentation", subtitle: "Agreements, Deeds, Registration", image: "/assets/image8.png", isActive: true },
  { title: "High Court", subtitle: "Appeals, Writ Petitions", image: "/assets/image9.png", isActive: true },
  { title: "Supreme Court", subtitle: "Special Leave Petitions", image: "/assets/image10.png", isActive: true },
  { title: "Forums & Tribunal", subtitle: "NCLT, DRT, Consumer Court", image: "/assets/image11.png", isActive: true },
];

const titleColors = [
  "text-rose-500",
  "text-blue-500",
  "text-amber-500",
  "text-indigo-500",
  "text-emerald-500",
  "text-pink-500",
  "text-cyan-500",
  "text-teal-500",
  "text-orange-500",
  "text-lime-500",
  "text-fuchsia-500",
];

const bgGradients = [
  "from-rose-500/10",
  "from-blue-500/10",
  "from-amber-500/10",
  "from-indigo-500/10",
  "from-emerald-500/10",
  "from-pink-500/10",
  "from-cyan-500/10",
  "from-teal-500/10",
  "from-orange-500/10",
  "from-lime-500/10",
  "from-fuchsia-500/10",
];

type CategoryDisplay = {
  title: string;
  subtitle: string;
  image: string;
};

function CategoryCard({
  title,
  subtitle,
  image,
  colorIndex,
  onExplore,
}: CategoryDisplay & { colorIndex: number; onExplore: (category: string) => void }) {
  const titleColor = titleColors[colorIndex % titleColors.length];
  const bgGradient = bgGradients[colorIndex % bgGradients.length];

  return (
    <div
      onClick={() => onExplore(title)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-[#FFA800]/20"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/placeholder.png";
          }}
        />
        {/* Color Overlay Hint */}
        <div className={`absolute inset-0 bg-gradient-to-t ${bgGradient} to-transparent opacity-60`} />
      </div>

      {/* Content Area */}
      <div className="relative p-4 sm:p-6 bg-white">
        <div className="flex flex-col gap-1">
          <h3 className={`text-sm sm:text-lg font-bold leading-tight ${titleColor}`}>
            {title}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium line-clamp-1 uppercase tracking-wider">
            {subtitle}
          </p>
        </div>

        {/* Action Button - Subtle and Premium */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold bg-[#FFA800] text-white sm:bg-transparent sm:text-[#FFA800] opacity-100 sm:opacity-0 transition-all duration-300 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 px-3 py-1.5 rounded-full sm:rounded-none sm:px-0 sm:py-0 -translate-x-2">
            View Experts
          </span>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all duration-300 sm:group-hover:bg-[#FFA800] sm:group-hover:text-white sm:group-hover:rotate-[-45deg] hover:bg-amber-700 hover:text-white">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Glow on Hover */}
      <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-transparent via-transparent to-[#FFA800]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}

export default function BrowseByCategoryPage({
  onCategoryClick,
}: {
  onCategoryClick?: (category: string) => void;
}) {
  const [categories, setCategories] = useState<CategoryDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Auth/OTP Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
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
    const loadData = async () => {
      try {
        setLoading(true);
        const [catResp, citiesResp] = await Promise.all([
          categoriesAPI.getAll({ isActive: true }),
          publicUserAPI.getAll({ limit: "1000" }).catch(() => null)
        ]);

        const apiCategories = catResp.data.data || [];
        if (apiCategories.length > 0) {
          setCategories(apiCategories.map(c => ({
            title: c.title,
            subtitle: c.subtitle,
            image: c.image,
          })));
        } else {
          setCategories(defaultCategories.map(c => ({
            title: c.title,
            subtitle: c.subtitle,
            image: c.image,
          })));
        }

        if (citiesResp?.data?.data && Array.isArray(citiesResp.data.data)) {
          const citiesSet = new Set<string>();
          citiesResp.data.data.forEach((u: any) => u.city && citiesSet.add(u.city.trim()));
          const finalCities = Array.from(citiesSet).sort();
          if (finalCities.length > 0) setCities(finalCities);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategories(defaultCategories.map(c => ({
          title: c.title,
          subtitle: c.subtitle,
          image: c.image,
        })));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleExplore = (category: string) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (onCategoryClick) onCategoryClick(category);
    } else {
      setPendingCategory(category);
      setShowAuthModal(true);
      setAuthStep(1);
      setAuthError(null);
    }
  };

  const clearAuthModal = () => {
    setShowAuthModal(false);
    setPendingCategory(null);
    setAuthStep(1);
    setOtp("");
    setAuthError(null);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formCity) { setAuthError("Please fill all fields"); return; }
    if (!/^[0-9]{10}$/.test(formPhone)) { setAuthError("Enter a valid 10-digit mobile number"); return; }

    setAuthLoading(true);
    setAuthError(null);

    try {
      await api.post("/api/verify/generate-otp", {
        name: formName, city: formCity, phoneNumber: formPhone,
      });

      if (typeof window.sendOtp === "function") {
        window.sendOtp(
          "91" + formPhone,
          () => {
            setAuthStep(2);
            setAuthLoading(false);
          },
          (err) => {
            setAuthError(err?.message || "MSG91 failed to send OTP.");
            setAuthLoading(false);
          }
        );
      } else {
        setAuthError("OTP Service is not ready.");
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
      window.verifyOtp(otp,
        async (data) => {
          try {
            const tokenValue = typeof data === 'string' ? data : data?.message;
            const response = await api.post("/api/verify/verify-msg91-token", {
              token: tokenValue,
              phoneNumber: formPhone,
              name: formName,
              city: formCity
            });

            if (response.data.success) {
              const { token, client, firebaseToken } = response.data;
              localStorage.setItem("token", token);
              localStorage.setItem("client", JSON.stringify(client));
              if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);

              if (pendingCategory && onCategoryClick) onCategoryClick(pendingCategory);
              clearAuthModal();
            } else {
              throw new Error(response.data.message || "Verification failed");
            }
          } catch (err: any) {
            setAuthError(err.response?.data?.message || err.message || "Login failed");
            setAuthLoading(false);
          }
        },
        () => {
          setAuthError("Invalid OTP.");
          setAuthLoading(false);
        }
      );
    }
  };

  const handleResendOTP = () => {
    setResending(true);
    setAuthError(null);
    if (typeof window.retryOtp === "function") {
      window.retryOtp(
        null,
        () => setResending(false),
        (err) => { setAuthError(err?.message || "Failed to resend."); setResending(false); }
      );
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16 lg:py-24">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFA800]" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-2 pb-8 sm:py-12 lg:py-16">
      {/* Modern Centered Header */}
      <div className="mb-6 sm:mb-16 text-center">
        <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFA800]">
          Diverse Legal Expertise
        </span>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Browse By <span className="text-[#FFA800]">Category</span>
        </h2>
        <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#FFA800] to-orange-300 sm:mt-6" />
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <CategoryCard
            key={c.title}
            title={c.title}
            subtitle={c.subtitle}
            image={c.image}
            colorIndex={i}
            onExplore={handleExplore}
          />
        ))}
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-left">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={clearAuthModal} />

          <div className="relative w-full max-w-[420px] bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={clearAuthModal} className="absolute right-6 top-6 z-10 p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="px-6 pt-12 pb-12">
              <div className="text-center mb-10">
                <h1 className="text-[28px] font-black text-gray-900 leading-tight">Verify Identity</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {authStep === 1 ? "Verify to continue accessing experts" : `Enter the OTP sent to +91 ${formPhone}`}
                </p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
                  <p className="font-semibold">{authError}</p>
                </div>
              )}

              {authStep === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800]" strokeWidth={2.5} />
                    <input type="text" placeholder="Full Name" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5" required />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800]" strokeWidth={2.5} />
                    <input type="tel" placeholder="Mobile Number" value={formPhone} onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full h-14 pl-12 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5" required />
                  </div>
                  <div className="relative" ref={cityDropdownRef}>
                    <button type="button" onClick={() => setCityDropdownOpen(!cityDropdownOpen)} className="w-full h-14 pl-4 pr-10 bg-[#F6F6F6] rounded-[24px] text-left flex items-center justify-between outline-none transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                        <span className={`text-[16px] font-bold ${formCity ? "text-gray-800" : "text-gray-400"}`}>{formCity || "Select City"}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {cityDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-gray-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search city..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-[14px] text-sm border-none outline-none focus:ring-2 focus:ring-[#FFA800]/20" autoFocus />
                          </div>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {filteredCities.map(c => (
                            <button key={c} type="button" onClick={() => { setFormCity(c); setCityDropdownOpen(false); }} className={`w-full px-5 py-3 text-left text-sm font-bold transition-colors hover:bg-orange-50 ${formCity === c ? "text-[#FFA800] bg-orange-50/50" : "text-gray-700"}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={authLoading} className="w-full h-14 bg-[#FFA800] text-white rounded-[24px] text-[18px] font-black shadow-[0_10px_30px_rgba(255,168,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                    {authLoading ? <Loader className="w-6 h-6 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="0 0 0 0 0 0" className="w-full h-20 text-center bg-[#F6F6F6] rounded-[24px] outline-none text-[32px] font-black tracking-[0.4em] transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white placeholder:tracking-normal placeholder:text-gray-200" autoFocus />
                  <button onClick={handleVerifyOTP} disabled={authLoading || otp.length < 4} className="w-full h-14 bg-gray-900 text-white rounded-[24px] text-[18px] font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                    {authLoading ? <Loader className="w-6 h-6 animate-spin" /> : "Verify Identity"}
                  </button>
                  <div className="flex items-center justify-between">
                    <button onClick={() => { setAuthStep(1); setOtp(""); setAuthError(null); }} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-2">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button onClick={handleResendOTP} disabled={resending} className="text-xs font-black text-[#FFA800] uppercase tracking-widest hover:text-orange-600 flex items-center gap-2 disabled:opacity-50">
                      {resending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}