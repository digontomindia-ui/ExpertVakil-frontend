import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Send,
  ChevronDown,
  User,
  AlertCircle,
  Check,
  Loader,
  MapPin,
  Search,
  Phone
} from "lucide-react";
import api, { queryAPI, clientAPI, publicUserAPI } from "../../services/api";
import type { Query, QueryInput } from "../../services/api";
import { useUser } from "../../context/UserContext";

/* ----------------------------
   Local types for display
-----------------------------*/
type Question = {
  _id: string;
  title: string;
  content: string;
  author: { name: string; city?: string };
  category: string;
  answersCount: number;
  createdAt: string; // ISO string
  askedById?: string; // Add user ID for filtering
};

const SNIPPET_THRESHOLD = 180;

const CATEGORIES = [
  { value: "civil-matters", label: "Civil Matters" },
  { value: "criminal-matters", label: "Criminal Matters" },
  { value: "family-matters", label: "Family Matters" },
  { value: "labour-employee-matters", label: "Labour/Employee Matters" },
  { value: "taxation-matters", label: "Taxation Matters" },
  { value: "documentation-registration", label: "Documentation & Registration" },
  { value: "trademark-copyright-matters", label: "Trademark & Copyright Matters" },
  { value: "high-court-matters", label: "High Court Matters" },
  { value: "supreme-court-matters", label: "Supreme Court Matters" },
  { value: "forums-tribunal-matters", label: "Forums and Tribunal Matters" },
  { value: "business-matters", label: "Business Matters" },
];

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
  "Pune",
];

const MOCK_QUESTIONS: Question[] = Array.from({ length: 9 }).map((_, i) => ({
  _id: String(i + 1),
  title:
    "Can We Take Cases From All Over India? While having registration in One State?",
  content:
    "I think AU Small Finance Bank is giving lowest interest rates right now. You may check all of the details on Paisabazaar.com. Also, consult your bank if they can match the rates.",
  author: { name: "Expert Vakeel Team", city: "New Delhi" },
  category: ["civil-matters", "criminal-matters", "family-matters", "supreme-court-matters", "taxation-matters", "business-matters"][i % 6],
  answersCount: 20 + i,
  createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
}));

/* ----------------------------
   Helpers
-----------------------------*/
function firestoreTsToISO(ts: any): string {
  // Accepts { _seconds: number, _nanoseconds: number } or Date/ISO
  if (ts && typeof ts._seconds === "number") {
    const ms = ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1e6);
    return new Date(ms).toISOString();
  }
  if (typeof ts === "string") return ts;
  try {
    return new Date(ts).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Assign category based on query content keywords
// Category patterns with regex for more accurate matching
const CATEGORY_PATTERNS = {
  "civil-matters": [
    /\b(civil|property|contract|land|dispute|recovery|divorce|family|inheritance|possession|eviction|partition|succession)\b/i,
    /\b(rent|lease|tenancy|tenant|landlord|housing|real estate)\b/i,
    /\b(consumer|consumer rights|defamation|slander|libel)\b/i
  ],
  "criminal-matters": [
    /\b(criminal|theft|murder|fraud|assault|police|bail|arrest|rape|robbery|burglary)\b/i,
    /\b(fir|fir registration|cognizable|non-cognizable|ipc|indian penal code)\b/i,
    /\b(accident|hit and run|drunk driving|negligence|manslaughter)\b/i
  ],
  "family-matters": [
    /\b(divorce|marriage|alimony|child custody|maintenance|domestic violence|dowry)\b/i,
    /\b(adoption|guardianship|child marriage|inter-caste|family court)\b/i,
    /\b(hindu marriage act|muslim marriage|christian marriage|special marriage)\b/i
  ],
  "labour-employee-matters": [
    /\b(labour|employee|work|salary|termination|union|strike|dismissal|firing)\b/i,
    /\b(wages|overtime|bonus|gratuity|provident fund|esic|compensation)\b/i,
    /\b(harassment|workplace|office|employment|job|contract worker)\b/i
  ],
  "taxation-matters": [
    /\b(tax|income tax|gst|vat|service tax|excise|cst|tds|tcs|taxation)\b/i,
    /\b(corporate|company|business|firm|partnership|llp|opc|startup)\b/i,
    /\b(it act|income tax act|company law|roc|din|pan|tan)\b/i
  ],
  "documentation-registration": [
    /\b(documentation|registration|license|permit|certificate|deed|agreement)\b/i,
    /\b(stamp duty|registration fee|property documents|sale deed|gift deed)\b/i,
    /\b(marriage certificate|birth certificate|death certificate|passport)\b/i
  ],
  "trademark-copyright-matters": [
    /\b(trademark|copyright|patent|intellectual property|ipr|brand|logo|design)\b/i,
    /\b(infringement|piracy|counterfeit|royalty|license|assignment)\b/i,
    /\b(geographical indication|gi tag|traditional knowledge)\b/i
  ],
  "high-court-matters": [
    /\b(high court|district court|session court|magistrate|judge|judgment)\b/i,
    /\b(writ petition|pil|public interest litigation|contempt|appeal)\b/i,
    /\b(civil suit|criminal case|summons|notice|hearing|trial)\b/i
  ],
  "supreme-court-matters": [
    /\b(supreme court|sc|constitution bench|chief justice|collegium)\b/i,
    /\b(curative petition|review petition|special leave petition|slp)\b/i,
    /\b(constitutional|fundamental rights|directive principles|preamble)\b/i
  ],
  "forums-tribunal-matters": [
    /\b(tribunal|forum|authority|commission|board|council|ombudsman)\b/i,
    /\b(consumer forum|motor accident|labour court|industrial tribunal)\b/i,
    /\b(cci|competition commission|telecom tribunal|sebi|rdai)\b/i
  ],
  "business-matters": [
    /\b(business|commercial|trade|commerce|merchant|partnership|llp)\b/i,
    /\b(contract|agreement|negotiation|breach|damages|liquidation|bankruptcy)\b/i,
    /\b(arbitration|mediation|conciliation|alternative dispute resolution)\b/i
  ]
};

function assignCategoryToQuery(query: Query): string {
  const title = query.title || "";
  const description = query.description || "";
  const combined = `${title} ${description}`;

  // Test each category pattern
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return category;
      }
    }
  }

  // Default to general if no pattern matches
  return "general";
}

/* ----------------------------
             Page
-----------------------------*/
export default function QueryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // ——— Ask form state
  const [askTitle, setAskTitle] = useState("");
  const [askCategory, setAskCategory] = useState<string>(CATEGORIES[0].value);
  const [askContent, setAskContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<"" | "success" | "error">("");
  const [postMessage, setPostMessage] = useState("");

  // OTP State (similar to ServiceDetail)
  const [formMobile, setFormMobile] = useState("");
  const [formCity, setFormCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cities, setCities] = useState<string[]>(CITY_OPTIONS);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // ——— Recent 7 Days Queries
  const [recent7Days, setRecent7Days] = useState<Question[]>([]);
  const [loadingRecent7Days, setLoadingRecent7Days] = useState(true);
  const [userFilter, setUserFilter] = useState<"all" | "my">("all");

  // ——— Category-specific My Queries (separate from recent queries)
  const [myQueries, setMyQueries] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showingMyCategoryQueries, setShowingMyCategoryQueries] = useState(false);

  // ——— Authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ——— User authentication (real user data)
  const { user, loading: userLoading } = useUser();

  // Verify authentication (no longer redirects)
  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        const authResult = await clientAPI.verifyAuth();
        if (authResult.authenticated && authResult.user) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Authentication verification failed:", error);
      } finally {
        setIsAuthenticating(false);
      }
    };
    verifyAuthentication();
  }, []);

  // Load queries from backend on component mount
  useEffect(() => {
    const loadQueries = async () => {
      try {
        setLoadingRecent7Days(true);

        // Load more queries for category filtering
        const response = await queryAPI.getAll({ limit: 100 });

        if (response.data.success && response.data.data) {
          // Convert backend Query objects to local Question objects for display
          const questions: Question[] = response.data.data.map((query: Query) => ({
            _id: query.id,
            title: query.title || "Untitled Query",
            content: query.description || "",
            author: { name: query.askedByName || "Anonymous", city: "" },
            category: assignCategoryToQuery(query), // Assign category based on query content
            answersCount: query.answersCount || 0,
            createdAt: firestoreTsToISO(query.createdAt),
            askedById: query.askedById, // Add user ID for filtering
          }));

          // Store all queries for category filtering
          setMyQueries(questions);

          // Filter for recent 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recent7DaysQuestions = questions.filter((q) => {
            const queryDate = new Date(q.createdAt);
            return queryDate >= sevenDaysAgo;
          });

          setRecent7Days(recent7DaysQuestions);
        } else {
          throw new Error("Failed to load queries");
        }
      } catch (err) {
        console.error("Error loading queries:", err);
        // Fallback to mock data if API fails
        setMyQueries(MOCK_QUESTIONS);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const mockRecent7Days = MOCK_QUESTIONS.filter((q) => {
          const queryDate = new Date(q.createdAt);
          return queryDate >= sevenDaysAgo;
        });

        setRecent7Days(mockRecent7Days);
      } finally {
        setLoadingRecent7Days(false);
      }
    };

    loadQueries();
  }, []);

  // Reload page when navigating to this route
  useEffect(() => {
    if (location.pathname === '/queries') {
      const navigationKey = location.key || 'initial';
      const lastNavigationKey = sessionStorage.getItem('queries_last_navigation');

      if (lastNavigationKey !== navigationKey) {
        sessionStorage.setItem('queries_last_navigation', navigationKey);
        window.location.reload();
      }
    }
  }, [location.pathname, location.key]);

  // Filter queries based on user selection (for recent queries section)
  const filteredRecentQueries = useMemo(() => {
    if (userFilter === "my" && user) {
      return recent7Days.filter((q) => q.askedById === user.id || q.askedById === user._id);
    }
    return recent7Days;
  }, [recent7Days, userFilter, user]);

  // Filter queries for category-specific view using regex
  const filteredCategoryQueries = useMemo(() => {
    if (selectedCategory && user) {
      const categoryPatterns = CATEGORY_PATTERNS[selectedCategory as keyof typeof CATEGORY_PATTERNS] || [];

      const result = myQueries.filter((q: Question) => {
        // First check if user owns this query
        const isUserQuery = q.askedById === user.id || q.askedById === user._id;
        if (!isUserQuery) return false;

        // Then check if query matches category regex patterns
        const combined = `${q.title || ''} ${q.content || ''}`;
        return categoryPatterns.some((pattern: RegExp) => pattern.test(combined));
      });

      return result;
    }
    return [];
  }, [myQueries, selectedCategory, user]);

  // Group queries by category for display using regex filtering
  const queriesByCategory = useMemo(() => {
    const grouped: Record<string, Question[]> = {};

    CATEGORIES.forEach(cat => {
      const categoryPatterns = CATEGORY_PATTERNS[cat.value as keyof typeof CATEGORY_PATTERNS] || [];
      const categoryQueries = myQueries.filter((q: Question) => {
        const combined = `${q.title || ''} ${q.content || ''}`;
        return categoryPatterns.some((pattern: RegExp) => pattern.test(combined));
      });

      grouped[cat.value] = categoryQueries;
    });

    return grouped;
  }, [myQueries]);

  // Show loading while verifying initial state
  if (isAuthenticating && !userLoading) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-sm text-gray-600">Loading forum...</p>
        </div>
      </main>
    );
  }

  // Check if user data is loaded
  const isUserLoaded = !userLoading && user && (user.name || user.fullName);

  // Handle category view button clicks
  const handleViewCategory = (category: string) => {
    if (!user) return;

    setSelectedCategory(category);
    setShowingMyCategoryQueries(true);
  };

  // Handle back to main view
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

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    const regex = new RegExp(citySearch.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return cities.filter((city) => regex.test(city));
  }, [cities, citySearch]);

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

  const handleBackToMain = () => {
    setSelectedCategory(null);
    setShowingMyCategoryQueries(false);
  };


  // ——— API: Post a new query
  const postNow = async (verifiedClientId?: string) => {
    // basic validation
    const displayName = user?.name || user?.fullName || guestName.trim();
    if (!askTitle.trim() || !askContent.trim() || !displayName) {
      setPostStatus("error");
      setPostMessage("Please fill in all required fields.");
      return;
    }

    // If not logged in and not verified yet, trigger OTP flow
    if (!user && !otpVerified && !verifiedClientId) {
      if (!formMobile || !/^[0-9]{10}$/.test(formMobile)) {
        setPostStatus("error");
        setPostMessage("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (!formCity) {
        setPostStatus("error");
        setPostMessage("Please select your city.");
        return;
      }
      await handleSendOtp();
      return;
    }

    setPosting(true);
    setPostStatus("");
    setPostMessage("");

    try {
      const payload: QueryInput = {
        title: askTitle.trim(),
        description: askContent.trim(),
        askedByName: displayName,
        askedById: user?.id || user?._id || verifiedClientId || localStorage.getItem("clientId") || "anonymous-user",
        answersCount: 0,
      };

      const response = await queryAPI.create(payload);

      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to create query");
      }

      setPostStatus("success");
      setPostMessage("Your query has been posted successfully!");

      // Reset form
      setAskTitle("");
      setAskContent("");
      setGuestName("");
      setFormMobile("");
      setFormCity("");
      setOtp("");
      setOtpVerified(false);
      setShowOtpInput(false);
      setAskCategory(CATEGORIES[0].value);
    } catch (err) {
      console.error("Error posting query:", err);
      setPostStatus("error");
      setPostMessage("Failed to post query. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    setSendingOtp(true);
    setPostStatus("");
    setPostMessage("");

    try {
      const response = await api.post("/api/verify/generate-otp", {
        name: guestName || "User",
        city: formCity,
        phoneNumber: formMobile,
      });

      if (response.data.success) {
        setVerificationId(response.data.verificationId);
        setShowOtpInput(true);
        setPostStatus("success");
        setPostMessage("OTP sent to your mobile number");

        // For testing - show OTP in console
        if (response.data.testOtp) {
          console.log("🔢 Test OTP:", response.data.testOtp);
        }
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setPostStatus("error");
      setPostMessage(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setPostStatus("error");
      setPostMessage("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    setPostStatus("");

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

        // Now final post
        await postNow(response.data.clientId);
      } else {
        throw new Error(response.data.message || "Invalid OTP");
      }
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setPostStatus("error");
      setPostMessage(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };


  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8">
        {/* ================== Header Section ================== */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
          {/* Left: Ask form card */}
          <div className="rounded-[28px] bg-[#F1F1F1] p-5 md:p-6">
            <h2 className="text-[26px] md:text-[28px] font-semibold text-[#4A4A4A]">
              Ask Your Queries All At One Place
            </h2>
            <p className="mt-1 text-[13px] text-[#7A7A7A]">
              You May Ask Your Queries Directly From Expert Vakeel Team
              <br className="hidden sm:block" /> Or Our Community.
            </p>

            {/* form status */}
            {postStatus && (
              <div
                className={`mt-3 flex items-center gap-2 rounded-xl border p-3 text-sm ${postStatus === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                {postStatus === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>
                  {postStatus === "success"
                    ? "Your query has been posted!"
                    : "Please fill the title and details (or try again)."}
                </span>
              </div>
            )}

            {/* fields */}
            <div className="mt-4 space-y-3">
              <input
                value={askTitle}
                onChange={(e) => setAskTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-full bg-white px-4 py-3 text-[14px] placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
              />

              {/* Category */}
              <div className="relative">
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={askCategory}
                  onChange={(e) => setAskCategory(e.target.value)}
                  className="w-full appearance-none rounded-full bg-white px-4 py-3 text-[14px] shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>


              {/* Name (autofetch) + City (searchable for guests) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={user ? (user.name || user.fullName || "") : guestName}
                    onChange={(e) => !user && setGuestName(e.target.value)}
                    readOnly={!!user || showOtpInput || otpVerified}
                    placeholder={user ? "Your name" : "Your Name (Required)"}
                    className="w-full rounded-full bg-white px-4 pl-10 py-3 text-[14px] shadow-sm outline-none placeholder:text-gray-400 disabled:bg-gray-50 focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* City Dropdown for Guests */}
                {!user ? (
                  <div ref={cityDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => !otpVerified && !showOtpInput && setCityDropdownOpen(!cityDropdownOpen)}
                      disabled={showOtpInput || otpVerified}
                      className="w-full border-none rounded-full bg-white px-4 py-3 text-[14px] shadow-sm outline-none text-left flex items-center justify-between disabled:bg-gray-50"
                    >
                      <span className={formCity ? "text-gray-900" : "text-gray-400"}>
                        {formCity || "Select City (Required)"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {cityDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-50">
                          <div className="relative flex items-center">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                            <input
                              type="text"
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              placeholder="Search City"
                              className="w-full pl-9 pr-4 py-2 text-sm border-none bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-100"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* City List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setFormCity(city);
                                  setCityDropdownOpen(false);
                                  setCitySearch("");
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${formCity === city
                                  ? "bg-blue-50 text-[#1a365d] font-bold"
                                  : "text-gray-600 hover:bg-gray-50"
                                  }`}
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-center text-xs text-gray-400">
                              No cities found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={user?.city || ""}
                      readOnly
                      placeholder="City"
                      className="w-full rounded-full bg-gray-50 px-4 pl-10 py-3 text-[14px] shadow-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>

              {/* Mobile Number for Guests */}
              {!user && (
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      readOnly={showOtpInput || otpVerified}
                      placeholder="10-digit mobile number (Required)"
                      maxLength={10}
                      className="w-full rounded-full bg-white px-4 pl-10 py-3 text-[14px] shadow-sm outline-none placeholder:text-gray-400 disabled:bg-gray-50"
                    />
                    {otpVerified && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-sm shrink-0">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OTP Input */}
              {showOtpInput && !otpVerified && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="mb-2 text-xs font-semibold text-blue-600 ml-4 italic">Enter 6-digit code sent to {formMobile}</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="flex-1 rounded-full bg-white px-6 py-3 text-[14px] shadow-sm outline-none border-2 border-blue-100 focus:border-blue-400 tracking-[0.2em] font-black text-center"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length < 6}
                      className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                    >
                      {verifyingOtp ? <Loader className="h-5 w-5 animate-spin" /> : "Verify Code"}
                    </button>
                  </div>
                </div>
              )}


              {/* Query details */}
              <textarea
                value={askContent}
                onChange={(e) => setAskContent(e.target.value)}
                readOnly={showOtpInput && !otpVerified}
                placeholder="Ask Your Query (Minimum 10 words for better results)"
                rows={5}
                className="w-full resize-none rounded-[22px] bg-white px-4 py-3 text-[14px] shadow-sm outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
              />

              {/* Status Display */}
              {postStatus && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in duration-300 ${postStatus === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                  {postStatus === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {postMessage}
                </div>
              )}

              {/* Action Button */}
              {!showOtpInput && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => postNow()}
                    disabled={posting || sendingOtp}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#1a365d] px-8 py-3 text-sm font-bold text-white transition-all hover:bg-[#2d4a7c] hover:shadow-lg disabled:opacity-60"
                  >
                    {posting || sendingOtp ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    )}
                    {posting ? "Posting…" : sendingOtp ? "Sending OTP…" : !user && !otpVerified ? "Verify & Post Now" : "Post Your Query Now"}
                  </button>

                  {!user && !otpVerified && (
                    <p className="text-[11px] text-gray-400 italic font-medium ml-2">Verification required for guest posts</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: collage */}
        </div>

        {/* ================== Find Your Queries Section ================== */}
        <section className="mt-10 md:mt-12">
          <h3 className="text-xl font-semibold">
            Find Your Queries All At One Place
          </h3>
          <p className="text-sm text-gray-500">
            You May Ask Your Queries Directly From Expert Vakeel Team Or Our
            Community.
          </p>

          {/* Responsive grid — 2 per row on mobile, 4 on md+ */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
            {[
              {
                title: "Civil Matters Queries",
                desc:
                  "Ask your civil matters queries from Expert Vakeel Team or community & get answers from experts & other users",
                img: "/assets/images4.png",
                tone: "bg-green-100",
                category: "civil-matters",
              },
              {
                title: "Criminal Matters Queries",
                desc:
                  "Ask your criminal matters queries from Expert Vakeel Team or community & get answers from experts & other users",
                img: "/assets/images5.png",
                tone: "bg-gray-100",
                category: "criminal-matters",
              },
              {
                title: "Supreme Court Matters",
                desc:
                  "Ask your supreme court queries from Expert Vakeel Team or community & get answers from experts & other users",
                img: "/assets/image6.png",
                tone: "bg-rose-100",
                category: "supreme-court-matters",
              },
              {
                title: "Taxation & Corporate",
                desc:
                  "Ask your taxation & corporate queries from Expert Vakeel Team or community & get answers from experts & other users",
                img: "/assets/image7.png",
                tone: "bg-yellow-100",
                category: "taxation-matters",
              },
            ].map((c, i) => (
              <div
                key={i}
                className={`${c.tone} rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6`}
              >
                {/* Card Content */}
                <div className="min-h-28 sm:min-h-32">
                  <h4 className="text-sm sm:text-lg md:text-2xl font-semibold leading-tight">
                    {c.title}
                  </h4>
                  <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-gray-700 line-clamp-3">
                    {c.desc}
                  </p>
                </div>

                {/* Button */}
                <button
                  onClick={() => handleViewCategory(c.category)}
                  className="mt-3 sm:mt-4 rounded-full bg-black px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  View
                </button>

                {/* Image */}
                <div className="relative mt-4 sm:mt-6 h-24 sm:h-40 overflow-hidden rounded-2xl sm:rounded-3xl">
                  <img
                    src={c.img}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ================== My Category Queries ================== */}
        {showingMyCategoryQueries && selectedCategory && (
          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[22px] font-semibold text-gray-900">
                  My {CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory} Queries
                </h3>
                <p className="mt-1 text-[13px] text-gray-500">
                  Your queries in the {CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory} category
                </p>
              </div>

              <button
                onClick={handleBackToMain}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                ← Back to Main View
              </button>
            </div>

            {filteredCategoryQueries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  You haven't posted any {CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory} queries.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategoryQueries.slice(0, 9).map((q) => {
                  const showPreviewHint = (q.content || "").length > SNIPPET_THRESHOLD;
                  return (
                    <div
                      key={q._id}
                      className="rounded-[22px] bg-[#F7F7F7] p-5 shadow-sm ring-1 ring-gray-100"
                    >
                      {/* Title */}
                      <Link
                        to={`/queries/${q._id}`}
                        className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 hover:underline"
                      >
                        {q.title}
                      </Link>

                      {/* author + city */}
                      <div className="mt-2 text-[11px] text-gray-500">
                        <span className="font-medium">{q.author.name}</span>
                        {q.author.city ? `, ${q.author.city}` : ""}
                      </div>

                      {/* description snippet */}
                      <div className="mt-3 text-[11px]">
                        <div className="font-semibold text-gray-800">
                          Description
                        </div>
                        <p className="mt-1 line-clamp-2 text-gray-600">
                          {q.content}
                        </p>
                      </div>

                      {/* buttons row */}
                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          to={`/queries/${q._id}`}
                          className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white"
                        >
                          Read Full
                        </Link>

                        <span className="rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-semibold text-blue-700">
                          {CATEGORIES.find(c => c.value === q.category)?.label || "General"}
                        </span>
                        <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-semibold text-black">
                          {q.answersCount} Replies
                        </span>
                      </div>

                      <div className="mt-3 text-[11px] text-gray-500">
                        {formatDate(q.createdAt)}
                      </div>

                      {showPreviewHint ? (
                        <div className="mt-2 text-[10px] text-gray-400">
                          Click "Read Full" to preview more.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ================== Category-wise Queries ================== */}
        {CATEGORIES.map((category) => {
          const categoryQueries = queriesByCategory[category.value] || [];
          const recentCategoryQueries = categoryQueries.filter((q) => {
            const queryDate = new Date(q.createdAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return queryDate >= sevenDaysAgo;
          }).slice(0, 3); // Show max 3 recent queries per category

          if (recentCategoryQueries.length === 0) return null;

          return (
            <section key={category.value} className="mt-10 md:mt-12">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-[22px] font-semibold text-gray-900">
                    {category.label} Queries
                  </h3>
                  <p className="mt-1 text-[13px] text-gray-500">
                    Recent queries in {category.label.toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={() => handleViewCategory(category.value)}
                  className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  View All ({categoryQueries.length})
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {recentCategoryQueries.map((q) => {
                  const showPreviewHint = (q.content || "").length > SNIPPET_THRESHOLD;
                  return (
                    <div
                      key={q._id}
                      className="rounded-[22px] bg-[#F7F7F7] p-5 shadow-sm ring-1 ring-gray-100"
                    >
                      {/* Title */}
                      <Link
                        to={`/queries/${q._id}`}
                        className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 hover:underline"
                      >
                        {q.title}
                      </Link>

                      {/* author + city */}
                      <div className="mt-2 text-[11px] text-gray-500">
                        <span className="font-medium">{q.author.name}</span>
                        {q.author.city ? `, ${q.author.city}` : ""}
                      </div>

                      {/* description snippet */}
                      <div className="mt-3 text-[11px]">
                        <div className="font-semibold text-gray-800">
                          Description
                        </div>
                        <p className="mt-1 line-clamp-2 text-gray-600">
                          {q.content}
                        </p>
                      </div>

                      {/* buttons row */}
                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          to={`/queries/${q._id}`}
                          className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white"
                        >
                          Read Full
                        </Link>

                        <span className="rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-semibold text-blue-700">
                          {category.label}
                        </span>
                        <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-semibold text-black">
                          {q.answersCount} Replies
                        </span>
                      </div>

                      <div className="mt-3 text-[11px] text-gray-500">
                        {formatDate(q.createdAt)}
                      </div>

                      {showPreviewHint ? (
                        <div className="mt-2 text-[10px] text-gray-400">
                          Click "Read Full" to preview more.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* ================== Recently Asked Queries ================== */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-[22px] font-semibold text-gray-900">
                Recently Asked Queries
              </h3>
              <p className="mt-1 text-[13px] text-gray-500">
                Latest queries posted in the past week
              </p>
            </div>

            {/* User Filter */}
            {user && (
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as "all" | "my")}
                  className="w-48 appearance-none rounded-full border border-gray-200 bg-white pl-10 pr-10 py-2 text-sm outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="my">My Queries</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>
            )}
          </div>



          {loadingRecent7Days ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                <p className="mt-2 text-sm text-gray-600">Loading recent queries...</p>
              </div>
            </div>
          ) : filteredRecentQueries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {userFilter === "my"
                  ? "You haven't posted any queries in the last 7 days."
                  : "No queries posted in the last 7 days."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecentQueries.slice(0, 6).map((q) => {
                const showPreviewHint = (q.content || "").length > SNIPPET_THRESHOLD;
                return (
                  <div
                    key={q._id}
                    className="rounded-[22px] bg-[#F7F7F7] p-5 shadow-sm ring-1 ring-gray-100"
                  >
                    {/* Title */}
                    <Link
                      to={`/queries/${q._id}`}
                      className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 hover:underline"
                    >
                      {q.title}
                    </Link>

                    {/* author + city */}
                    <div className="mt-2 text-[11px] text-gray-500">
                      <span className="font-medium">{q.author.name}</span>
                      {q.author.city ? `, ${q.author.city}` : ""}
                    </div>

                    {/* description snippet */}
                    <div className="mt-3 text-[11px]">
                      <div className="font-semibold text-gray-800">
                        Description
                      </div>
                      <p className="mt-1 line-clamp-2 text-gray-600">
                        {q.content}
                      </p>
                    </div>

                    {/* buttons row */}
                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        to={`/queries/${q._id}`}
                        className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white"
                      >
                        Read Full
                      </Link>

                      <span className="rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-semibold text-blue-700">
                        {CATEGORIES.find(c => c.value === q.category)?.label || "General"}
                      </span>
                      <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-semibold text-black">
                        {q.answersCount} Replies
                      </span>
                    </div>

                    <div className="mt-3 text-[11px] text-gray-500">
                      {formatDate(q.createdAt)} • New
                    </div>

                    {showPreviewHint ? (
                      <div className="mt-2 text-[10px] text-gray-400">
                        Click "Read Full" to preview more.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>



        {/* ================== FAQ ================== */}
        <section className="mt-12">
          <h3 className="text-[30px] font-semibold">Frequently Asked Questions</h3>
          <p className="mt-1 text-[15px] text-gray-500">
            Feel Free To Connect With Us In Case Of Any Query
          </p>

          <Faq />
        </section>
      </div>
    </main>
  );
}

/* ----------------------------
           FAQ Block
-----------------------------*/
function Faq() {
  const items = [
    {
      q: "How Can I Ask Query On Expert Vakeel?",
      a: "Asking a query is simple & quick: click “Ask a Question,” choose a category, describe your question, pick who should answer (team, community, or both), set privacy (public/private) and submit.",
    },
    {
      q: "Who Answers These Queries",
      a: "Answers may come from Expert Vakeel Team, verified experts, and our wider community.",
    },
    {
      q: "I Want Ask Directly From Expert Vakeel Team",
      a: "Choose “Expert Vakeel Team” under the “Who You Want Answer From?” options before posting your question.",
    },
    {
      q: "I Have Two More Queries Can I Post More?",
      a: "Yes, you can post multiple queries. Kindly keep each post focused on a single question for faster responses.",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-6 divide-y divide-gray-200">
      {items.map((it, idx) => {
        const expanded = open === idx;
        return (
          <div key={idx} className="py-4">
            <button
              onClick={() => setOpen(expanded ? null : idx)}
              className="flex w-full items-center justify-between text-left"
            >
              <h4 className="text-[18px] md:text-[20px] font-semibold text-gray-900">
                {it.q}
              </h4>
              <ChevronDown
                className={`transition-transform ${expanded ? "rotate-180" : ""
                  } text-gray-500`}
              />
            </button>
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ${expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <p className="pt-3 max-w-4xl text-[15px] leading-7 text-gray-600">
                {it.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
