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
    ArrowLeft
} from "lucide-react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";

const CITY_OPTIONS = [
    "New Delhi", "Mumbai", "Pune", "Noida", "Gurugram", "Chennai", "Kolkata", "Chandigarh", "Bengaluru", "Hyderabad"
];

export default function LoginOTP() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    // Step state: 1 = Input Details, 2 = OTP
    const [step, setStep] = useState(1);

    // Data State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");

    // UI State
    const [cities, setCities] = useState<string[]>(CITY_OPTIONS);
    const [citySearch, setCitySearch] = useState("");
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);

    // OTP State
    const [otp, setOtp] = useState("");
    const [verificationId, setVerificationId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch cities on load
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
            } catch (err) {
                console.error("Error fetching cities:", err);
            }
        };
        fetchCities();
    }, []);

    // Handle click outside city dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
                setCityDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCities = cities.filter(c =>
        !citySearch.trim() || new RegExp(citySearch.trim(), "i").test(c)
    );

    // Generate OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !city) {
            setError("Please fill all fields");
            return;
        }
        if (!/^[0-9]{10}$/.test(phone)) {
            setError("Enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/api/verify/generate-otp", {
                name,
                city,
                phoneNumber: phone,
            });

            if (response.data.success) {
                setVerificationId(response.data.verificationId);
                setStep(2);
                if (response.data.testOtp) {
                    console.log("🔢 Test OTP:", response.data.testOtp);
                }
            } else {
                throw new Error(response.data.message || "Failed to send OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 6) {
            setError("Enter valid 6-digit OTP");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/api/verify/verify-otp", {
                verificationId,
                otp,
                phoneNumber: phone,
            });

            if (response.data.success) {
                const { token, client, firebaseToken } = response.data;

                // Store tokens and client data
                localStorage.setItem("token", token);
                localStorage.setItem("client", JSON.stringify(client));

                // Sign into Firebase
                if (firebaseToken) {
                    await signInWithCustomToken(auth, firebaseToken);
                }

                navigate(redirect, { replace: true });
            } else {
                throw new Error(response.data.message || "Invalid OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
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
                        {step === 1 ? "Login / Sign up with your mobile number" : `Enter the 6-digit code sent to +91 ${phone}`}
                    </p>
                </div>

                <div className="px-6 pb-12">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs animate-in fade-in slide-in-from-top-2">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
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
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => { setCity(c); setCityDropdownOpen(false); }}
                                                    className={`w-full px-5 py-3 text-left text-sm font-bold transition-colors hover:bg-orange-50 ${city === c ? "text-[#FFA800] bg-orange-50/50" : "text-gray-700"}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                            {filteredCities.length === 0 && (
                                                <div className="px-5 py-4 text-xs font-bold text-gray-400 text-center">No city found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
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

                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.length < 6}
                                className="w-full h-14 bg-gray-900 text-white rounded-[24px] text-[18px] font-black shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Verify Identity"}
                            </button>

                            <div className="text-center">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center justify-center gap-2 mx-auto"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to details
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
