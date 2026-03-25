// Aligned with ExpertVakeel Lead Data Requirements & Service Page Documentation
import { useEffect, useState, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import api, { serviceAPI, serviceBookedAPI, publicUserAPI, challanAPI, type User as Advocate } from "../../services/api";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../lib/firebase";
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
  Award,
  Search as SearchIcon,
  ShieldCheck,
  Phone,
  Car,
  ArrowRight,
  ClipboardCheck
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

// City options for dropdown - matches Home page cities
const CITY_OPTIONS = [
  "Chandigarh",
  "Mohali",
  "Panchkula",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Pune"
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
  const [cities, setCities] = useState<string[]>(CITY_OPTIONS);

  // Advocates section
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loadingAdvocates, setLoadingAdvocates] = useState(false);
  const [showAdvocates, setShowAdvocates] = useState(false);
  const advocatesSectionRef = useRef<HTMLElement>(null);

  // LEAD FORM STATE (As per PDF - Minimal Fields)
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formCity, setFormCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"" | "success" | "error">("");
  const [formMessage, setFormMessage] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // OTP State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Traffic Challan specific state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [searchingChallan, setSearchingChallan] = useState(false);  // Results State
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);
  const [isPledged, setIsPledged] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [pledgeRewardPercentage, setPledgeRewardPercentage] = useState(40); // Admin-controllable
  // Fetch pledge reward percentage from admin settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/api/settings/pledgeRewardPercentage");
        if (response.data.success && response.data.data) {
          setPledgeRewardPercentage(Number(response.data.data.value));
        }
      } catch (err) {
        console.log("Using default reward percentage (40%)");
      }
    };
    fetchSettings();
  }, []);

  // Traffic Challan specific state
  const [challanData, setChallanData] = useState<ProcessedChallanData | null>(null);
  const [challanError, setChallanError] = useState<string | null>(null);

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Step state: 1 = Details, 2 = OTP, 3 = Finish
  const [step, setStep] = useState(1);
  const [challanSearchStep, setChallanSearchStep] = useState(1);

  // Check if service is traffic challan related
  const isTrafficChallanService =
    service?.name?.toLowerCase().includes("traffic") ||
    service?.name?.toLowerCase().includes("challan") ||
    service?.categories?.some(
      (cat) =>
        cat.toLowerCase().includes("traffic") ||
        cat.toLowerCase().includes("challan"),
    );

  const generateSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug === 'traffic-challan' ? 'challan' : slug;
  };

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
        let foundService = null;

        // Try to fetch by ID directly first
        try {
          const idResponse = await serviceAPI.getById(id);
          if (idResponse.data.success && idResponse.data.data) {
            foundService = idResponse.data.data;
          }
        } catch (err) {
          // If fetching by ID fails, it might be a slug
          console.log("Not a valid ID, trying slug...");
        }

        // If not found, fetch all and try to match the slug
        if (!foundService) {
          const allServicesResp = await serviceAPI.getAll({ limit: 100 });
          if (allServicesResp.data.success && allServicesResp.data.data) {
            foundService = allServicesResp.data.data.find((s: Service) => generateSlug(s.name) === id);
          }
        }

        if (foundService) {
          setService(foundService);
          // Load advocates for this category
          loadAdvocates(foundService.name);
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

  // Fetch cities from API (similar to home page)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await publicUserAPI.getAll({
          limit: "1000",
        });

        if (response.data && Array.isArray(response.data.data)) {
          // Extract unique cities from users
          const citiesSet = new Set<string>();
          response.data.data.forEach((user: any) => {
            if (user.city) {
              const cleanedCity = user.city.trim();
              if (cleanedCity) {
                citiesSet.add(cleanedCity);
              }
            }
          });

          const finalCities = Array.from(citiesSet).sort();
          if (finalCities.length > 0) {
            setCities(finalCities);
          }
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
        // Keep default cities on error
      }
    };

    fetchCities();
  }, []);

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

      if (response.data && Array.isArray(response.data.data)) {
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

  // Handle click outside city dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    };

    if (cityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cityDropdownOpen]);

  // Filter cities based on search
  const filteredCities = cities.filter((city) => {
    if (!citySearch.trim()) return true;
    const regex = new RegExp(citySearch.trim(), "i");
    return regex.test(city);
  });

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
      // 1. Backend generate-otp
      const response = await api.post("/api/verify/generate-otp", {
        name: formName || "User",
        city: formCity,
        phoneNumber: formMobile,
      });

      if (response.data.verificationId) {
        setVerificationId(response.data.verificationId);
      }

      // 2. MSG91 widget
      if (typeof window.sendOtp === "function") {
        window.sendOtp(
          "91" + formMobile,
          () => {
            setShowOtpInput(true);
            setStep(2);
            setFormStatus("success");
            setFormMessage("OTP sent to your mobile number");
            setSendingOtp(false);
          },
          (err) => {
            console.error("MSG91 sendOtp error:", err);
            setFormStatus("error");
            setFormMessage(err?.message || "MSG91 failed to send OTP.");
            setSendingOtp(false);
          }
        );
      } else {
        setFormStatus("error");
        setFormMessage("OTP Service is not ready. Please refresh the page.");
        setSendingOtp(false);
      }
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setFormStatus("error");
      setFormMessage(err.response?.data?.message || "Failed to send OTP. Please try again.");
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

    if (typeof window.verifyOtp === "function") {
      window.verifyOtp(otp,
        async (data) => {
          try {
            const tokenValue = typeof data === 'string' ? data : data?.message;
            const response = await api.post("/api/verify/verify-msg91-token", {
              token: tokenValue,
              phoneNumber: formMobile,
              name: formName,
              city: formCity
            });

            if (response.data.success) {
              const { token, client, firebaseToken } = response.data;
              localStorage.setItem("token", token);
              localStorage.setItem("client", JSON.stringify(client));
              if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);

              setOtpVerified(true);
              setShowOtpInput(false);
              setVerifyingOtp(false);

              // Now create the lead/booking
              await createLead(client.id);
            } else {
              throw new Error(response.data.message || "Verification failed");
            }
          } catch (err: any) {
            setFormStatus("error");
            setFormMessage(err.response?.data?.message || err.message || "Login failed");
            setVerifyingOtp(false);
          }
        },
        () => {
          setFormStatus("error");
          setFormMessage("Invalid OTP. Please check the code.");
          setVerifyingOtp(false);
        }
      );
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
        setStep(3);

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

  const handlePayment = async (amount: number, challanNumber: string) => {
    try {
      setSearchingChallan(true);
      const name = formName || "User";
      const phone = formMobile || "";
      const city = formCity || "Online";

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
                setShowPaymentSummary(false);
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
      setChallanError("Failed to initiate payment");
    } finally {
      setSearchingChallan(false);
    }
  };

  // Challan Search - MODIFIED TO HANDLE VERIFICATION
  const handleSearchChallan = async () => {
    if (challanSearchStep === 1) {
      if (!vehicleNumber.trim()) {
        setChallanError("Please enter vehicle number");
        return;
      }
      setChallanError(null);
      setChallanSearchStep(2);
      return;
    }

    // Step 2: Handle Contact -> OTP
    if (challanSearchStep === 2) {
      if (!formMobile || !/^[0-9]{10}$/.test(formMobile)) {
        setChallanError("Please enter a valid 10-digit mobile number");
        return;
      }

      setSearchingChallan(true);
      setChallanError(null);
      try {
        const response = await api.post("/api/verify/generate-otp", {
          name: formName || "User",
          city: formCity || "Online",
          phoneNumber: formMobile,
        });

        if (response.data.verificationId) {
          setVerificationId(response.data.verificationId);
        }

        if (typeof window.sendOtp === "function") {
          window.sendOtp(
            "91" + formMobile,
            () => {
              setShowOtpInput(true);
              setChallanError(null);
              setChallanSearchStep(3);
              setSearchingChallan(false);
            },
            (err) => {
              setChallanError(err?.message || "MSG91 failed to send OTP");
              setSearchingChallan(false);
            }
          );
        } else {
          setChallanError("OTP Service not ready");
          setSearchingChallan(false);
        }
      } catch (err: any) {
        setChallanError(err.response?.data?.message || "Failed to send OTP");
        setSearchingChallan(false);
      }
      return;
    }

    // Step 3: Handle OTP -> Results
    if (challanSearchStep === 3) {
      if (!otp || otp.length < 4) {
        setChallanError("Please enter OTP");
        return;
      }

      setSearchingChallan(true);
      if (typeof window.verifyOtp === "function") {
        window.verifyOtp(otp,
          async (data) => {
            try {
              const tokenValue = typeof data === 'string' ? data : data?.message;
              const response = await api.post("/api/verify/verify-msg91-token", {
                token: tokenValue,
                phoneNumber: formMobile,
                name: formName || "User",
                city: formCity || "Online"
              });

              if (response.data.success) {
                const { token, client, firebaseToken } = response.data;
                localStorage.setItem("token", token);
                localStorage.setItem("client", JSON.stringify(client));
                if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);

                setOtpVerified(true);
                setShowOtpInput(false);

                // Proceed to search
                await executeChallanSearch(formMobile);
              } else {
                throw new Error(response.data.message || "Verification failed");
              }
            } catch (err: any) {
              setChallanError(err.response?.data?.message || err.message || "Verification failed");
              setSearchingChallan(false);
            }
          },
          () => {
            setChallanError("Invalid OTP");
            setSearchingChallan(false);
          }
        );
      }
      return;
    }

    // Already verified/completed, just search again if needed
    if (challanSearchStep === 4) {
      await executeChallanSearch(formMobile || localStorage.getItem("phone") || "");
    }
  };

  // Helper to execute search
  const executeChallanSearch = async (phoneNumber: string) => {
    setSearchingChallan(true);
    setChallanError(null);
    setChallanData(null);

    // Bypass for demo vehicle
    if (vehicleNumber.trim().toUpperCase() === "CHALLAN1234") {
      const demoData = {
        vehicleNumber: "CHALLAN1234",
        ownerName: formName || "Demo User",
        pendingChallans: [
          {
            id: "demo-1",
            challanNumber: "CH-DEMO-2024-001",
            date: "2024-03-20 10:30:00",
            location: "Sec 17, Chandigarh",
            violation: "Red Light Jump",
            amount: 1000,
            status: "Pending",
            offences: [{ offence_name: "Red Light Jump", offence_fine: "1000", motor_vehicle_act: "Sec 184" }],
            challanPlace: "Chandigarh",
            accusedName: formName || "Demo User"
          },
          {
            id: "demo-2",
            challanNumber: "CH-DEMO-2024-002",
            date: "2024-03-15 14:45:00",
            location: "Mohali Toll Plaza",
            violation: "Over Speeding",
            amount: 2000,
            status: "Pending",
            offences: [{ offence_name: "Over Speeding", offence_fine: "2000", motor_vehicle_act: "Sec 183" }],
            challanPlace: "Mohali",
            accusedName: formName || "Demo User"
          }
        ],
        totalPending: 3000
      };
      setChallanData(demoData);
      setSelectedChallanIds(demoData.pendingChallans.map(c => c.challanNumber));
      setChallanSearchStep(4);
      setSearchingChallan(false);
      return;
    }

    try {
      const response = await challanAPI.search(
        vehicleNumber.toUpperCase(),
        `${phoneNumber}@expertvakeel.com`,
        phoneNumber
      );

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

        const newChallanData = {
          vehicleNumber: vehicleNumber.toUpperCase(),
          ownerName: challanPayload.data[0]?.accusedName || "Not Available",
          pendingChallans: processedChallans,
          totalPending,
        };
        setChallanData(newChallanData);
        setSelectedChallanIds(newChallanData.pendingChallans.map(c => c.challanNumber));

        if (pendingChallans.length === 0) {
          setChallanError(`No pending challans found for ${vehicleNumber.toUpperCase()}`);
          setChallanSearchStep(1);
        } else {
          setChallanSearchStep(4);
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

          {/* Left Side - Traffic Challan Check OR Service Info (order-1 for mobile to show at top) */}
          <div className="w-full lg:w-3/5 order-1 lg:order-1 space-y-6">

            {/* Traffic Challan Check (Conditional) */}
            {isTrafficChallanService && (
              <div className="bg-white rounded-xl shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
                {/* Visual Stepper */}
                <div className="px-8 pt-10 pb-8 bg-gray-50/30 border-b border-gray-100">
                  <div className="flex items-center justify-between relative max-w-[280px] mx-auto">
                    <div className="absolute top-[18px] left-0 w-full h-[2px] bg-gray-200 rounded-full" />
                    <div
                      className="absolute top-[18px] left-0 h-[2px] bg-[#FFA800] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${((challanSearchStep - 1) / 3) * 100}%` }}
                    />

                    {[
                      { s: 1, label: "Vehicle", icon: Car },
                      { s: 2, label: "Contact", icon: User },
                      { s: 3, label: "Verify", icon: ShieldCheck },
                      { s: 4, label: "Results", icon: ClipboardCheck }
                    ].map((item) => (
                      <div key={item.s} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 transform ${challanSearchStep === item.s
                          ? "bg-[#FFA800] text-white shadow-lg shadow-orange-200 scale-110"
                          : challanSearchStep > item.s
                            ? "bg-[#FFA800] text-white"
                            : "bg-white border-2 border-gray-100 text-gray-300"
                          }`}>
                          {challanSearchStep > item.s ? <Check className="w-4 h-4 stroke-[3]" /> : <item.icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-[7px] font-black uppercase tracking-widest mt-1.5 transition-colors ${challanSearchStep >= item.s ? "text-[#FFA800]" : "text-gray-300"
                          }`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-black text-gray-900 leading-tight">
                      Check Your <span className="text-[#FFA800]">Challan Status</span>
                    </h2>
                    <p className="mt-1 text-xs font-medium text-gray-400">
                      {challanSearchStep === 1 ? "Start by entering vehicle number" :
                        challanSearchStep === 2 ? "Provide your contact information" :
                          challanSearchStep === 3 ? "Verify identity via OTP" : "View your latest records"}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {challanSearchStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="relative group">
                          <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors" />
                          <input
                            type="text"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                            placeholder="Vehicle / DL Number"
                            className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white transition-all font-bold text-gray-900 uppercase placeholder:normal-case placeholder:font-medium text-sm"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={handleSearchChallan}
                          className="w-full h-14 bg-[#1a365d] text-white rounded-2xl text-[16px] font-black shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          Continue <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {challanSearchStep === 2 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA800] transition-colors" />
                          <input
                            type="tel"
                            value={formMobile}
                            onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="Mobile Number"
                            maxLength={10}
                            className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white transition-all font-bold text-gray-900 text-sm"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setChallanSearchStep(1)} className="w-1/3 h-14 bg-gray-50 text-gray-400 font-bold rounded-2xl text-xs uppercase tracking-widest">Back</button>
                          <button
                            onClick={handleSearchChallan}
                            disabled={searchingChallan}
                            className="w-2/3 h-14 bg-[#FFA800] text-white rounded-2xl text-[16px] font-black shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            {searchingChallan ? <Loader className="w-5 h-5 animate-spin" /> : "Get OTP"}
                          </button>
                        </div>
                      </div>
                    )}

                    {challanSearchStep === 3 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-500">Sent to +91 {formMobile}</p>
                        </div>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="0 0 0 0 0 0"
                          maxLength={6}
                          className="w-full h-16 text-center bg-gray-50 border-none rounded-2xl outline-none text-2xl font-black tracking-[0.4em] focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white placeholder:tracking-normal placeholder:text-gray-200"
                        />
                        <div className="space-y-3">
                          <button
                            onClick={handleSearchChallan}
                            disabled={searchingChallan || otp.length < 6}
                            className="w-full h-14 bg-gray-900 text-white rounded-2xl text-[16px] font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {searchingChallan ? <Loader className="w-5 h-5 animate-spin" /> : "Verify & Check"}
                          </button>
                          <button onClick={() => setChallanSearchStep(2)} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900">Change Number</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {challanError && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-[11px] font-bold flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{challanError}</span>
                    </div>
                  )}
                </div>

                {/* Challan Results */}
                {challanData ? (
                  <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-gradient-to-br from-[#1a365d] to-[#0f172a] rounded-xl p-8 text-white shadow-2xl shadow-blue-900/20">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest">Registered Owner</p>
                          <h4 className="text-xl font-black">{challanData.ownerName}</h4>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-0.5">Vehicle</p>
                          <p className="font-mono font-bold text-sm tracking-widest">{challanData.vehicleNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Detailed Offenses</h4>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedChallanIds.length === challanData.pendingChallans.length) {
                              setSelectedChallanIds([]);
                            } else {
                              setSelectedChallanIds(challanData.pendingChallans.map(c => c.challanNumber));
                            }
                          }}
                          className="text-[10px] font-black text-[#1a365d] uppercase tracking-widest hover:underline"
                        >
                          {selectedChallanIds.length === challanData.pendingChallans.length ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      {challanData.pendingChallans.length > 0 ? (
                        <div className="space-y-4">
                          {challanData.pendingChallans.map((c, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSelectedChallanIds(prev =>
                                  prev.includes(c.challanNumber)
                                    ? prev.filter(id => id !== c.challanNumber)
                                    : [...prev, c.challanNumber]
                                );
                              }}
                              className={`group relative bg-white border rounded-xl p-6 transition-all duration-300 cursor-pointer ${selectedChallanIds.includes(c.challanNumber) ? "border-blue-500 shadow-xl shadow-blue-500/5 ring-4 ring-blue-50" : "border-gray-100 hover:shadow-lg hover:shadow-blue-900/5"}`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedChallanIds.includes(c.challanNumber) ? "bg-blue-500 border-blue-500 text-white" : "border-gray-200 bg-white"}`}>
                                    {selectedChallanIds.includes(c.challanNumber) && <Check className="w-4 h-4 stroke-[4]" />}
                                  </div>
                                  <div className="bg-gray-50 px-3 py-1.5 rounded-3xl border border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-500 font-mono tracking-wider">{c.challanNumber}</span>
                                  </div>
                                </div>
                                <span className="text-xl font-black text-red-600">₹{c.amount}</span>
                              </div>
                              <h4 className="font-extrabold text-gray-900 text-sm mb-3 leading-tight uppercase tracking-tight">{c.violation}</h4>
                              <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> {c.date}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                  <MapPin className="w-3.5 h-3.5 text-orange-500" /> {c.location}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        ) : null}
                      </div>

                    {/* Pledge Reward Card In-List */}
                    {challanData.pendingChallans && challanData.pendingChallans.length > 0 && selectedChallanIds.length > 0 && (
                      <div className="mt-8 animate-in zoom-in duration-500 translate-y-2">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 rounded-xl overflow-hidden shadow-lg shadow-amber-200/20">
                          <div className="bg-amber-100/50 px-6 py-4 flex justify-between items-center border-b border-amber-100">
                            <span className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Pledge & Claim Rewards</span>
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-amber-600 shadow-sm">
                              <Star className="w-5 h-5 fill-current" />
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-3xl font-black text-gray-900">₹{challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0).toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total amount selected</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowPaymentSummary(true)}
                                className="px-8 h-14 bg-[#0097B2] hover:bg-[#00ADC8] text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-cyan-100 transition-all active:scale-95 whitespace-nowrap"
                              >
                                Proceed To Pay <ArrowRight size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  ) : null}
                </div>
              )}

            {/* Get Expert Help Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1a365d]" />
                {isTrafficChallanService ? "Get Expert Help for Challan Issues" : `We Assist With`}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-3xl border border-gray-50 bg-gray-50/30 hover:bg-blue-50/50 transition-colors">
                    <div className="bg-green-100/80 text-green-600 p-1 rounded-full shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-gray-700 font-bold leading-tight">{cat}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-green-50/50 border border-green-100 rounded-3xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-200 shrink-0">
                      <FaWhatsapp size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-0.5">Direct Help</p>
                      <p className="text-base font-black text-gray-900">WhatsApp Expert</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/919968739968?text=I%20need%20expert%20help%20with%20${encodeURIComponent(service.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-3xl shadow-lg shadow-green-100 hover:bg-green-600 transition-all text-center flex items-center justify-center gap-2"
                  >
                    Chat Now <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
            {/* Trust Badges - To fill the gap and build credibility */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 mt-8">
              {[
                { title: "Private", desc: "100% Confidential", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
                { title: "Verified", desc: "Expert Lawyers", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
                { title: "Fast", desc: "Quick Response", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                { title: "Support", desc: "End-to-End Help", icon: HelpCircle, color: "text-purple-600", bg: "bg-purple-50" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-1">
                  <div className={`${item.bg} ${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-sm`}>
                    <item.icon size={20} />
                  </div>
                  <h4 className="text-[11px] font-black text-gray-900 mb-0.5 uppercase tracking-tighter">{item.title}</h4>
                  <p className="text-[9px] font-bold text-gray-400 leading-none">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* How It Works - Moved here to fill gap as requested */}
            <div className="mt-8 bg-gradient-to-br from-[#1a365d] to-[#2d4a7c] rounded-xl p-6 text-white shadow-xl shadow-blue-900/10">
              <h2 className="text-lg font-black mb-6 text-center">How It Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { num: 1, title: "Submit", desc: "Fill form & OTP" },
                  { num: 2, title: "Guidance", desc: "Experts contact you" },
                  { num: 3, title: "Support", desc: "Get resolution" }
                ].map((step) => (
                  <div key={step.num} className="text-center">
                    <div className="w-10 h-10 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-3 text-sm font-black border border-white/10 group-hover:bg-white group-hover:text-[#1a365d] transition-all">
                      {step.num}
                    </div>
                    <h3 className="font-bold text-xs mb-1">{step.title}</h3>
                    <p className="text-blue-100 text-[9px] leading-tight opacity-80">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Card - Strategic Priority (order-2 for mobile to show after challan) */}
          <div className="w-full lg:w-2/5 order-2 lg:order-2">

            {/* Visual Stepper for Lead Form */}
            <div className="mb-6 px-2">
              <div className="flex items-center justify-between relative max-w-[280px] mx-auto">
                {/* Connector Background */}
                <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-200 rounded-full" />
                {/* Connector Active */}
                <div
                  className="absolute top-4 left-0 h-[2px] bg-[#FFA800] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />

                {[
                  { s: 1, label: "Details", icon: User },
                  { s: 2, label: "Verify", icon: ShieldCheck },
                  { s: 3, label: "Finish", icon: CheckCircle2 }
                ].map((item) => (
                  <div key={item.s} className="relative z-10 flex flex-col items-center group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 transform ${step === item.s
                      ? "bg-[#FFA800] text-white shadow-lg shadow-orange-200 scale-110"
                      : step > item.s
                        ? "bg-[#FFA800] text-white"
                        : "bg-white border-2 border-gray-100 text-gray-300"
                      }`}>
                      {step > item.s ? <Check className="w-4 h-4 stroke-[3]" /> : <item.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-widest mt-1.5 transition-colors ${step >= item.s ? "text-[#FFA800]" : "text-gray-300"
                      }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div id="lead-form" className={`bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden sticky top-24 transition-all duration-500 ${formStatus === "success" && step === 3 ? "scale-105 shadow-green-100 border-green-200" : ""}`}>
              <div className="bg-[#1a365d] p-5 text-white text-center">
                <h3 className="font-bold text-lg">
                  {step === 1 ? "Book Professional Help" : step === 2 ? "Verify Identity" : "Success!"}
                </h3>
                <p className="text-xs text-blue-100/80 mt-1">
                  {step === 1 ? "Fill details to get verified legal support" : step === 2 ? "Enter the 6-digit code sent to you" : "Your request is being processed"}
                </p>
              </div>

              <div className="p-6 space-y-5">
                {step < 3 && formStatus === "error" && formMessage && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-3xl text-xs font-semibold flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formMessage}
                  </div>
                )}

                {/* Step 1: Input Details */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    {/* Name Input */}
                    <div className="space-y-1.5 group">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FFA800] transition-colors" />
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full bg-gray-50 border-none rounded-3xl px-11 py-3.5 outline-none focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white transition-all text-sm font-bold text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1.5 group">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FFA800] transition-colors" />
                        <input
                          type="tel"
                          value={formMobile}
                          onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className="w-full bg-gray-50 border-none rounded-3xl px-11 py-3.5 outline-none focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white transition-all text-sm font-bold text-gray-800"
                        />
                      </div>
                    </div>

                    {/* City Dropdown */}
                    <div ref={cityDropdownRef} className="relative space-y-1.5 group">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City *</label>
                      <button
                        type="button"
                        onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                        className="w-full bg-gray-50 border-none rounded-3xl px-11 py-3.5 outline-none focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white transition-all text-sm font-bold text-gray-800 text-left flex items-center justify-between group"
                      >
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FFA800]" />
                        <span className={formCity ? "text-gray-900" : "text-gray-400 font-medium"}>
                          {formCity || "Select City"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {cityDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-3 border-b border-gray-50">
                            <div className="relative">
                              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={citySearch}
                                onChange={(e) => setCitySearch(e.target.value)}
                                placeholder="Search City"
                                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-none rounded-3xl outline-none focus:ring-2 focus:ring-[#FFA800]/20"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-52 overflow-y-auto">
                            {filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => { setFormCity(city); setCityDropdownOpen(false); setCitySearch(""); }}
                                className={`w-full text-left px-5 py-3 text-sm font-bold transition-all ${formCity === city ? "bg-orange-50 text-[#FFA800]" : "text-gray-600 hover:bg-gray-50 hover:pl-6"}`}
                              >
                                {city}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Problem Description */}
                    <div className="space-y-1.5 group">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (optional)</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400 group-focus-within:text-[#FFA800] transition-colors" />
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value.slice(0, 300))}
                          placeholder="Describe your issue..."
                          className="w-full bg-gray-50 border-none rounded-3xl px-11 py-3.5 outline-none focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white transition-all text-sm font-bold text-gray-800 h-24 resize-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSendOtp}
                      disabled={sendingOtp || formSubmitting}
                      className="w-full bg-[#c53030] hover:bg-[#a12525] text-white font-black py-4 rounded-3xl shadow-xl shadow-red-900/10 transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {sendingOtp ? <Loader className="w-5 h-5 animate-spin" /> : <>{getCtaText(service.name)} <ChevronRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-600">Enter the 6-digit OTP sent to</p>
                      <p className="text-sm font-black text-gray-900 mt-0.5">+91 {formMobile}</p>
                    </div>

                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="0 0 0 0 0 0"
                      maxLength={6}
                      className="w-full h-16 text-center bg-gray-50 border-none rounded-3xl outline-none text-2xl font-black tracking-[0.4em] focus:ring-4 focus:ring-[#FFA800]/5 focus:bg-white placeholder:tracking-normal placeholder:text-gray-200"
                    />

                    <div className="space-y-3">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otp.length < 6}
                        className="w-full bg-[#1a365d] text-white font-black py-4 rounded-3xl shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-widest"
                      >
                        {verifyingOtp ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Verify Identity"}
                      </button>
                      <div className="flex justify-between items-center px-2">
                        <button onClick={() => setStep(1)} className="text-[10px] font-bold text-gray-400 hover:text-gray-800 uppercase tracking-wider">Change Details</button>
                        <button onClick={handleSendOtp} className="text-[10px] font-bold text-gray-400 hover:text-gray-800 uppercase tracking-wider">Resend OTP</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                  <div className="py-8 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">Request Received!</h4>
                    <p className="text-sm font-medium text-gray-500 px-4 leading-relaxed">
                      Thank you, <span className="text-gray-900 font-bold">{formName}</span>.
                      Our legal expert for <span className="text-gray-900 font-bold">{service.name}</span> will contact you shortly on <span className="text-gray-900 font-bold">{formMobile}</span>.
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="mt-8 text-xs font-black text-[#FFA800] uppercase tracking-widest hover:underline"
                    >
                      Book Another Service
                    </button>
                  </div>
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
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
      
      {/* PRO-PAYMENT MODAL / SUMMARY VIEW */}
      {showPaymentSummary && challanData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto pt-16 md:pt-36 pb-10">
          <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-md" onClick={() => setShowPaymentSummary(false)} />

          <div className="relative w-full max-w-4xl bg-[#F0F4F8] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            {/* Header */}
            <div className="bg-white px-8 py-8 flex items-center justify-between border-b border-gray-100">
              <button onClick={() => setShowPaymentSummary(false)} className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors">
                <ArrowLeft size={14} strokeWidth={3} /> Payment Summary
              </button>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-3xl border border-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
                  <Car size={16} strokeWidth={3} />
                </div>
                <span className="font-mono font-black text-gray-900 tracking-widest text-xs">{vehicleNumber}</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Left Side: Options */}
              <div className="flex-1 p-6 lg:p-12 space-y-6 lg:space-y-10">
                <div className="space-y-2">
                  <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight">Final Settlement</h3>
                  <p className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Select your method</p>
                </div>

                <div className="space-y-4 lg:space-y-8 animate-in slide-in-from-left-4 duration-500">
                    <div
                      onClick={() => setIsPledged(!isPledged)}
                      className={`group relative overflow-hidden rounded-xl p-6 lg:p-8 border-2 transition-all duration-500 cursor-pointer ${isPledged ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 shadow-2xl shadow-green-200" : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5"}`}
                    >
                      {/* Background Micro-elements */}
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                      <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-black/5 rounded-full blur-2xl" />

                      <div className="relative z-10 flex items-start justify-between">
                        <div className="space-y-4">
                          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500 ${isPledged ? "bg-white/20 text-white rotate-12 scale-110" : "bg-blue-50 text-blue-600"}`}>
                            <ShieldCheck size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className={`text-xl font-black mb-1 transition-colors ${isPledged ? "text-white" : "text-gray-900"}`}>Pledge to Drive Safely</h4>
                            <p className={`text-xs font-bold leading-relaxed transition-colors ${isPledged ? "text-green-50" : "text-gray-500"}`}>Commit to zero traffic violations for 1 year<br />and unlock instant settlement rewards.</p>
                          </div>
                        </div>

                        <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${isPledged ? "translate-x-0 opacity-100" : "translate-x-4 opacity-70"}`}>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isPledged ? "bg-white border-white text-green-600" : "border-gray-200"}`}>
                            {isPledged && <Check size={18} strokeWidth={4} />}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isPledged ? "text-white" : "text-gray-400"}`}>{isPledged ? "Applied!" : "Claim"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 lg:gap-4">
                      {["Instant Benefit", "Court-Free", "Clean Record"].map((perk, i) => (
                        <div key={i} className="bg-white/60 backdrop-blur-sm p-3 lg:p-4 rounded-xl border border-white flex flex-col items-center text-center gap-1.5 lg:gap-2">
                          <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-blue-500" />
                          <span className="text-[8px] lg:text-[9px] font-black text-gray-500 uppercase tracking-wider lg:tracking-widest leading-none">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Right Side: Checkout Summary */}
              <div className="w-full lg:w-[420px] bg-white lg:border-l border-gray-100 p-6 lg:p-12 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
                <div className="flex-1">
                  <h4 className="text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 lg:mb-10 flex items-center justify-between">
                    Review Settlement
                    <span className="text-[8px] lg:text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{selectedChallanIds.length} ITEMS</span>
                  </h4>

                  <div className="space-y-4 lg:space-y-6 mb-8 lg:mb-12">
                    <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-black text-sm uppercase tracking-tighter">Online Challan</span>
                      </div>
                      <span className="text-gray-900 font-black text-lg">₹{challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-black text-sm uppercase tracking-tighter">Convenience Fee</span>
                      <span className="text-gray-900 font-black text-lg">₹{(selectedChallanIds.length * 200).toLocaleString()}</span>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-gray-900 font-black uppercase tracking-[0.2em] text-[10px]">Total Selection</span>
                      <span className="text-gray-900 font-black text-2xl">₹{(
                        challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0) +
                        (selectedChallanIds.length * 200)
                      ).toLocaleString()}</span>
                    </div>

                    {isPledged && (
                      <div className="pt-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center text-blue-600 font-black py-5 px-6 bg-blue-50/80 rounded-xl border border-blue-100 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-100 rotate-45 translate-x-6 -translate-y-6 transition-transform group-hover:scale-150" />
                          <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-widest mb-1 opacity-60">Pledge Reward</p>
                            <p className="text-2xl font-black">-₹{(challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0) * (pledgeRewardPercentage / 100)).toLocaleString()}</p>
                          </div>
                          <Star className="w-8 h-8 opacity-10 absolute left-4 top-1/2 -translate-y-1/2 rotate-12" />
                        </div>
                        <div className="mt-4 flex items-center gap-3 px-5 py-4 bg-green-50 rounded-xl border border-green-100 shadow-sm shadow-green-900/5">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-200 shrink-0">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                          <p className="text-[11px] font-black text-green-700 leading-tight uppercase">YOU SAVED ₹{(challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0) * (pledgeRewardPercentage / 100)).toLocaleString()} BY PLEDGING!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Final Payment</span>
                      <span className="text-4xl font-black text-gray-900">₹{(
                        (
                          challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0) +
                          (selectedChallanIds.length * 200)
                        ) - (isPledged ? (challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0) * (pledgeRewardPercentage / 100)) : 0)
                      ).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Tax Inclusive</p>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Instant Receipt</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const totalSelectionAmount = challanData.pendingChallans.filter(c => selectedChallanIds.includes(c.challanNumber)).reduce((sum, c) => sum + c.amount, 0);
                      const fees = selectedChallanIds.length * 200;
                      const reward = isPledged ? (totalSelectionAmount * (pledgeRewardPercentage / 100)) : 0;
                      const finalTotal = (totalSelectionAmount + fees) - reward;
                      handlePayment(finalTotal, selectedChallanIds.join(', '));
                    }}
                    className="w-full h-18 bg-[#0097B2] hover:bg-[#00ADC8] text-white rounded-[28px] text-[20px] font-black shadow-2xl shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
                  >
                    Proceed To Pay <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" strokeWidth={3} />
                  </button>

                  <div className="flex items-center justify-center gap-6 pt-2">
                    <div className="flex flex-col items-center gap-1 opacity-30">
                      <ShieldCheck size={14} />
                      <span className="text-[7px] font-black uppercase tracking-widest">Secure</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-30">
                      <CheckCircle2 size={14} />
                      <span className="text-[7px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-30">
                      <User size={14} />
                      <span className="text-[7px] font-black uppercase tracking-widest">Private</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
