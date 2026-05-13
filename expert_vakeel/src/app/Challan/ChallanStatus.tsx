import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
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
    ShieldCheck,
    ClipboardCheck,
    FileText,
    ArrowRight,
    Star,
    HelpCircle
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

    // Step state: 1 = Vehicle, 2 = Contact, 3 = OTP, 4 = Results
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
    const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"pending" | "paid">("pending");
    const [isPledged, setIsPledged] = useState(false);
    const [pledgeRewardPercentage, setPledgeRewardPercentage] = useState(40); // Admin-controllable

    // Fetch cities and settings on load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch cities
                const response = await publicUserAPI.getAll({ limit: "1000" });
                if (response.data && Array.isArray(response.data.data)) {
                    const citiesSet = new Set<string>();
                    response.data.data.forEach((user: any) => {
                        if (user.city) {
                            const cleanedCity = user.city.trim();
                            if (cleanedCity) citiesSet.add(cleanedCity);
                        }
                    });
                    setCities(Array.from(citiesSet).sort());
                }

                // 2. Fetch pledge reward percentage from admin settings
                try {
                    const settingsRes = await api.get("/api/settings/pledgeRewardPercentage");
                    if (settingsRes.data.success && settingsRes.data.data) {
                        setPledgeRewardPercentage(Number(settingsRes.data.data.value));
                    }
                } catch (err) {
                    console.log("Using default reward percentage (40%)");
                }
            } catch (err) {
                console.error("Error fetching initial data:", err);
            }
        };

        fetchData();
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

    // Proceed to Step 2
    const handleNextToContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleNumber) {
            setError("Please enter vehicle number");
            return;
        }
        setError(null);
        setStep(2);
    };

    // Generate OTP (Step 2 -> 3)
    const handleInitiateCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !city) {
            setError("Please fill all contact fields");
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
                setStep(3);
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
    const handlePayment = async (amount: number, challanNumber: string) => {
        setLoading(true);
        try {
            const orderRes = await api.post("/api/challan/create-order", {
                amount,
                vehicleNumber: vehicleNumber.toUpperCase(),
                challanNumber,
                name,
                phone,
                city
            });

            if (orderRes.data.success) {
                const options = {
                    key: orderRes.data.keyId,
                    amount: orderRes.data.order.amount,
                    currency: "INR",
                    name: "Expert Vakeel",
                    description: `Challan Payment - ${challanNumber}`,
                    order_id: orderRes.data.order.id,
                    handler: async (response: any) => {
                        try {
                            const verifyRes = await api.post("/api/challan/verify-payment", {
                                ...response,
                                vehicleNumber: vehicleNumber.toUpperCase(),
                                challanNumber,
                                amount,
                                name,
                                phone,
                                city
                            });

                            if (verifyRes.data.success) {
                                // Success state
                                const paidIds = challanNumber.split(', ');
                                setChallanData(prev => {
                                    if (!prev) return prev;
                                    return {
                                        ...prev,
                                        pendingChallans: prev.pendingChallans.filter(c => !paidIds.includes(c.id) && !paidIds.includes(c.challanNumber)),
                                        totalPending: prev.totalPending - amount
                                    };
                                });
                                setSelectedChallanIds([]);
                                alert("Payment successful! Challan status updated.");
                            }
                        } catch (err) {
                            console.error("Verification failed:", err);
                            alert("Payment verification failed. Please contact support.");
                        }
                    },
                    prefill: {
                        name: name,
                        email: `${phone}@expertvakeel.com`,
                        contact: phone
                    },
                    theme: {
                        color: "#1a365d"
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (err: any) {
            console.error("Payment error:", err);
            setError("Failed to initiate payment");
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

            // 2. Demo Logic
            if (vehicleNumber.trim().toUpperCase() === "CHALLAN1234") {
                const demoData: ProcessedChallanData = {
                    vehicleNumber: "CHALLAN1234",
                    ownerName: name || "Demo User",
                    pendingChallans: [
                        {
                            id: "demo-1",
                            challanNumber: "CH-DEMO-2024-001",
                            date: "2024-03-20",
                            location: "Sec 17, Chandigarh",
                            violation: "Red Light Jump",
                            amount: 1000,
                            status: "pending",
                            offences: [{ offence_name: "Red Light Jump", offence_fine: "1000", motor_vehicle_act: "Sec 184" }],
                            challanPlace: "Chandigarh",
                            accusedName: name || "Demo User"
                        },
                        {
                            id: "demo-2",
                            challanNumber: "CH-DEMO-2024-002",
                            date: "2024-03-15",
                            location: "Mohali Toll Plaza",
                            violation: "Over Speeding",
                            amount: 2000,
                            status: "pending",
                            offences: [{ offence_name: "Over Speeding", offence_fine: "2000", motor_vehicle_act: "Sec 183" }],
                            challanPlace: "Mohali",
                            accusedName: name || "Demo User"
                        }
                    ],
                    totalPending: 3000
                };
                setChallanData(demoData);
                setSelectedChallanIds(demoData.pendingChallans.map(c => c.challanNumber));
                setStep(4);
                setLoading(false);
                return;
            }

            // 3. Fetch Challan (Rapid API Integration)
            let processedChallans: any[] = [];
            let totalPending = 0;
            let ownerName = "Not Available";

            try {
                const challanRes = await challanAPI.searchRapid(vehicleNumber.toUpperCase());
                const rapidData = challanRes.data;

                // Handle RapidAPI response structure
                // Assuming it might have a 'data' field or be the root object
                const results = rapidData.result || rapidData.data || rapidData.results || (Array.isArray(rapidData) ? rapidData : []);
                ownerName = rapidData.owner_name || rapidData.ownerName || "Not Available";

                if (Array.isArray(results)) {
                    processedChallans = results.map((c: any) => ({
                        id: (c.challan_number || c.challan_no || c.challanNumber || Math.random()).toString(),
                        challanNumber: c.challan_number || c.challan_no || c.challanNumber || "N/A",
                        date: c.challan_date || c.challan_date_time || c.date || "N/A",
                        location: c.challan_place || c.location || "N/A",
                        violation: c.offence || c.violation || "N/A",
                        amount: parseInt(c.amount || c.challan_amount) || 0,
                        status: (c.status || c.challan_status || "pending").toLowerCase(),
                        offences: c.offences || [{ offence_name: c.offence || "N/A", offence_fine: c.amount || "0", motor_vehicle_act: "" }],
                        challanPlace: c.challan_place || c.location || "N/A",
                        accusedName: c.owner_name || c.accused_name || c.accusedName || ownerName,
                    }));

                    
                    totalPending = processedChallans
                        .filter(c => c.status === "pending")
                        .reduce((sum: number, c: any) => sum + c.amount, 0);
                } else {
                    // Fallback for single object or different structure
                    console.log("RapidAPI returned non-array result:", rapidData);
                }
            } catch (rapidErr) {
                console.error("RapidAPI Error, falling back to existing API:", rapidErr);
                // Fallback to original API if RapidAPI fails
                const challanRes = await challanAPI.search(
                    vehicleNumber.toUpperCase(),
                    `${phone}@expertvakeel.com`,
                    phone
                );
                const challanPayload = challanRes.data.data;

                if (challanPayload.statusCode === 200 && Array.isArray(challanPayload.data)) {
                    processedChallans = challanPayload.data.map((c: ChallanItem) => ({
                        id: c.challanId.toString(),
                        challanNumber: c.challanNumber,
                        date: c.challanDate,
                        location: c.challanPlace,
                        violation: c.offences.map((o) => o.offence_name).join(", "),
                        amount: parseInt(c.challanAmount) || 0,
                        status: c.challanStatus.toLowerCase(),
                        offences: c.offences,
                        challanPlace: c.challanPlace,
                        accusedName: c.accusedName,
                    }));
                    totalPending = processedChallans
                        .filter(c => c.status === "pending")
                        .reduce((sum: number, c: any) => sum + c.amount, 0);
                    ownerName = challanPayload.data[0]?.accusedName || "Not Available";
                }
            }

            if (processedChallans.length > 0) {
                const newChallanData = {
                    vehicleNumber: vehicleNumber.toUpperCase(),
                    ownerName: ownerName,
                    pendingChallans: processedChallans,
                    totalPending,
                };
                setChallanData(newChallanData);
                setSelectedChallanIds(newChallanData.pendingChallans.filter(c => c.status === "pending").map(c => c.challanNumber));

                // 4. Create Lead for records
                await serviceBookedAPI.create({
                    clientId: clientId || "",
                    phoneNumber: phone,
                    title: "Challan Search",
                    description: `Challan search (RapidAPI) executed for ${vehicleNumber} by ${name} from ${city}`,
                    servicesBooked: ["Traffic Challan Assistance"],
                });

                setStep(4);
            } else {
                throw new Error("No challan data found");
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
            <div className="bg-[#1a365d] pt-16 pb-40 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <button
                        onClick={() => navigate("/")}
                        className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>

                    {/* Stepper Header Based on Reference Image */}
                    <div className="mb-2 text-center">
                        <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.4em] mb-10">
                            Check Your <span className="text-white">Challan Status</span>
                        </h2>

                        <div className="flex items-center justify-between relative max-w-sm mx-auto">
                            {/* Connector Background */}
                            <div className="absolute top-5 left-0 w-full h-[2px] bg-white/10 rounded-full" />
                            {/* Connector Active */}
                            <div
                                className="absolute top-5 left-0 h-[2px] bg-[#FFA800] rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${((step - 1) / 3) * 100}%` }}
                            />

                            {[
                                { s: 1, label: "Vehicle", icon: Car },
                                { s: 2, label: "Details", icon: User },
                                { s: 3, label: "Verify", icon: ShieldCheck },
                                { s: 4, label: "Results", icon: ClipboardCheck }
                            ].map((item) => (
                                <div key={item.s} className="relative z-10 flex flex-col items-center group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 transform ${step === item.s
                                        ? "bg-[#FFA800] text-white shadow-[0_0_20px_rgba(255,168,0,0.4)] scale-110"
                                        : step > item.s
                                            ? "bg-[#FFA800] text-white"
                                            : "bg-[#1a365d] border-2 border-white/20 text-white/40"
                                        }`}>
                                        {step > item.s ? <Check className="w-5 h-5 stroke-[3]" /> : <item.icon className="w-4 h-4" />}
                                    </div>
                                    <div className="absolute -bottom-7 w-20 text-center">
                                        <span className={`text-[8px] font-black uppercase tracking-widest block transition-colors ${step >= item.s ? "text-[#FFA800]" : "text-white/20"
                                            }`}>
                                            {item.label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${step === 4 ? "max-w-7xl mx-auto px-4 pb-20 relative z-20" : "max-w-xl mx-auto -mt-24 px-4 pb-20 relative z-20"}`}>
                <div className={`${step === 4 ? "" : "bg-white rounded-[40px] shadow-2xl shadow-blue-900/40 border border-white/10 overflow-hidden"}`}>



                    <div className="p-8 md:p-10">
                        {step <= 2 && (
                            <div className="mb-8 text-center">
                                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                                    Please Fill Details
                                </h1>
                                <p className="mt-2 text-sm font-medium text-gray-400">
                                    {step === 1 ? "Start by entering vehicle number" : "Provide contact information"}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleNextToContact} className="space-y-6 animate-in fade-in duration-500">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors">
                                            <Car strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Vehicle / DL Number"
                                            value={vehicleNumber}
                                            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                            className="w-full h-16 pl-14 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5 uppercase placeholder:normal-case placeholder:font-medium"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-16 bg-[#1a365d] text-white rounded-[24px] text-[18px] font-black shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleInitiateCheck} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors">
                                            <User strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-16 pl-14 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors">
                                            <Phone strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Mobile Number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            className="w-full h-16 pl-14 pr-4 bg-[#F6F6F6] rounded-[24px] outline-none text-[16px] font-bold text-gray-800 transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
                                        />
                                    </div>

                                    <div className="relative" ref={cityDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                                            className="w-full h-16 pl-5 pr-12 bg-[#F6F6F6] rounded-[24px] text-left flex items-center justify-between outline-none transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white focus:ring-4 focus:ring-[#FFA800]/5"
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
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 h-16 bg-gray-100 text-gray-500 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-2/3 h-16 bg-[#FFA800] text-white rounded-[24px] text-[18px] font-black shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Get OTP"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
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

                                <div className="space-y-8">
                                    <div className="flex justify-center gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            placeholder="0 0 0 0 0 0"
                                            className="w-full h-20 text-center bg-[#F6F6F6] rounded-[24px] outline-none text-[32px] font-black tracking-[0.4em] transition-all border border-transparent focus:border-[#FFA800]/30 focus:bg-white placeholder:tracking-normal placeholder:text-gray-200"
                                        />
                                    </div>

                                    <button
                                        onClick={handleVerifyAndFetch}
                                        disabled={loading || otp.length < 6}
                                        className="w-full h-16 bg-gray-900 text-white rounded-[24px] text-[18px] font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Verify Identity"}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center justify-center gap-2 mx-auto"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" /> Back to details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && challanData && (
                            <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 -mt-32">
                                {/* Sidebar */}
                                <div className="lg:w-1/4 space-y-4">
                                    {/* Vehicle Card */}
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-black text-gray-900 tracking-tight">{challanData.vehicleNumber}</h4>
                                            <button 
                                                onClick={() => setStep(1)}
                                                className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
                                            >
                                                Change <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="h-px bg-gray-100 w-full mb-6"></div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setActiveTab("pending")}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-black text-sm ${activeTab === "pending" ? "bg-orange-50 text-orange-600 border border-orange-100" : "text-gray-600 hover:bg-gray-50"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    Pending Challans
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "pending" ? "bg-orange-200 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                                                        {challanData.pendingChallans.filter(c => c.status === "pending").length}
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("paid")}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-black text-sm ${activeTab === "paid" ? "bg-orange-50 text-orange-600 border border-orange-100" : "text-gray-600 hover:bg-gray-50"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    Paid Challans
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "paid" ? "bg-orange-200 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                                                        {challanData.pendingChallans.filter(c => c.status !== "pending").length}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 space-y-6 pb-32">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payable on Expert Vakeel</p>
                                            <h3 className="text-3xl font-black text-gray-900 mb-1">{challanData.pendingChallans.filter(c => c.status === "pending").length}</h3>
                                            <p className="text-sm font-bold text-gray-500">Amount: ₹{challanData.pendingChallans.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payable externally</p>
                                            <h3 className="text-3xl font-black text-gray-900 mb-1">0</h3>
                                            <p className="text-sm font-bold text-gray-500">Amount: ₹0</p>
                                        </div>
                                    </div>

                                    {/* Tab Title */}
                                    <div className="flex items-end justify-between px-1">
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900">
                                                {activeTab === "pending" ? "Payable on Expert Vakeel" : "Recently Paid Challans"}
                                            </h2>
                                            <p className="text-xs font-bold text-gray-400 mt-1">
                                                {activeTab === "pending" ? "Challans that can be settled online on Expert Vakeel" : "Challans that have been successfully cleared"}
                                            </p>
                                        </div>
                                        {activeTab === "pending" && (
                                            <button
                                                onClick={() => {
                                                    const pendingOnly = challanData.pendingChallans.filter(c => c.status === "pending");
                                                    if (selectedChallanIds.length === pendingOnly.length) {
                                                        setSelectedChallanIds([]);
                                                    } else {
                                                        setSelectedChallanIds(pendingOnly.map(c => c.challanNumber));
                                                    }
                                                }}
                                                className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                                            >
                                                {selectedChallanIds.length === challanData.pendingChallans.filter(c => c.status === "pending").length ? "Deselect all" : "Select all"}
                                            </button>
                                        )}
                                    </div>

                                    {/* Challan Cards List */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {challanData.pendingChallans
                                            .filter(c => activeTab === "pending" ? c.status === "pending" : c.status !== "pending")
                                            .map((c, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        if (c.status !== "pending") return;
                                                        setSelectedChallanIds(prev =>
                                                            prev.includes(c.challanNumber)
                                                                ? prev.filter(id => id !== c.challanNumber)
                                                                : [...prev, c.challanNumber]
                                                        );
                                                    }}
                                                    className={`group relative bg-white border rounded-3xl p-6 transition-all duration-300 ${c.status === "pending"
                                                        ? selectedChallanIds.includes(c.challanNumber)
                                                            ? "border-blue-500 shadow-xl shadow-blue-500/5 ring-4 ring-blue-50 cursor-pointer"
                                                            : "border-gray-100 hover:shadow-lg cursor-pointer"
                                                        : "bg-white border-gray-100"}`}
                                                >
                                                    {/* Card Header Badge */}
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                                                            {c.offences?.[0]?.motor_vehicle_act ? "Court Challan" : "State Challan"}
                                                        </span>
                                                        {c.status === "pending" && (
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedChallanIds.includes(c.challanNumber) ? "bg-blue-500 border-blue-500 text-white" : "border-gray-200 bg-white"}`}>
                                                                {selectedChallanIds.includes(c.challanNumber) && <Check className="w-4 h-4 stroke-[4]" />}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mb-2">
                                                        <span className="text-xs font-bold text-gray-400">Challan no: {c.challanNumber}</span>
                                                    </div>
                                                    
                                                    <div className="mb-4">
                                                        <h3 className="text-2xl font-black text-gray-900">₹{c.amount}</h3>
                                                        <p className="text-sm font-bold text-gray-800 leading-tight mt-1 line-clamp-2">{c.violation}</p>
                                                    </div>

                                                    <div className="space-y-2 mb-6">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                                            <CalendarDays className="w-3.5 h-3.5" /> Issued On {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                                            <MapPin className="w-3.5 h-3.5" /> {c.location || "N/A"}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md">
                                                            PENDING SINCE {Math.floor((new Date().getTime() - new Date(c.date).getTime()) / (1000 * 3600 * 24))} DAYS
                                                        </span>
                                                        <button className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                            Details <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Empty State */}
                                    {challanData.pendingChallans.filter(c => activeTab === "pending" ? c.status === "pending" : c.status !== "pending").length === 0 && (
                                        <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-gray-200">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                                <ClipboardCheck className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2">No {activeTab} challans</h3>
                                            <p className="text-sm font-bold text-gray-400">Great job! All your records are clear.</p>
                                        </div>
                                    )}

                                    {/* History/Payments Links Section */}
                                    <div className="mt-12 pt-8 border-t border-gray-100">
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Quick Access</h5>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => navigate("/my-bookings")}
                                                className="flex items-center justify-center gap-2 bg-blue-50 text-[#1a365d] font-bold py-4 rounded-3xl border border-blue-100 hover:bg-blue-100 transition-all text-sm"
                                            >
                                                <History className="w-4 h-4" />
                                                History
                                            </button>
                                            <button
                                                onClick={() => navigate("/my-payments")}
                                                className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-bold py-4 rounded-3xl border border-green-100 hover:bg-green-100 transition-all text-sm"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Payments
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Sticky Footer Checkout */}
                                {selectedChallanIds.length > 0 && activeTab === "pending" && (
                                    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 md:pb-10 pointer-events-none">
                                        <div className="max-w-4xl mx-auto pointer-events-auto">
                                            <div className="bg-white rounded-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-20 duration-500">
                                                <div className="flex flex-col items-center md:items-start">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total selected</p>
                                                    <h4 className="text-xl font-black text-gray-900">{selectedChallanIds.length} challans</h4>
                                                </div>
                                                
                                                <button
                                                    onClick={() => navigate("/checkout", {
                                                        state: {
                                                            challanData,
                                                            selectedChallanIds,
                                                            isPledged: false,
                                                            name,
                                                            phone,
                                                            city
                                                        }
                                                    })}
                                                    className="w-full md:w-auto px-12 h-16 bg-[#FFA800] hover:bg-orange-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]"
                                                >
                                                    Continue to pay <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
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


