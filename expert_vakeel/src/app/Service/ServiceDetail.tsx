// src/app/Service/ServiceDetail.tsx
// Aligned with ExpertVakeel Lead Data Requirements & Service Page Documentation
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { serviceAPI, serviceBookedAPI, publicUserAPI, type User as Advocate } from "../../services/api";
import {
  ArrowLeft,
  Loader,
  Check,
  AlertCircle,
  User,
  MapPin,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  HelpCircle,
  Star,
  Award
} from "lucide-react";

// Types
interface Service {
  id: string;
  name: string;
  description: string;
  categories: string[];
  number?: string;
}

// Challan data interfaces
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

// City options for dropdown
const CITY_OPTIONS = [
  "Delhi",
  "Noida",
  "Gurugram",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Other"
];

// FAQ data per service type
const getFAQs = (serviceName: string) => {
  const name = serviceName.toLowerCase();

  if (name.includes("traffic") || name.includes("challan")) {
    return [
      { q: "How can I check my pending challans?", a: "Enter your vehicle number above and click 'Check Challan' to view all pending challans." },
      { q: "Can you help dismiss my challan?", a: "Our legal experts can review your case and advise on the best course of action." },
      { q: "Is my information confidential?", a: "Yes, all your information is kept strictly confidential and secure." }
    ];
  }
  if (name.includes("family") || name.includes("divorce")) {
    return [
      { q: "Is the consultation free?", a: "The initial consultation is free. Further charges depend on the complexity of your case." },
      { q: "How long does a divorce process take?", a: "It depends on the type - mutual consent takes 6-18 months, contested may take longer." },
      { q: "Is my information confidential?", a: "Yes, all discussions with our advocates are strictly confidential." }
    ];
  }
  if (name.includes("criminal")) {
    return [
      { q: "Can you help with bail?", a: "Yes, our criminal lawyers specialize in bail applications and can assist immediately." },
      { q: "What if I'm falsely accused?", a: "We provide strong legal defense and help gather evidence to prove your innocence." },
      { q: "Is immediate assistance available?", a: "Yes, we have advocates available for urgent criminal matters." }
    ];
  }
  return [
    { q: "Is the initial consultation free?", a: "Yes, we offer a free initial consultation to understand your legal needs." },
    { q: "How long does the process take?", a: "Timeline varies based on case complexity. Our experts will provide an estimate after review." },
    { q: "Is my information confidential?", a: "Absolutely. All your information is kept strictly confidential and secure." }
  ];
};

// Helper to determine background image
const getServiceBackground = (service: Service | null) => {
  if (!service) return "/assets/hero_banner.png";
  const text = (service.name + " " + service.categories.join(" ")).toLowerCase();

  if (text.includes("traffic") || text.includes("challan")) return "/assets/hero_images/traffic.png";
  if (text.includes("family") || text.includes("divorce") || text.includes("custody") || text.includes("marriage") || text.includes("alimony") || text.includes("maintenance")) return "/assets/hero_images/family.png";
  if (text.includes("criminal") || text.includes("defense") || text.includes("bail")) return "/assets/hero_images/criminal.png";
  if (text.includes("property") || text.includes("real estate") || text.includes("dispute")) return "/assets/hero_images/property.png";
  if (text.includes("document") || text.includes("drafting") || text.includes("affidavit") || text.includes("agreement")) return "/assets/hero_images/docs.png";
  if (text.includes("registration") || text.includes("company") || text.includes("trademark") || text.includes("gst")) return "/assets/hero_images/registration.png";
  if (text.includes("business") || text.includes("corporate") || text.includes("startup")) return "/assets/hero_images/business.png";
  if (text.includes("ask") || text.includes("query") || text.includes("question") || text.includes("consult")) return "/assets/hero_images/ask.png";

  return "/assets/hero_images/ask.png"; // Default to ask lawyer image
};

// Get CTA button text based on service type
const getCtaText = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes("traffic") || name.includes("challan")) return "Get Assistance";
  if (name.includes("family") || name.includes("divorce")) return "Get Legal Advice";
  if (name.includes("criminal") || name.includes("defense")) return "Talk to a Lawyer";
  if (name.includes("property")) return "Get Legal Assistance";
  if (name.includes("document")) return "Get Started";
  if (name.includes("registration")) return "Get Registered";
  if (name.includes("ask")) return "Ask Now";
  return "Get Legal Help";
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Advocates section
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loadingAdvocates, setLoadingAdvocates] = useState(false);
  const [showAdvocates, setShowAdvocates] = useState(false);
  const advocatesSectionRef = useRef<HTMLElement>(null);

  // LEAD FORM STATE (As per PDF - Minimal Fields)
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"" | "success" | "error">("");
  const [formMessage, setFormMessage] = useState("");

  // OTP State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Traffic Challan specific state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [searchingChallan, setSearchingChallan] = useState(false);
  const [challanData, setChallanData] = useState<ProcessedChallanData | null>(null);
  const [challanError, setChallanError] = useState<string | null>(null);

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Check if service is traffic challan related
  const isTrafficChallanService =
    service?.name?.toLowerCase().includes("traffic") ||
    service?.name?.toLowerCase().includes("challan") ||
    service?.categories?.some(
      (cat) =>
        cat.toLowerCase().includes("traffic") ||
        cat.toLowerCase().includes("challan"),
    );

  useEffect(() => {
    const loadService = async () => {
      if (!id) {
        setError("Invalid service ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await serviceAPI.getById(id);

        if (response.data.success && response.data.data) {
          setService(response.data.data);
          // Load advocates for this category
          loadAdvocates(response.data.data.name);
        } else {
          throw new Error("Service not found");
        }
      } catch (err) {
        console.error("Error loading service:", err);
        setError("Unable to load service details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id]);

  // Load advocates based on service category
  const loadAdvocates = async (serviceName: string) => {
    try {
      setLoadingAdvocates(true);
      const category = serviceName.split(' ')[0]; // Basic category extraction
      const response = await publicUserAPI.getAll({
        limit: "6",
        specialization: category,
        city: formCity || "all"
      });

      if (response.data.success) {
        setAdvocates(response.data.data);
      }
    } catch (err) {
      console.error("Error loading advocates:", err);
    } finally {
      setLoadingAdvocates(false);
    }
  };

  // Scroll listener to show advocates only after scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!showAdvocates && window.scrollY > 400) {
        setShowAdvocates(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAdvocates]);

  // Send OTP
  const handleSendOtp = async () => {
    if (!formMobile || !/^[0-9]{10}$/.test(formMobile)) {
      setFormStatus("error");
      setFormMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!formCity) {
      setFormStatus("error");
      setFormMessage("Please select your city");
      return;
    }

    setSendingOtp(true);
    setFormStatus("");
    setFormMessage("");

    try {
      const response = await api.post("/api/verify/generate-otp", {
        name: formName || "User",
        city: formCity,
        phoneNumber: formMobile,
      });

      if (response.data.success) {
        setVerificationId(response.data.verificationId);
        setShowOtpInput(true);
        setFormStatus("success");
        setFormMessage("OTP sent to your mobile number");

        // For testing - show OTP in console
        if (response.data.testOtp) {
          console.log("🔢 Test OTP:", response.data.testOtp);
        }
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setFormStatus("error");
      setFormMessage(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setFormStatus("error");
      setFormMessage("Please enter a valid OTP");
      return;
    }

    setVerifyingOtp(true);
    setFormStatus("");

    try {
      const response = await api.post("/api/verify/verify-otp", {
        verificationId,
        otp,
        phoneNumber: formMobile,
      });

      if (response.data.success) {
        setOtpVerified(true);
        setShowOtpInput(false);

        // Store client info
        if (response.data.clientId) {
          localStorage.setItem("clientId", response.data.clientId);
        }
        localStorage.setItem("phone", formMobile);

        // Now create the lead/booking
        await createLead(response.data.clientId);
      } else {
        throw new Error(response.data.message || "Invalid OTP");
      }
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setFormStatus("error");
      setFormMessage(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Create Lead after OTP verification
  const createLead = async (clientId?: string) => {
    try {
      const response = await serviceBookedAPI.create({
        clientId: clientId || localStorage.getItem("clientId") || "",
        phoneNumber: formMobile,
        title: service?.name || "Legal Service",
        description: formDescription || `Lead from ${service?.name} page - City: ${formCity}`,
        servicesBooked: [service?.name || "General"],
      });

      if (response.data.success) {
        setFormStatus("success");
        setFormMessage("Thank you! Our legal expert will contact you shortly.");

        // Reset form after success
        setTimeout(() => {
          setFormName("");
          setFormMobile("");
          setFormCity("");
          setFormDescription("");
          setOtpVerified(false);
          setShowOtpInput(false);
          setOtp("");
          setVerificationId("");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Error creating lead:", err);
      // Still show success since OTP was verified
      setFormStatus("success");
      setFormMessage("Thank you! Our team will contact you shortly.");
    }
  };

  // Challan Search
  const handleSearchChallan = async () => {
    if (!vehicleNumber.trim()) {
      setChallanError("Please enter vehicle number");
      return;
    }

    const phone = formMobile || localStorage.getItem("phone") || "";
    if (!phone) {
      setChallanError("Please fill the form with your mobile number first");
      return;
    }

    setSearchingChallan(true);
    setChallanError(null);
    setChallanData(null);

    try {
      const response = await api.post("/api/challan/search", {
        rcNumber: vehicleNumber.toUpperCase(),
        email: `${phone}@expertvakeel.com`,
        phone: phone,
      });

      const apiResponse = response.data;
      const challanPayload = apiResponse.data;

      if (challanPayload.statusCode === 200 && Array.isArray(challanPayload.data)) {
        const pendingChallans = challanPayload.data.filter(
          (c: ChallanItem) => c.challanStatus.toLowerCase() === "pending",
        );

        const processedChallans = pendingChallans.map((challan: ChallanItem) => ({
          id: challan.challanId.toString(),
          challanNumber: challan.challanNumber,
          date: challan.challanDate,
          location: challan.challanPlace,
          violation: challan.offences.map((o) => o.offence_name).join(", "),
          amount: parseInt(challan.challanAmount) || 0,
          status: challan.challanStatus,
          offences: challan.offences,
          challanPlace: challan.challanPlace,
          accusedName: challan.accusedName,
        }));

        const totalPending = processedChallans.reduce(
          (sum: number, c: { amount: number }) => sum + c.amount,
          0,
        );

        setChallanData({
          vehicleNumber: vehicleNumber.toUpperCase(),
          ownerName: challanPayload.data[0]?.accusedName || "Not Available",
          pendingChallans: processedChallans,
          totalPending,
        });

        if (pendingChallans.length === 0) {
          setChallanError(`No pending challans found for ${vehicleNumber.toUpperCase()}`);
        }
      } else {
        throw new Error(challanPayload.message || "No challan data found");
      }
    } catch (err: any) {
      console.error("Error fetching challan:", err);
      setChallanError(err.response?.data?.message || err.message || "Unable to fetch challan details.");
    } finally {
      setSearchingChallan(false);
    }
  };

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  // Error state
  if (error || !service) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Service Not Found</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={() => navigate("/services")} className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium">
        Back to Services
      </button>
    </div>
  );

  const faqs = getFAQs(service.name);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col w-full">

      {/* ========== SECTION 1: HERO SECTION ========== */}
      <section className="relative w-full">
        <div className="absolute inset-0 z-0">
          <img
            src={getServiceBackground(service)}
            alt={service.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a365d]/95 via-[#1a365d]/85 to-[#1a365d]/60" />
        </div>

        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 py-12 md:py-20">
          <button
            onClick={() => navigate("/services")}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </button>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight max-w-2xl">
            {service.name}
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-xl leading-relaxed">
            {service.description}
          </p>
        </div>
      </section>

      {/* ========== SECTION 2: PRIMARY ACTION / LEAD FORM ========== */}
      <section className="w-full max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Side - Traffic Challan Check OR Service Info (order-2 for mobile) */}
          <div className="w-full lg:w-3/5 order-2 lg:order-1 space-y-6">

            {/* Traffic Challan Check (Conditional) */}
            {isTrafficChallanService && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Check Your Challan Status</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="Vehicle Number / DL Number"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900 uppercase placeholder:font-normal placeholder:normal-case text-sm"
                  />
                  <button
                    onClick={handleSearchChallan}
                    disabled={searchingChallan}
                    className="bg-[#1a365d] hover:bg-[#2d4a7c] text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                  >
                    {searchingChallan ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Check Challan
                  </button>
                </div>

                {challanError && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{challanError}</span>
                  </div>
                )}

                {/* Challan Results */}
                {challanData && challanData.pendingChallans.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-5 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vehicle Owner</p>
                          <h3 className="text-lg font-bold">{challanData.ownerName}</h3>
                          <p className="text-blue-300 font-mono mt-1">{challanData.vehicleNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Pending</p>
                          <p className="text-xl font-bold text-red-400">₹{challanData.totalPending.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {challanData.pendingChallans.map((c, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between mb-2">
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-semibold">{c.challanNumber}</span>
                            <span className="text-red-600 font-bold">₹{c.amount}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{c.violation || "Traffic Violation"}</h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {c.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {challanData && challanData.pendingChallans.length === 0 && !challanError && (
                  <div className="mt-6 text-center py-6 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <h4 className="text-green-800 font-bold">No Pending Challans</h4>
                    <p className="text-green-600 text-sm">Great job keeping your record clean!</p>
                  </div>
                )}
              </div>
            )}

            {/* Get Expert Help Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {isTrafficChallanService ? "Get Expert Help for Challan Issues" : `We Assist With`}
              </h2>
              <ul className="space-y-3">
                {service.categories.map((cat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <ChevronRight className="w-4 h-4 text-[#c53030] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form Card - Strategic Priority (order-1 for mobile) */}
          <div className="w-full lg:w-2/5 order-1 lg:order-2">
            <div id="lead-form" className={`bg-white rounded-xl shadow-lg border-2 ${formStatus === "success" ? "border-green-500" : "border-[#1a365d]/10"} overflow-hidden sticky top-24`}>
              <div className="bg-[#1a365d] p-4 text-white text-center">
                <h3 className="font-bold">Book Your Professional Assistance</h3>
                <p className="text-xs text-blue-100 mt-1">Fill details to get verified legal support</p>
              </div>

              <div className="p-5 space-y-4">
                {formStatus && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${formStatus === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {formMessage}
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={showOtpInput || otpVerified}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 transition-all"
                  />
                </div>

                {/* Mobile Number + OTP Button */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase ml-1">Mobile Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      disabled={showOtpInput || otpVerified}
                      className="flex-1 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 transition-all"
                    />
                    {otpVerified && (
                      <div className="flex items-center px-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* City Dropdown */}
                <div className="relative space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase ml-1">City *</label>
                  <div className="relative">
                    <select
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      disabled={showOtpInput || otpVerified}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 appearance-none bg-white cursor-pointer disabled:bg-gray-50 transition-all"
                    >
                      <option value="">Select your city</option>
                      {CITY_OPTIONS.map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Legal Category (Auto-filled) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase ml-1">Legal Category</label>
                  <input
                    type="text"
                    value={service.name}
                    disabled
                    className="w-full border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-500 bg-gray-50 font-medium"
                  />
                </div>

                {/* Short Problem Description */}
                {!showOtpInput && !otpVerified && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase ml-1">Short Problem Description (optional)</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value.slice(0, 300))}
                      placeholder="Briefly describe your legal issue (optional)"
                      maxLength={300}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400 resize-none h-20 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 text-right mt-0.5">{formDescription.length}/300 characters</p>
                  </div>
                )}

                {/* OTP Input */}
                {showOtpInput && !otpVerified && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      Enter the OTP sent to {formMobile}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="flex-1 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 text-center tracking-widest font-semibold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otp.length < 6}
                        className="flex-1 bg-[#c53030] hover:bg-[#9b2c2c] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60"
                      >
                        {verifyingOtp ? "Verifying..." : "Verify OTP"}
                      </button>
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button (Send OTP) */}
                {!showOtpInput && !otpVerified && (
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp || formSubmitting}
                    className="w-full bg-[#c53030] hover:bg-[#9b2c2c] text-white font-bold py-3.5 rounded-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                  >
                    {sendingOtp ? "Sending OTP..." : getCtaText(service.name)}
                  </button>
                )}

                {/* Trust Note */}
                <p className="text-xs text-gray-400 text-center">
                  Your information is 100% secure with us
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========== SECTION 3: SERVICE OVERVIEW ========== */}
      <section className="w-full max-w-screen-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1a365d]" />
            We Assist With
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {service.categories.map((cat, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                <div className="bg-green-100 text-green-600 p-1.5 rounded-full shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-gray-700 font-medium text-sm">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: HOW IT WORKS ========== */}
      <section className="w-full max-w-screen-xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] rounded-xl p-6 md:p-8 text-white">
          <h2 className="text-xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: 1, title: "Submit Your Request", desc: "Fill the form with your details and verify via OTP" },
              { num: 2, title: "Get Legal Guidance", desc: "Our experts will review and contact you" },
              { num: 3, title: "Resolution Support", desc: "Receive end-to-end support for your case" }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.num}
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-blue-100 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 5: ADVOCATE PROFILES ========== */}
      <section
        className={`w-full max-w-screen-xl mx-auto px-4 py-8 transition-all duration-700 ${showAdvocates ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Relevant Advocates for This Service
          </h2>
          <p className="text-gray-500 text-sm mb-8">Expert legal professionals specialized in {service.name}</p>

          {loadingAdvocates ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg mt-4" />
                </div>
              ))}
            </div>
          ) : advocates.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {advocates.map((adv) => (
                <div key={adv.id} className="border border-gray-100 rounded-lg p-5 hover:shadow-lg transition-all border-b-4 hover:border-b-[#FFA800]">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-[#f8f9fa] rounded-full flex items-center justify-center border border-gray-100 overflow-hidden">
                      {adv.profilePic ? (
                        <img src={adv.profilePic} alt={adv.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-bold text-gray-900">{adv.fullName}</h4>
                        {adv.isVerify && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {adv.specializations?.[0] || service.name}
                      </p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {adv.yearsOfExperience}+ years experience
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {adv.city || "India"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Scroll to form if user wants consultation but hasn't submitted
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                      setFormMessage("Please fill the form above to connect with this advocate.");
                    }}
                    className="w-full mt-4 py-2.5 bg-white border border-[#1a365d] text-[#1a365d] font-bold rounded-lg hover:bg-[#1a365d] hover:text-white transition-all text-xs"
                  >
                    Request Consultation
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No direct advocates listed for this area yet.</p>
              <p className="text-gray-400 text-xs mt-1">Our central legal team will assist you instead.</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== SECTION 6: FAQ SECTION ========== */}
      <section className="w-full max-w-screen-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#1a365d]" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaqIndex === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 7: DISCLAIMER ========== */}
      <section className="w-full max-w-screen-xl mx-auto px-4 py-8 pb-12">
        <div className="bg-gray-100 rounded-lg p-6 text-center border border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto">
            <strong className="text-gray-700">Disclaimer:</strong> Legal outcomes depend on facts and applicable law. ExpertVakeel does not guarantee results.
          </p>
        </div>
      </section>

    </main>
  );
}
