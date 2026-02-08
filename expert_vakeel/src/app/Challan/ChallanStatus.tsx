import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { serviceBookedAPI, publicUserAPI, challanAPI } from "../../services/api";
import {
    ArrowLeft,
    Loader,
    Check,
    AlertCircle,
    MapPin,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Search as SearchIcon,
    Car,
    Phone,
    User,
    ShieldCheck
} from "lucide-react";

// Types from ServiceDetail
interface ChallanOffence {
    offence_name: string;
    offence_fine: string;
    motor_vehicle_act: string;
}

interface ChallanItem {
    accusedName: string;
    accusedFatherName: string;
    rcNumber: string;
    challanNumber: string;
    challanId: number;
    challanDate: string;
    challanStatus: string;
    challanAmount: string;
    rcStateCode: string;
    challanPaymentSource: string;
    rtoOfficeName: string;
    challanPaymentDate: string;
    challanPlace: string;
    offences: ChallanOffence[];
}

interface ProcessedChallanData {
    vehicleNumber: string;
    ownerName: string;
    pendingChallans: {
        id: string;
        challanNumber: string;
        date: string;
        location: string;
        violation: string;
        amount: number;
        status: string;
        offences: ChallanOffence[];
        challanPlace: string;
        accusedName: string;
    }[];
    totalPending: number;
}

const CITY_OPTIONS = [
    "Chandigarh", "Mohali", "Panchkula", "Delhi", "Mumbai", "Bengaluru",
    "Kolkata", "Chennai", "Hyderabad", "Pune"
];

export default function ChallanStatus() {
    const navigate = useNavigate();

    // Step state: 1 = Input Details, 2 = OTP, 3 = Results
    const [step, setStep] = useState(1);

    // Data State
    const [vehicleNumber, setVehicleNumber] = useState("");
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

    // Results State
    const [challanData, setChallanData] = useState<ProcessedChallanData | null>(null);

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
    const handleInitiateCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleNumber || !name || !phone || !city) {
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

    // Verify OTP & Fetch Challan
    const handleVerifyAndFetch = async () => {
        if (!otp || otp.length < 6) {
            setError("Enter valid 6-digit OTP");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Verify OTP
            const verifyRes = await api.post("/api/verify/verify-otp", {
                verificationId,
                otp,
                phoneNumber: phone,
            });

            if (!verifyRes.data.success) {
                throw new Error(verifyRes.data.message || "Invalid OTP");
            }

            const clientId = verifyRes.data.clientId;

            // 2. Clear previous session/memory (per user request) - actually just use fresh inputs

            // 3. Fetch Challan
            const challanRes = await challanAPI.search(
                vehicleNumber.toUpperCase(),
                `${phone}@expertvakeel.com`,
                phone
            );

            const challanPayload = challanRes.data.data;

            if (challanPayload.statusCode === 200 && Array.isArray(challanPayload.data)) {
                const pendingChallans = challanPayload.data.filter(
                    (c: ChallanItem) => c.challanStatus.toLowerCase() === "pending",
                );

                const processedChallans = pendingChallans.map((c: ChallanItem) => ({
                    id: c.challanId.toString(),
                    challanNumber: c.challanNumber,
                    date: c.challanDate,
                    location: c.challanPlace,
                    violation: c.offences.map((o) => o.offence_name).join(", "),
                    amount: parseInt(c.challanAmount) || 0,
                    status: c.challanStatus,
                    offences: c.offences,
                    challanPlace: c.challanPlace,
                    accusedName: c.accusedName,
                }));

                const totalPending = processedChallans.reduce((sum: number, c: any) => sum + c.amount, 0);

                setChallanData({
                    vehicleNumber: vehicleNumber.toUpperCase(),
                    ownerName: challanPayload.data[0]?.accusedName || "Not Available",
                    pendingChallans: processedChallans,
                    totalPending,
                });

                // 4. Create Lead for records
                await serviceBookedAPI.create({
                    clientId: clientId || "",
                    phoneNumber: phone,
                    title: "Challan Search",
                    description: `Challan search executed for ${vehicleNumber} by ${name} from ${city}`,
                    servicesBooked: ["Traffic Challan Assistance"],
                });

                setStep(3);
            } else {
                throw new Error(challanPayload.message || "No challan data found");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Hero Header */}
            <div className="bg-[#1a365d] pt-16 pb-32 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <button
                        onClick={() => navigate("/")}
                        className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                        Check Your Traffic Challan
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                        Get instant updates on pending vehicle challans and professional legal assistance to resolve them.
                    </p>
                </div>
            </div>

            <div className="max-w-xl mx-auto -mt-20 px-4 pb-20">
                <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">

                    {/* Progress Indicator */}
                    <div className="flex border-b border-gray-50">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-widest ${step === s ? "text-blue-600 bg-blue-50/50" : "text-gray-300"
                                    } transition-colors duration-500`}
                            >
                                Step 0{s}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 md:p-10">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleInitiateCheck} className="space-y-6 animate-in fade-in duration-500">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Vehicle Number</label>
                                        <div className="relative">
                                            <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="e.g. CH01 AB 1234"
                                                value={vehicleNumber}
                                                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 uppercase placeholder:normal-case placeholder:font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Enter your name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="tel"
                                                placeholder="10-digit mobile number"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative" ref={cityDropdownRef}>
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">City</label>
                                        <button
                                            type="button"
                                            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                                            className="w-full pl-4 pr-10 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-left flex items-center justify-between outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-gray-400" />
                                                <span className={`font-semibold ${city ? "text-gray-900" : "text-gray-400"}`}>
                                                    {city || "Select City"}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {cityDropdownOpen && (
                                            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-3 border-b border-gray-50">
                                                    <div className="relative">
                                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search city..."
                                                            value={citySearch}
                                                            onChange={(e) => setCitySearch(e.target.value)}
                                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {filteredCities.map(c => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => { setCity(c); setCityDropdownOpen(false); }}
                                                            className={`w-full px-5 py-3 text-left text-sm font-semibold transition-colors hover:bg-blue-50 ${city === c ? "text-blue-600 bg-blue-50/50" : "text-gray-700"}`}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[#FFA800] hover:bg-orange-500 text-white rounded-2xl text-xl font-extrabold shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Check Challan Status"}
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6 text-blue-600">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Verify OTP</h2>
                                    <p className="text-gray-500">
                                        We've sent a code to <span className="font-bold text-gray-800">+91 {phone}</span>
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-center gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            placeholder="0 0 0 0 0 0"
                                            className="w-full text-center py-5 bg-gray-50 border border-gray-200 rounded-2xl text-3xl font-black tracking-[1em] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:tracking-normal placeholder:text-gray-300"
                                        />
                                    </div>

                                    <button
                                        onClick={handleVerifyAndFetch}
                                        disabled={loading}
                                        className="w-full py-4 bg-[#1a365d] hover:bg-[#2d4a7c] text-white rounded-2xl text-xl font-extrabold shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Verify & Fetch Results"}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            Change Mobile Number
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && challanData && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="bg-gradient-to-br from-[#1a365d] to-[#0f172a] rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/20">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Registered Owner</p>
                                            <h3 className="text-xl font-black">{challanData.ownerName}</h3>
                                        </div>
                                        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-0.5">Vehicle</p>
                                            <p className="font-mono font-bold text-sm tracking-widest">{challanData.vehicleNumber}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                        <div>
                                            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">Total Outstanding</p>
                                            <p className="text-4xl font-black text-[#FFA800]">₹{challanData.totalPending.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black">{challanData.pendingChallans.length}</p>
                                            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Active Challans</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Challan Details</h4>
                                    {challanData.pendingChallans.length > 0 ? (
                                        challanData.pendingChallans.map((c, i) => (
                                            <div key={i} className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                        <span className="text-[11px] font-bold text-gray-500 font-mono tracking-wider">{c.challanNumber}</span>
                                                    </div>
                                                    <span className="text-xl font-black text-red-600">₹{c.amount}</span>
                                                </div>
                                                <h4 className="font-extrabold text-gray-900 text-lg mb-3 leading-tight">{c.violation}</h4>
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                        <CalendarDays className="w-4 h-4 text-blue-500" /> {c.date}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                        <MapPin className="w-4 h-4 text-orange-500" /> {c.location}
                                                    </div>
                                                </div>
                                                <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CheckCircle2 className="w-6 h-6 text-blue-100" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-green-50 rounded-[32px] border border-green-100">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 text-green-600">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <h4 className="text-xl font-black text-green-900 mb-1">No Pending Challans</h4>
                                            <p className="text-green-700 font-medium">Your vehicle record is perfectly clean!</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => navigate("/services?specialization=Traffic%20Challan")}
                                        className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-lg font-extrabold transition-all active:scale-[0.98]"
                                    >
                                        Talk to Expert to Resolve
                                    </button>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full py-4 text-gray-400 text-sm font-bold hover:text-blue-600 transition-colors"
                                    >
                                        Check Another Vehicle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#1a365d]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1a365d]">Secure SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#1a365d]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1a365d]">Verified Source</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-[#1a365d]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1a365d]">Data Privacy Guaranteed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
