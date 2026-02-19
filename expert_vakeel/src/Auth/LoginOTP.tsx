import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { publicUserAPI } from "../services/api";
import {
    Phone,
    User as UserIcon,
    MapPin,
    ChevronDown,
    Search as SearchIcon,
    ShieldCheck,
    Loader,
    ArrowRight,
    ArrowLeft,
    RotateCcw,
} from "lucide-react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";

// MSG91 Custom UI methods (exposed when exposeMethods: true)
declare global {
    interface Window {
        sendOtp: (id: string, success?: (d: any) => void, failure?: (e: any) => void) => void;
        verifyOtp: (otp: string | number, success?: (d: any) => void, failure?: (e: any) => void) => void;
        retryOtp: (ch: string | null, success?: (d: any) => void, failure?: (e: any) => void) => void;
    }
}

const CITY_OPTIONS = [
    "New Delhi", "Mumbai", "Pune", "Noida", "Gurugram", "Chennai", "Kolkata", "Chandigarh", "Bengaluru", "Hyderabad"
];

// Verification mode: msg91widget uses window.verifyOtp, backend uses stored test OTP
type VerifyMode = "msg91widget" | "backend";

export default function LoginOTP() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [otp, setOtp] = useState("");

    // Backend session (used as fallback if MSG91 widget OTP not received)
    const [verificationId, setVerificationId] = useState("");
    const [verifyMode, setVerifyMode] = useState<VerifyMode>("msg91widget");

    const [cities, setCities] = useState<string[]>(CITY_OPTIONS);
    const [citySearch, setCitySearch] = useState("");
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await publicUserAPI.getAll({ limit: "1000" });
                if (response.data && Array.isArray(response.data.data)) {
                    const citiesSet = new Set<string>();
                    response.data.data.forEach((u: any) => u.city && citiesSet.add(u.city.trim()));
                    const finalCities = Array.from(citiesSet).sort();
                    if (finalCities.length > 0) setCities(finalCities);
                }
            } catch { /* silently fail */ }
        };
        fetchCities();
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

    // ─── Log user in via backend login-after-verify ───────────────────
    const loginAfterVerify = async () => {
        const response = await api.post("/api/verify/login-after-verify", {
            verificationId,
            phoneNumber: phone,
        });
        if (response.data.success) {
            const { token, client, firebaseToken } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("client", JSON.stringify(client));
            if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);
            navigate(redirect, { replace: true });
        } else {
            throw new Error(response.data.message || "Login failed");
        }
    };

    // ─── STEP 1: Send OTP ──────────────────────────────────────────────
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !city) { setError("Please fill all fields"); return; }
        if (!/^[0-9]{10}$/.test(phone)) { setError("Enter a valid 10-digit mobile number"); return; }

        setLoading(true);
        setError(null);

        // Always call backend first to store session + generate fallback test OTP
        try {
            const resp = await api.post("/api/verify/generate-otp", {
                name, city, phoneNumber: phone,
            });
            if (resp.data.verificationId) setVerificationId(resp.data.verificationId);
        } catch (err) {
            console.error("Backend generate-otp error:", err);
        }

        // Try MSG91 widget
        if (typeof window.sendOtp === "function") {
            window.sendOtp(
                "91" + phone,
                () => {
                    // MSG91 OTP sent successfully
                    setVerifyMode("msg91widget");
                    setStep(2);
                    setLoading(false);
                },
                (err) => {
                    console.error("MSG91 sendOtp error:", err);
                    setError(err?.message || "MSG91 failed to send OTP. Please check your number or try again.");
                    setLoading(false);
                }
            );
        } else {
            setError("OTP Service (MSG91) is not ready. Please refresh the page.");
            setLoading(false);
        }
    };

    // ─── STEP 2: Verify OTP ────────────────────────────────────────────
    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 4) { setError("Enter the OTP you received"); return; }
        setLoading(true);
        setError(null);

        // Logic check: If using widget, it has its own verification. 
        // We just need our backend to finalize the login session.
        if (verifyMode === "msg91widget" && typeof window.verifyOtp === "function") {
            window.verifyOtp(otp,
                async (data) => {
                    try {
                        const tokenValue = typeof data === 'string' ? data : data?.message;
                        const response = await api.post("/api/verify/verify-msg91-token", {
                            token: tokenValue,
                            phoneNumber: phone,
                        });

                        if (response.data.success) {
                            const { token, client, firebaseToken } = response.data;
                            localStorage.setItem("token", token);
                            localStorage.setItem("client", JSON.stringify(client));
                            if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);
                            navigate(redirect, { replace: true });
                        } else {
                            throw new Error(response.data.message || "Verification failed");
                        }
                    } catch (err: any) {
                        setError(err.response?.data?.message || err.message || "Login failed");
                        setLoading(false);
                    }
                },
                () => {
                    setError("Invalid OTP. Please check the code sent to your phone.");
                    setLoading(false);
                }
            );
        } else {
            // Backend-only mode (if SDK failed to load)
            try {
                await loginAfterVerify();
            } catch (err: any) {
                setError(err.response?.data?.message || "Verification failed");
                setLoading(false);
            }
        }
    };

    // ─── Resend OTP ────────────────────────────────────────────────────
    const handleResendOTP = () => {
        setResending(true);
        setError(null);
        if (typeof window.retryOtp === "function") {
            window.retryOtp(
                null,
                () => setResending(false),
                (err) => { setError(err?.message || "Failed to resend OTP."); setResending(false); }
            );
        } else {
            // Backend fallback resend
            api.post("/api/verify/generate-otp", { name, city, phoneNumber: phone })
                .then((resp) => {
                    if (resp.data.verificationId) setVerificationId(resp.data.verificationId);
                    setResending(false);
                })
                .catch(() => {
                    setError("Failed to resend OTP.");
                    setResending(false);
                });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            <main className="w-full max-w-[420px] bg-white rounded-[32px] overflow-hidden">
                <div className="text-center px-6 pt-10 pb-6">
                    <img src="/assets/logo_horizontal.png" alt="Expert Vakeel" className="mx-auto mb-6 h-16 w-auto select-none" />
                    <h1 className="text-[32px] font-black text-gray-900 leading-tight">
                        {step === 1 ? "Welcome Back" : "Verify Account"}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                        {step === 1
                            ? "Login / Sign up with your mobile number"
                            : `Enter the OTP sent to +91 ${phone}`}
                    </p>
                </div>

                <div className="px-6 pb-12">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            {/* Name */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors">
                                    <UserIcon strokeWidth={2.5} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                                />
                            </div>

                            {/* Phone */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors">
                                    <Phone strokeWidth={2.5} />
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Mobile Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    className="w-full h-14 pl-12 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                                />
                            </div>

                            {/* City */}
                            <div className="relative" ref={cityDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                                    className="w-full h-14 pl-4 pr-10 bg-[#F6F6F6] rounded-[24px] text-left flex items-center justify-between outline-none transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                                        <span className={`text-[16px] font-bold ${city ? "text-gray-800" : "text-gray-400"}`}>
                                            {city || "Select City"}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {cityDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 border-b border-gray-50">
                                            <div className="relative">
                                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                                    onClick={() => { setCity(c); setCityDropdownOpen(false); }}
                                                    className={`w-full px-5 py-3 text-left text-sm font-bold transition-colors hover:bg-orange-50 ${city === c ? "text-[#FFA800] bg-orange-50/50" : "text-gray-700"}`}
                                                >{c}</button>
                                            ))}
                                            {filteredCities.length === 0 && (
                                                <div className="px-5 py-4 text-xs font-bold text-gray-400 text-center">No city found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full h-14 bg-[#FFA800] text-white rounded-[24px] text-[18px] font-black shadow-[0_10px_30px_rgba(255,168,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader className="w-6 h-6 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
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
                            />

                            <button onClick={handleVerifyOTP} disabled={loading || otp.length < 4}
                                className="w-full h-14 bg-gray-900 text-white rounded-[24px] text-[18px] font-black shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Verify Identity"}
                            </button>

                            <div className="flex items-center justify-between">
                                <button onClick={() => { setStep(1); setOtp(""); setError(null); }}
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

                    <div className="mt-10 text-center">
                        <p className="text-[11px] text-gray-400 font-bold leading-relaxed px-4">
                            By continuing, you agree to our <Link to="/privacypolicy" className="text-gray-700 underline">Privacy Policy</Link> and <Link to="/terms" className="text-gray-700 underline">Terms of Use</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
