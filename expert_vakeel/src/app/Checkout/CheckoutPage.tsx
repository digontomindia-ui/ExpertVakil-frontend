import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    ArrowLeft, 
    ShieldCheck, 
    Car, 
    Check, 
    ArrowRight, 
    Star, 
    CheckCircle2, 
    User, 
    Loader 
} from "lucide-react";
import api from "../../services/api";

// Reusing types from ChallanStatus
interface ChallanOffence {
    offence_name: string;
    offence_fine: string;
    motor_vehicle_act: string;
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

interface CheckoutState {
    challanData: ProcessedChallanData;
    selectedChallanIds: string[];
    isPledged: boolean;
    name: string;
    phone: string;
    city: string;
}

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as CheckoutState;

    const [loading, setLoading] = useState(false);
    const [isPledged, setIsPledged] = useState(state?.isPledged || false);
    const [showDecoration, setShowDecoration] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [pledgeRewardPercentage, setPledgeRewardPercentage] = useState(40);

    // Fetch pledge reward percentage
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsRes = await api.get("/api/settings/pledgeRewardPercentage");
                if (settingsRes.data.success && settingsRes.data.data) {
                    setPledgeRewardPercentage(Number(settingsRes.data.data.value));
                }
            } catch (err) {
                console.log("Using default reward percentage (40%)");
            }
        };
        fetchSettings();
    }, []);

    if (!state || !state.challanData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                    <Car size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">No active checkout</h2>
                <p className="text-gray-500 mb-8 max-w-sm">Please return to challan status to select challans for payment.</p>
                <button
                    onClick={() => navigate("/challan-status")}
                    className="px-8 py-4 bg-[#1a365d] text-white rounded-2xl font-bold hover:brightness-110 transition-all active:scale-95"
                >
                    Back to Challan Status
                </button>
                
            </div>
        );
    }

    const { challanData, selectedChallanIds, name, phone, city } = state;
    const selectedChallans = challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber));
    const subtotal = selectedChallans.reduce((sum, c) => sum + c.amount, 0);
    const convenienceFee = selectedChallanIds.length * 200;
    const reward = isPledged ? (subtotal * (pledgeRewardPercentage / 100)) : 0;
    const total = (subtotal + convenienceFee) - reward;

    const handlePledgeApply = () => {
        setIsPledged(true);
        setShowDecoration(true);
        setTimeout(() => setShowDecoration(false), 3000); // Hide decoration after 3s
    };

    const handlePaymentAction = async () => {
        setLoading(true);
        try {
            const orderRes = await api.post("/api/challan/create-order", {
                amount: total,
                vehicleNumber: challanData.vehicleNumber,
                challanNumber: selectedChallanIds.join(', '),
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
                    description: `Challan Payment - ${challanData.vehicleNumber}`,
                    order_id: orderRes.data.order.id,
                    handler: async (response: any) => {
                        try {
                            const verifyRes = await api.post("/api/challan/verify-payment", {
                                ...response,
                                vehicleNumber: challanData.vehicleNumber,
                                challanNumber: selectedChallanIds.join(', '),
                                amount: total,
                                name,
                                phone,
                                city
                            });
                            if (verifyRes.data.success) {
                                alert("Payment successful!");
                                navigate("/challan-status");
                            }
                        } catch (err) {
                            alert("Verification failed. Please contact support.");
                        }
                    },
                    prefill: {
                        name: name,
                        email: `${phone}@expertvakeel.com`,
                        contact: phone
                    },
                    theme: { color: "#1a365d" }
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (err) {
            alert("Failed to initiate payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] pt-safe pb-safe">
            <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
                
                {/* Header Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-[#1a365d] font-bold text-xs uppercase tracking-widest hover:opacity-70 transition-all group"
                    >
                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:-translate-x-1 transition-transform">
                            <ArrowLeft size={14} strokeWidth={2.5} />
                        </div>
                        Payment Summary
                    </button>
                    
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm self-start md:self-auto">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Car size={16} strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 leading-none mb-0.5 uppercase tracking-wider">VEHICLE ID</p>
                            <p className="font-mono font-bold text-gray-900 tracking-wider text-base leading-none">{challanData.vehicleNumber}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    
                    {/* Left Panel */}
                    <div className="flex-1 space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Final Settlement</h2>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">SELECT YOUR METHOD</p>
                        </div>

                        <div className="space-y-6">
                            {/* PLEDGE CARD */}
                            <div 
                                className={`group relative bg-white border-2 rounded-2xl p-6 lg:p-8 transition-all duration-300 overflow-hidden ${isPledged ? "border-green-500 shadow-xl shadow-green-50" : "border-white shadow-lg shadow-gray-100"}`}
                            >
                                {showDecoration && (
                                    <div className="absolute inset-0 pointer-events-none z-20">
                                        {[...Array(12)].map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                                                style={{
                                                    left: `${Math.random() * 100}%`,
                                                    top: `${Math.random() * 100}%`,
                                                    animationDelay: `${Math.random() * 2}s`
                                                }}
                                            />
                                        ))}
                                        <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                                    </div>
                                )}

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-6">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${isPledged ? "bg-green-500 text-white" : "bg-blue-50 text-blue-500"}`}>
                                            <ShieldCheck size={28} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1a365d] mb-1">Pledge to Drive Safely</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Exclusive Reward Offering</p>
                                            <p className="text-xs font-medium text-gray-500 leading-relaxed uppercase tracking-wide">Commit to zero violations for 1 year<br className="hidden md:block" /> and unlock instant settlement rewards.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-3">
                                        {isPledged ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 animate-in zoom-in-50 duration-300">
                                                    <Check size={20} strokeWidth={3} />
                                                </div>
                                                <button 
                                                    onClick={() => setIsPledged(false)}
                                                    className="text-[9px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handlePledgeApply}
                                                className="px-6 py-2.5 bg-[#0097B2] hover:bg-[#00ADC8] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/10 transition-all active:scale-95"
                                            >
                                                Apply
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PROMO CODE SECTION */}
                            {!isPledged && (
                                <div className="bg-white rounded-2xl p-6 border border-white shadow-lg shadow-gray-100 flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex-1 w-full space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Have a Promo Code?</label>
                                        <div className="relative">
                                            <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input 
                                                type="text" 
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                placeholder="ENTER CODE"
                                                className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#0097B2]/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        disabled={!promoCode}
                                        className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                {["Instant Benefit", "Court-Free", "Clean Record"].map((item, i) => (
                                    <div key={i} className="bg-white/60 p-4 rounded-xl border border-white flex flex-col items-center text-center gap-3 transition-all hover:bg-white shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-full lg:w-[400px]">
                        <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-xl shadow-gray-100 border border-white h-full flex flex-col">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">REVIEW SETTLEMENT</h4>
                                    <span className="bg-blue-50 text-[10px] font-bold text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 uppercase">
                                        {selectedChallanIds.length} ITEMS
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-gray-800">
                                        <span className="font-bold text-[10px] uppercase tracking-widest opacity-40">ORDER TOTAL</span>
                                        <span className="font-bold text-lg">₹{subtotal.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-gray-800">
                                        <span className="font-bold text-[10px] uppercase tracking-widest opacity-40">CONVENIENCE</span>
                                        <span className="font-bold text-lg">₹{convenienceFee.toLocaleString()}</span>
                                    </div>

                                    {isPledged && (
                                        <div className="flex justify-between items-center text-green-600 bg-green-50/50 p-4 rounded-xl border border-green-100/50 animate-in zoom-in-95 duration-500">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-green-500 text-white rounded-md">
                                                    <Star size={10} fill="currentColor" />
                                                </div>
                                                <span className="font-bold text-[10px] uppercase tracking-widest">PLEDGE DISCOUNT</span>
                                            </div>
                                            <span className="font-black text-lg">-₹{reward.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                                        <span className="font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">GRAND TOTAL</span>
                                        <span className="font-black text-3xl text-gray-900 leading-none">₹{total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 space-y-6 text-center lg:text-left">
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">FINAL PAYMENT</h4>
                                    <div className="flex justify-center lg:justify-between items-end gap-10 lg:gap-0">
                                        <span className="text-5xl font-bold text-gray-900 leading-none tracking-tight">
                                            ₹{total.toLocaleString()}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-wider leading-none mb-1">TAX INCLUSIVE</p>
                                            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">INSTANT RECEIPT</p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="button"
                                    onClick={handlePaymentAction}
                                    disabled={loading}
                                    className="w-full h-16 bg-[#0097B2] hover:bg-[#00ADC8] text-white rounded-xl text-lg font-bold shadow-lg shadow-cyan-900/5 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
                                >
                                    {loading ? (
                                        <Loader className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            Proceed To Pay 
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-8 pt-2">
                                    {[
                                        { icon: ShieldCheck, label: "SECURE" },
                                        { icon: CheckCircle2, label: "VERIFIED" },
                                        { icon: User, label: "PRIVATE" }
                                    ].map((badge, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-1.5 opacity-20 hover:opacity-60 transition-opacity">
                                            <badge.icon size={14} strokeWidth={2.5} />
                                            <span className="text-[7px] font-bold uppercase tracking-[0.3em]">{badge.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
