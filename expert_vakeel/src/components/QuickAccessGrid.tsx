import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import api, { serviceAPI, type Service, publicUserAPI } from "../services/api";
import { LayoutGrid, X, User, Phone, MapPin, ChevronDown, Search, ShieldCheck, RotateCcw, ArrowLeft, Loader, ArrowRight } from "lucide-react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function QuickAccessGrid() {
    const [services, setServices] = useState<Service[]>([]);
    const navigate = useNavigate();

    // Auth/OTP Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [targetPath, setTargetPath] = useState<string | null>(null);
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
                const [servicesResp, citiesResp] = await Promise.all([
                    serviceAPI.getAll(),
                    publicUserAPI.getAll({ limit: "1000" }).catch(() => null)
                ]);

                if (servicesResp.data.success) {
                    setServices(servicesResp.data.data);
                }

                if (citiesResp?.data?.data && Array.isArray(citiesResp.data.data)) {
                    const citiesSet = new Set<string>();
                    citiesResp.data.data.forEach((u: any) => u.city && citiesSet.add(u.city.trim()));
                    const finalCities = Array.from(citiesSet).sort();
                    if (finalCities.length > 0) setCities(finalCities);
                }
            } catch (err) {
                console.error("Error loading data for grid:", err);
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

    const findService = useCallback((label: string) => {
        return services.find(s =>
            s.name.toLowerCase().trim() === label.toLowerCase().trim()
        );
    }, [services]);

    const generateSlug = (name: string) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug === 'traffic-challan' ? 'challan' : slug;
    };

    const getPath = (item: { label: string, path: string }) => {
        if (item.label === "More Services") return "/services";
        const service = findService(item.label);
        if (service) return `/service/${generateSlug(service.name)}`;
        return item.path;
    };

    const handleItemClick = (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        const path = getPath(item);
        navigate(path);
    };

    const clearAuthModal = () => {
        setShowAuthModal(false);
        setTargetPath(null);
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
                        console.error("MSG91 sendOtp error:", err);
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

                            if (targetPath) navigate(targetPath);
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

    const items = [
        { label: "Legal Matters", localIcon: "/assets/services_logo/p11.png", path: "/services" },
        { label: "Marriage Registration", localIcon: "/assets/services_logo/p1.png", path: "/services" },
        { label: "Civil Disputes", localIcon: "/assets/services_logo/p2.png", path: "/services" },
        { label: "Business & Contracts", localIcon: "/assets/services_logo/p3.png", path: "/services" },
        { label: "Domestic Violence", localIcon: "/assets/services_logo/p5.png", path: "/services" },
        { label: "Consumer Complaints", localIcon: "/assets/services_logo/p4.png", path: "/services" },
        { label: "Traffic Challan", localIcon: "/assets/services_logo/p6.png", path: "/challan-status" },
        { label: "Cheque Bounce", localIcon: "/assets/services_logo/p7.png", path: "/services" },
        { label: "Property / Land Disputes", localIcon: "/assets/services_logo/p10.png", path: "/services" },
        { label: "Criminal / Bail / FIR", localIcon: "/assets/services_logo/p8.png", path: "/services" },
        { label: "Divorce & Family Matters", localIcon: "/assets/services_logo/p9.png", path: "/services" },
        { label: "More Services", localIcon: "", path: "/services" },
    ];

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-4">
            <div className="grid grid-cols-4 gap-y-12 gap-x-4 sm:gap-x-12 sm:gap-y-16">
                {items.map((item, idx) => {
                    const service = findService(item.label);
                    const iconUrl = service?.image || item.localIcon;
                    return (
                        <div
                            key={idx}
                            onClick={(e) => handleItemClick(e, item)}
                            className="group relative flex cursor-pointer flex-col items-center text-center transition-all"
                        >
                            {/* ICON BOX */}
                            <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#F8F9FA] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group-hover:rotate-[6deg] group-hover:scale-110 group-hover:shadow-[0_20px_40px_-12px_rgba(255,168,0,0.2)] group-hover:bg-white sm:h-28 sm:w-28 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFA800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                {item.label === "More Services" ? (
                                    <div className="relative z-10 p-4 rounded-2xl bg-gray-50 group-hover:bg-[#FFA800]/10 transition-colors">
                                        <LayoutGrid className="h-8 w-8 text-[#1a365d] transition-transform duration-500 group-hover:scale-110 sm:h-12 sm:w-12 group-hover:text-[#FFA800]" />
                                    </div>
                                ) : (
                                    <img
                                        src={iconUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`}
                                        alt={item.label}
                                        className="relative z-10 h-12 w-12 sm:h-16 sm:w-16 object-contain transition-all duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`;
                                        }}
                                    />
                                )}
                                <div className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#FFA800] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* TITLE */}
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-[#1a365d] leading-snug sm:text-[15px] max-w-[90px] sm:max-w-none transition-all duration-300 group-hover:text-[#FFA800] group-hover:translate-y-[-2px]">
                                    {item.label}
                                </span>
                                <div className="mt-1.5 h-0.5 w-0 bg-[#FFA800] rounded-full transition-all duration-300 group-hover:w-8" />
                            </div>
                        </div>
                    );
                })}
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
                                    {authStep === 1 ? "Verify to continue accessing this service" : `Enter the OTP sent to +91 ${formPhone}`}
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
        </div>
    );
}
