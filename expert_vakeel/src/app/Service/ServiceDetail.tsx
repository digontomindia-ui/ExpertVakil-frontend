// src/app/Service/ServiceDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { serviceAPI, serviceBookedAPI } from "../../services/api";
import { useUser } from "../../context/UserContext";
import {
  ArrowLeft,
  Loader,
  Check,
  AlertCircle,
  Phone,
  FileText,
  Calendar,
  Shield,
  Clock,
  Search,
  Car,
  Mail,
  User,
  HomeIcon,
  IndianRupee,
  MapPin,
  Hash,
  CalendarDays,
  UserCircle,
  ChevronRight,
  ShieldAlert,
  Gavel,
  ScrollText,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

// Types
interface Service {
  id: string;
  name: string;
  description: string;
  categories: string[];
  number?: string;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  token?: string;
  firebaseToken?: string;
  clientId?: string;
  client?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
  };
}

// Challan data interface based on API response
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

// Helper to determine background image
const getServiceBackground = (service: Service | null) => {
  if (!service) return "/assets/hero_banner.png";
  const text = (service.name + " " + service.categories.join(" ")).toLowerCase();

  if (text.includes("traffic") || text.includes("challan")) return "/assets/hero_images/traffic.png";
  if (text.includes("family") || text.includes("divorce") || text.includes("custody")) return "/assets/hero_images/family.png";
  if (text.includes("criminal") || text.includes("defense") || text.includes("bail")) return "/assets/hero_images/criminal.png";
  if (text.includes("property") || text.includes("real estate")) return "/assets/hero_images/property.png";
  if (text.includes("document") || text.includes("drafting") || text.includes("affidavit")) return "/assets/hero_images/docs.png";
  if (text.includes("registration") || text.includes("company") || text.includes("trademark")) return "/assets/hero_images/registration.png";

  return "/assets/hero_banner.png";
};

// Reusable styling components matching premium design
const FormInput = ({
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  maxLength
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon?: any;
  type?: string;
  maxLength?: number;
}) => (
  <div className="relative mb-3">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      {Icon && <Icon className="w-4 h-4" />}
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500 font-medium text-sm"
    />
  </div>
);

const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wide disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);


export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"" | "success" | "error">("");
  const [bookingMessage, setBookingMessage] = useState("");

  // Traffic Challan specific state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [searchingChallan, setSearchingChallan] = useState(false);
  const [challanData, setChallanData] = useState<ProcessedChallanData | null>(null);
  const [challanError, setChallanError] = useState<string | null>(null);

  // User registration form state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCity, setUserCity] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [clientId, setClientId] = useState<string>("");

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

  // Check if user is already registered/logged in
  useEffect(() => {
    if (user) {
      setIsRegistered(true);
      setClientId(user.id || user._id || "");
    }
  }, [user]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleBookNow = () => {
    if (!user && !isRegistered) {
      if (isTrafficChallanService) {
        setShowRegistrationForm(true);
        return;
      }
      navigate("/login");
      return;
    }
    setShowBookingForm(true);
    setDescription(service?.description || "");
  };

  const handleSubmitBooking = async () => {
    const bookingClientId = clientId || user?.id || user?._id;

    if (!bookingClientId || !service) {
      setBookingStatus("error");
      setBookingMessage("Please complete registration first");
      return;
    }

    if (!phoneNumber.trim()) {
      setBookingStatus("error");
      setBookingMessage("Please enter a phone number");
      return;
    }

    if (selectedCategories.length === 0) {
      setBookingStatus("error");
      setBookingMessage("Please select at least one service");
      return;
    }

    setBooking(true);
    setBookingStatus("");

    try {
      const response = await serviceBookedAPI.create({
        clientId: bookingClientId,
        phoneNumber: phoneNumber.trim(),
        title: service.name,
        description: description.trim() || service.description,
        servicesBooked: selectedCategories,
      });

      if (response.data.success) {
        setBookingStatus("success");
        setBookingMessage("Booking successful! Redirecting to WhatsApp...");

        const targetNumber = service.number
          ? service.number.replace(/\D/g, "")
          : "919711840150";
        const message = encodeURIComponent(
          `Hi, I just booked *${service.name}*.\n\n*My Details:*\nPhone: ${phoneNumber}\nServices: ${selectedCategories.join(", ")}\nNote: ${description}`,
        );
        const whatsappUrl = `https://wa.me/${targetNumber}?text=${message}`;

        window.open(whatsappUrl, "_blank");

        setTimeout(() => {
          if (isRegistered && !user) {
            navigate("/");
          } else {
            navigate("/my-bookings");
          }
        }, 3000);
      } else {
        throw new Error("Failed to book service");
      }
    } catch (err) {
      console.error("Error booking service:", err);
      setBookingStatus("error");
      setBookingMessage("Failed to book service. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const getUserContactDetails = () => {
    if (user?.email && user?.phone) {
      return { email: user.email, phone: user.phone };
    }
    if (userEmail && userPhone) {
      return { email: userEmail, phone: userPhone };
    }
    return {
      email: localStorage.getItem("email") || "",
      phone: localStorage.getItem("phone") || "",
    };
  };

  const handleSearchChallan = () => {
    if (!vehicleNumber.trim()) {
      setChallanError("Please enter vehicle number");
      return;
    }
    if (user || isRegistered) {
      searchChallan();
    } else {
      setShowRegistrationForm(true);
    }
  };

  const searchChallan = async () => {
    setSearchingChallan(true);
    setChallanError(null);
    setChallanData(null);

    try {
      const { email, phone } = getUserContactDetails();
      if (!email || !phone) {
        throw new Error("User contact details missing. Please register first.");
      }

      const response = await api.post("/api/challan/search", {
        rcNumber: vehicleNumber.toUpperCase(),
        email,
        phone,
      });

      const apiResponse = response.data;
      const challanPayload = apiResponse.data;

      if (challanPayload.statusCode === 200 && Array.isArray(challanPayload.data)) {
        const pendingChallans = challanPayload.data.filter(
          (c: ChallanItem) => c.challanStatus.toLowerCase() === "pending",
        );

        if (pendingChallans.length === 0) {
          setChallanData({
            vehicleNumber: vehicleNumber.toUpperCase(),
            ownerName: challanPayload.data[0]?.accusedName || "Not Available",
            pendingChallans: [],
            totalPending: 0,
          });
          setChallanError(`No pending challans found for vehicle ${vehicleNumber.toUpperCase()}.`);
        } else {
          const processedChallans = pendingChallans.map(
            (challan: ChallanItem) => ({
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
            }),
          );

          const totalPending = processedChallans.reduce(
            (sum: number, c: { amount: number }) => sum + c.amount,
            0,
          );

          setChallanData({
            vehicleNumber: vehicleNumber.toUpperCase(),
            ownerName: pendingChallans[0]?.accusedName || "Not Available",
            pendingChallans: processedChallans,
            totalPending,
          });
        }
      } else {
        throw new Error(challanPayload.message || apiResponse.message || "No challan data found");
      }
    } catch (err: any) {
      console.error("Error fetching challan:", err);
      setChallanError(err.response?.data?.message || err.message || "Unable to fetch challan details.");
    } finally {
      setSearchingChallan(false);
    }
  };

  const handleRegisterUser = async () => {
    if (!userName.trim()) return setRegistrationError("Please enter your name");
    if (!userEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) return setRegistrationError("Please enter valid email");
    if (!userCity.trim()) return setRegistrationError("Please enter your City");
    if (!userPhone.trim() || !/^[0-9]{10}$/.test(userPhone)) return setRegistrationError("Please enter valid 10-digit phone");

    setRegistering(true);
    setRegistrationError(null);

    try {
      const response = await api.post("/api/verify/register", {
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        city: userCity.trim(),
        phoneNumber: userPhone.trim(),
      });

      const data: VerificationResponse = response.data;

      if (data.success) {
        setIsRegistered(true);
        setRegistrationSuccess(true);
        setShowRegistrationForm(false);
        localStorage.setItem("email", userEmail);
        localStorage.setItem("phone", userPhone);
        if (data.token) localStorage.setItem("token", data.token);
        if (data.firebaseToken) localStorage.setItem("firebaseToken", data.firebaseToken);
        if (data.clientId) {
          setClientId(data.clientId);
          localStorage.setItem("clientId", data.clientId);
        }
        setRegistrationError("Registration successful!");
        if (vehicleNumber.trim()) setTimeout(() => searchChallan(), 1000);
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (err: any) {
      setRegistrationError(err.response?.data?.message || "Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  if (error || !service) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Service Not Found</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={() => navigate("/services")} className="px-6 py-2 bg-black text-white rounded-full">Back to Services</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Premium Hero Section */}
      <section className="relative w-full py-16 md:py-24 flex items-center justify-center p-4 overflow-hidden shadow-sm">
        {/* Background */}
        <div className="absolute inset-0 z-0 h-full">
          <img
            src={getServiceBackground(service)}
            alt={service.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-screen-xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-white">
            <button
              onClick={() => navigate("/services")}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </button>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md leading-tight">
              {service.name}
            </h1>
            <p className="text-gray-200 text-lg leading-relaxed max-w-2xl font-light">
              {service.description}
            </p>
          </div>

          {/* Booking/Contact Card Overlay */}
          <div className="w-full md:w-[400px]">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Need Assistance?</h3>
              <p className="text-sm text-gray-500 mb-6">Expert legal help is just a click away.</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600" /> Verified Lawyers
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600" /> Fast Response
                </div>
              </div>

              <div className="mt-6">
                <PrimaryButton className="bg-blue-900 hover:bg-blue-800" onClick={handleBookNow}>
                  Book Consultation
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 py-12 -mt-8">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Left Column: Details & Specialized Features */}
          <div className="md:col-span-2 space-y-8">

            {/* Traffic Challan Check (Conditional) */}
            {isTrafficChallanService && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                  <Car className="w-6 h-6 text-blue-600" />
                  Check Pending Challans
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="Enter Vehicle Number (e.g. DL1CAB1234)"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 uppercase placeholder:font-normal"
                  />
                  <button
                    onClick={handleSearchChallan}
                    disabled={searchingChallan}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {searchingChallan ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>

                {challanError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{challanError}</span>
                  </div>
                )}

                {/* Challan Results */}
                {challanData && (
                  <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vehicle Owner</p>
                          <h3 className="text-xl font-bold">{challanData.ownerName}</h3>
                          <p className="text-blue-300 font-mono mt-1">{challanData.vehicleNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Pending</p>
                          <p className="text-2xl font-bold text-red-400">₹{challanData.totalPending.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {challanData.pendingChallans.length > 0 ? (
                      <div className="space-y-4">
                        {challanData.pendingChallans.map((c, i) => (
                          <div key={i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between mb-3">
                              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold">{c.challanNumber}</span>
                              <span className="text-red-600 font-bold">₹{c.amount}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">{c.violation || "Traffic Violation"}</h4>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {c.date}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h4 className="text-green-800 font-bold">No Pending Challans</h4>
                        <p className="text-green-600 text-sm">Great job keeping your record clean!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )} {/* End Traffic Section */}

            {/* Features / Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">What's Included</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {service.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                    <div className="bg-green-100 text-green-600 p-1.5 rounded-full shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">{cat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Trust Indicators / Info */}
          <div className="space-y-6">
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Why Choose Us?
              </h4>
              <ul className="space-y-3">
                {["Top Rated Lawyers", "Confidential & Secure", "Affordable transparent pricing", "End-to-end support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white text-center">
              <h4 className="font-bold text-lg mb-2">Need Immediate Help?</h4>
              <p className="text-gray-400 text-sm mb-4">Our legal experts are available to guide you.</p>
              <button onClick={handleBookNow} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                Contact Now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- Modals (Registration & Booking) --- */}

      {/* Registration Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-gray-900">Register</h3>
              <button onClick={() => setShowRegistrationForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {registrationSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Registration Complete</h4>
                  <p className="text-gray-500 mt-2">You can now proceed with your request.</p>
                  <button onClick={() => setShowRegistrationForm(false)} className="mt-6 text-blue-600 font-bold text-sm">Close</button>
                </div>
              ) : (
                <>
                  {registrationError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{registrationError}</div>}
                  <FormInput value={userName} onChange={e => setUserName(e.target.value)} placeholder="Full Name" icon={User} />
                  <FormInput value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="Email Address" icon={Mail} />
                  <FormInput value={userCity} onChange={e => setUserCity(e.target.value)} placeholder="City" icon={HomeIcon} />
                  <FormInput value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="Phone Number" icon={Phone} maxLength={10} />

                  <PrimaryButton
                    onClick={handleRegisterUser}
                    disabled={registering}
                    className="bg-blue-600 hover:bg-blue-700 mt-4"
                  >
                    {registering ? "Registering..." : "Register & Continue"}
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Book Consultation</h3>
                <p className="text-sm text-gray-500">{service.name}</p>
              </div>
              <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
              {bookingStatus && (
                <div className={`p-4 rounded-xl text-sm font-medium ${bookingStatus === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {bookingMessage}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                  <FormInput value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="10 Digit Mobile Number" icon={Phone} maxLength={10} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Additional Details</label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Briefly describe your issue..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-[52px] resize-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Required Services <span className="text-red-500">*</span></label>
                <div className="grid sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {service.categories.map((cat, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedCategories.includes(cat) ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCategories.includes(cat) ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"}`}>
                        {selectedCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedCategories.includes(cat) ? "text-blue-900" : "text-gray-600"}`}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
              <button onClick={() => setShowBookingForm(false)} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
              {bookingStatus === "success" ? (
                <button onClick={() => window.open(`https://wa.me/919711840150`, '_blank')} className="flex-1 py-3.5 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> Open WhatsApp
                </button>
              ) : (
                <PrimaryButton onClick={handleSubmitBooking} disabled={booking} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex-1">
                  {booking ? "Processing..." : "Confirm Booking"}
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
