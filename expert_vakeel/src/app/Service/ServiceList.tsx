import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { serviceAPI, type Service, publicUserAPI } from "../../services/api";
import { Loader, ArrowRight, X, User, Phone, MapPin, ChevronDown, Search, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function ServiceList() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Auth/OTP Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [resending, setResending] = useState(false);
  const [cities, setCities] = useState<string[]>(["New Delhi", "Mumbai", "Pune", "Noida", "Gurugram", "Chennai", "Kolkata", "Chandigarh", "Bengaluru", "Hyderabad"]);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load services and cities in parallel
        const [servicesResp, citiesResp] = await Promise.all([
          serviceAPI.getAll(),
          publicUserAPI.getAll({ limit: "1000" }).catch(() => null)
        ]);

        if (servicesResp.data.success && servicesResp.data.data) {
          setServices(servicesResp.data.data);
        } else {
          throw new Error("Failed to load services");
        }

        if (citiesResp?.data?.data && Array.isArray(citiesResp.data.data)) {
          const citiesSet = new Set<string>();
          citiesResp.data.data.forEach((u: any) => u.city && citiesSet.add(u.city.trim()));
          const finalCities = Array.from(citiesSet).sort();
          if (finalCities.length > 0) setCities(finalCities);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Unable to load services. Please try again later.");
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

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const query = searchQuery.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.categories.some((cat) => cat.toLowerCase().includes(query)),
    );
  }, [services, searchQuery]);

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  const clearAuthModal = () => {
    setShowAuthModal(false);
    setSelectedServiceId(null);
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
      // 1. Backend generate-otp
      const resp = await api.post("/api/verify/generate-otp", {
        name: formName, city: formCity, phoneNumber: formPhone,
      });
      if (resp.data.verificationId) setVerificationId(resp.data.verificationId);

      // 2. MSG91 widget
      if (typeof window.sendOtp === "function") {
        window.sendOtp(
          "91" + formPhone,
          () => {
            setAuthStep(2);
            setAuthLoading(false);
          },
          (err) => {
            console.error("MSG91 sendOtp error:", err);
            setAuthError(err?.message || "MSG91 failed to send OTP.");
            setAuthLoading(false);
          }
        );
      } else {
        setAuthError("OTP Service is not ready. Please try again.");
        setAuthLoading(false);
      }
    } catch (err: any) {
      console.error("Login send error:", err);
      setAuthError(err.response?.data?.message || "Failed to initiate login");
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) { setAuthError("Enter the OTP you received"); return; }
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

              // Proceed to service
              navigate(`/service/${selectedServiceId}`, { replace: true });
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
          setAuthError("Invalid OTP. Please check the code.");
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

  // Helper function to get image URL - use service.image if available, otherwise fallback to default
  const getServiceImage = useCallback((service: Service, index: number): string => {
    // If image already failed, use fallback directly
    if (service.image && failedImages.has(service.id)) {
      return `/assets/services_logo/p${(index % 10) + 1}.png`;
    }
    if (service.image && service.image.trim()) {
      return service.image;
    }
    // Fallback to default images based on index (mod 10 to cycle through available images)
    return `/assets/services_logo/p${(index % 10) + 1}.png`;
  }, [failedImages]);

  // Handle image error - mark as failed and don't retry
  const handleImageError = useCallback((serviceId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    // Prevent infinite loop by only handling error once per service
    if (!failedImages.has(serviceId)) {
      setFailedImages(prev => new Set([...prev, serviceId]));
    }
    // Hide the broken image
    (e.target as HTMLImageElement).style.display = 'none';
  }, [failedImages]);

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
            <Loader className="relative inline-block animate-spin h-10 w-10 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            Finding the best services for you...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Something went wrong
          </h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-white py-6 sm:py-10">
      <div className="mx-auto max-w-screen-xl px-4">
        {filteredServices.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-8 w-8 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No services found
            </h3>
            <p className="mt-2 text-gray-500">
              We couldn't find any services matching "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-y-12 gap-x-3 sm:gap-x-8 sm:gap-y-16">
            {filteredServices.map((service, index) => {
              const logoPath = getServiceImage(service, index);

              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  className="group flex cursor-pointer flex-col items-center text-center transition-all"
                >
                  {/* ICON BOX */}
                  <div
                    className="
                      relative mb-4
                      flex h-16 w-16 items-center justify-center
                      rounded-3xl bg-[#F4F6F8]
                      shadow-sm
                      transition-all duration-300
                      group-hover:translate-y-[-5px]
                      group-hover:shadow-md
                      group-hover:bg-white
                      sm:h-24 sm:w-24
                    "
                  >
                    <img
                      src={logoPath}
                      alt={service.name}
                      className="h-10 w-10 object-contain transition-transform duration-500 group-hover:scale-110 sm:h-14 sm:w-14"
                      onError={(e) => handleImageError(service.id, e)}
                    />
                  </div>

                  {/* TITLE */}
                  <h3
                    className="
                      text-[12px] font-bold text-[#444]
                      leading-[1.3] sm:text-[14px]
                      max-w-[100px] sm:max-w-[140px]
                      transition-colors group-hover:text-[#FFA800]
                    "
                  >
                    {service.name}
                  </h3>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-left">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={clearAuthModal} />

          <div className="relative w-full max-w-[420px] bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={clearAuthModal}
              className="absolute right-6 top-6 z-10 p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="px-6 pt-12 pb-12">
              <div className="text-center mb-10">
                <h1 className="text-[28px] font-black text-gray-900 leading-tight">
                  {authStep === 1 ? "Verify Your Phone" : "Verify Account"}
                </h1>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {authStep === 1
                    ? "Verify to continue accessing this service"
                    : `Enter the OTP sent to +91 ${formPhone}`}
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
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-all" strokeWidth={2.5} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-all" strokeWidth={2.5} />
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full h-14 pl-12 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                      required
                    />
                  </div>

                  <div className="relative" ref={cityDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                      className="w-full h-14 pl-4 pr-10 bg-[#F6F6F6] rounded-[24px] text-left flex items-center justify-between outline-none transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                        <span className={`text-[16px] font-bold ${formCity ? "text-gray-800" : "text-gray-400"}`}>
                          {formCity || "Select City"}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {cityDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-gray-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search city..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-[14px] text-sm border-none outline-none focus:ring-2 focus:ring-[#FFA800]/20"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {filteredCities.map(c => (
                            <button key={c} type="button"
                              onClick={() => { setFormCity(c); setCityDropdownOpen(false); }}
                              className={`w-full px-5 py-3 text-left text-sm font-bold transition-colors hover:bg-orange-50 ${formCity === c ? "text-[#FFA800] bg-orange-50/50" : "text-gray-700"}`}
                            >{c}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={authLoading}
                    className="w-full h-14 bg-[#FFA800] text-white rounded-[24px] text-[18px] font-black shadow-[0_10px_30px_rgba(255,168,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {authLoading ? <Loader className="w-6 h-6 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full h-20 text-center bg-[#F6F6F6] rounded-[24px] outline-none text-[32px] font-black tracking-[0.4em] transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white placeholder:tracking-normal placeholder:text-gray-200"
                    autoFocus
                  />

                  <button onClick={handleVerifyOTP} disabled={authLoading || otp.length < 4}
                    className="w-full h-14 bg-gray-900 text-white rounded-[24px] text-[18px] font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {authLoading ? <Loader className="w-6 h-6 animate-spin" /> : "Verify Identity"}
                  </button>

                  <div className="flex items-center justify-between">
                    <button onClick={() => { setAuthStep(1); setOtp(""); setAuthError(null); }}
                      className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button onClick={handleResendOTP} disabled={resending}
                      className="text-xs font-black text-[#FFA800] uppercase tracking-widest hover:text-orange-600 flex items-center gap-2 disabled:opacity-50"
                    >
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
    </div>
  );
}


