"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaMapMarkerAlt, FaRegSmile, FaStar, FaUserCheck, FaGavel, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import TopRatedProfiles from "../components/TopRatedProfiles";
import BrowseByCategory from "../components/BrowseByCategory";
import WhyExpertVakeel from "../components/whyexpertVakeel";
import { queryAPI, publicUserAPI } from "../services/api";
import type { Query } from "../services/api";
import useAuth from "../hooks/useAuth";
import ServiceList from "../app/Service/ServiceList";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Combined states
  const [data, setData] = useState<{
    cities: string[];
    categories: string[];
    queries: Query[];
  }>({
    cities: [],
    categories: [],
    queries: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // 1. CLEAR SESSION/COOKIES ON VISIT - Add this useEffect at the top
  useEffect(() => {
    const clearSessionOnVisit = () => {
      try {
        // List of all possible token/storage keys to clear
        const storageKeys = [
          "token",
          "accessToken",
          "refreshToken",
          "user",
          "userData",
          "auth_token",
          "authToken",
          "session",
          "sessionId",
          "userId",
          "user_id",
          "isLoggedIn",
          "loginStatus",
          "userProfile",
          "profile",
        ];

        // Clear localStorage
        storageKeys.forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        // Optionally clear all localStorage (more aggressive)
        // localStorage.clear();
        // sessionStorage.clear();

        // Clear cookies - more comprehensive method
        const cookies = document.cookie.split(";");
        const domain = window.location.hostname;
        const path = "/";

        cookies.forEach((cookie) => {
          const cookieParts = cookie.trim().split("=");
          const cookieName = cookieParts[0];

          // Set expiration to past date to delete
          const expirationDate = new Date(0).toUTCString();

          // Delete cookie with various settings to ensure it's cleared
          document.cookie = `${cookieName}=; expires=${expirationDate}; path=${path};`;
          document.cookie = `${cookieName}=; expires=${expirationDate}; path=${path}; domain=${domain};`;
          document.cookie = `${cookieName}=; expires=${expirationDate}; path=${path}; domain=.${domain};`;
          document.cookie = `${cookieName}=; expires=${expirationDate}; path=/;`;

          // Also try to clear secure cookies if applicable
          if (window.location.protocol === "https:") {
            document.cookie = `${cookieName}=; expires=${expirationDate}; path=${path}; Secure;`;
          }
        });

        // Clear any indexedDB or other storage if needed
        if (window.indexedDB) {
          indexedDB.databases?.().then((dbs) => {
            dbs.forEach((db) => {
              if (db.name) indexedDB.deleteDatabase(db.name);
            });
          });
        }

        console.log("Session cleared on home page visit");
      } catch (error) {
        console.error("Error clearing session:", error);
      }
    };

    // Run only once when component mounts (user visits home page)
    clearSessionOnVisit();
  }, []); // Empty dependency array ensures it runs only once on mount

  // 2. Combined data fetching - moved to separate useEffect
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);

        // Fetch both data sources in parallel
        const [dynamicDataResponse, queriesResponse] = await Promise.all([
          publicUserAPI.getAll().catch(() => ({ data: { data: [] } })),
          queryAPI
            .getAll({ limit: 10 })
            .catch(() => ({ data: { success: false, data: [] } })),
        ]);

        const users = dynamicDataResponse.data.data || [];
        const queriesData = queriesResponse.data.success
          ? queriesResponse.data.data
          : [];

        // Process cities and categories
        const citiesSet = new Set<string>();
        const categoriesSet = new Set<string>();

        for (const user of users) {
          if (user.city) {
            const cleanedCity = user.city
              .trim()
              .replace(/\s+/g, " ")
              .replace(/[^\w\s-]/g, "")
              .replace(/^\s*-\s*|\s*-\s*$/g, "")
              .trim();
            if (cleanedCity) citiesSet.add(cleanedCity);
          }

          if (user.specializations?.length) {
            user.specializations.forEach((spec) => {
              if (spec) categoriesSet.add(spec.trim());
            });
          }
        }

        // Use fallback data if API returns empty
        const finalCities = Array.from(citiesSet).sort();
        const finalCategories = Array.from(categoriesSet).sort();

        setData({
          cities:
            finalCities.length > 0
              ? finalCities
              : [
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
              ],
          categories:
            finalCategories.length > 0
              ? finalCategories
              : [
                "Civil Matters",
                "Criminal Matters",
                "Family Matters",
                "Labour/Employee Matters",
                "Taxation Matters",
                "Documentation & Registration",
                "Trademark & Copyright Matters",
                "High Court Matters",
                "Supreme Court Matters",
                "Forums and Tribunal Matters",
                "Business Matters",
              ],
          queries: queriesData,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        // Fallback to static data
        setData({
          cities: [
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
          ],
          categories: [
            "Civil Matters",
            "Criminal Matters",
            "Family Matters",
            "Labour/Employee Matters",
            "Taxation Matters",
            "Documentation & Registration",
            "Trademark & Copyright Matters",
            "High Court Matters",
            "Supreme Court Matters",
            "Forums and Tribunal Matters",
            "Business Matters",
          ],
          queries: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    navigate(`/findprofile${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleCategoryClick = (selectedCategory: string) => {
    navigate(`/findprofile?category=${encodeURIComponent(selectedCategory)}`);
  };

  const handleAnswerQuery = (queryId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/queries/${queryId}`);
  };

  // City search functionality
  const filteredCities = useMemo(() => {
    const cities = data.cities;
    if (!citySearch.trim()) return cities.slice(0, 5);

    const regex = new RegExp(
      citySearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    return cities.filter((city) => regex.test(city)).slice(0, 5);
  }, [data.cities, citySearch]);

  const handleCityInputChange = (value: string) => {
    setCitySearch(value);
    setCityDropdownOpen(true);
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setCitySearch(selectedCity);
    setCityDropdownOpen(false);
  };

  const handleCityInputFocus = () => {
    setCityDropdownOpen(true);
  };

  const handleCityInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (
      cityDropdownRef.current &&
      relatedTarget &&
      cityDropdownRef.current.contains(relatedTarget)
    ) {
      return;
    }
    setTimeout(() => setCityDropdownOpen(false), 200);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setCityDropdownOpen(false);
      }
    };

    if (cityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cityDropdownOpen]);

  const [selectedCat] = useState<string>("All");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const formatTimeAgo = (createdAt: any) => {
    if (!createdAt) return "Recently";
    let date: Date;
    if (createdAt?.toDate) date = createdAt.toDate();
    else if (createdAt instanceof Date) date = createdAt;
    else if (typeof createdAt === "string") date = new Date(createdAt);
    else return "Recently";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `About ${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `About ${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `About ${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const determineCategory = (query: Query): string => {
    const text = `${query.title} ${query.description}`.toLowerCase();
    if (
      text.includes("family") ||
      text.includes("divorce") ||
      text.includes("marriage")
    )
      return "Family Matters";
    if (
      text.includes("criminal") ||
      text.includes("bail") ||
      text.includes("police")
    )
      return "Criminal Matters";
    if (
      text.includes("civil") ||
      text.includes("property") ||
      text.includes("contract")
    )
      return "Civil Matters";
    if (text.includes("supreme court")) return "Supreme Court Matters";
    if (text.includes("high court")) return "High Court Matters";
    return "All";
  };

  const processedQueries = useMemo(() => {
    return data.queries.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      answers: q.answersCount,
      askedBy: q.askedByName,
      timeAgo: formatTimeAgo(q.createdAt),
      category: determineCategory(q),
    }));
  }, [data.queries]);

  const filteredQueries = useMemo(() => {
    if (selectedCat === "All") return processedQueries;
    return processedQueries.filter((q) => q.category === selectedCat);
  }, [selectedCat, processedQueries]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.9);
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-[100dvh] bg-white pb-safe pt-safe overflow-visible">
      {/* Hero Section */}
      <section className="relative w-full min-h-[380px] md:min-h-[600px] pb-20 md:pb-8">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/assets/hero_banner.png"
            alt="Find the Right Legal Expertise"
            className="h-full w-full object-cover"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-indigo-800/20" />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-screen-xl px-4 py-8 sm:px-6 md:py-20 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl xl:text-6xl drop-shadow-lg">
              Find the Right Advocate for Your Legal Issue
            </h1>

            <p className="mb-6 text-lg text-gray-100 lg:text-xl ">
              Select your legal category and city to connect with relevant legal professionals.
            </p>
            {/* Search bar */}
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-xl lg:p-6"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:gap-4">
                {/* Category Dropdown */}
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isLoading}
                    className="h-12 w-full appearance-none rounded-xl bg-white px-4 pr-10 text-sm text-gray-900 outline-none ring-2 ring-transparent focus:ring-2 focus:ring-[#FFA800] hover:ring-gray-300 transition-all"
                  >
                    <option value="">
                      {isLoading
                        ? "Loading categories..."
                        : "Select Legal Category"}
                    </option>
                    {data.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>

                {/* City Search with Dropdown */}
                <div ref={cityDropdownRef} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onFocus={handleCityInputFocus}
                      onBlur={handleCityInputBlur}
                      placeholder="Search City"
                      className="h-12 w-full rounded-xl bg-white px-4 pr-12 text-sm text-gray-900 outline-none ring-2 ring-transparent focus:ring-2 focus:ring-[#FFA800] hover:ring-gray-300 transition-all"
                    />
                    <FaMapMarkerAlt className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>

                  {cityDropdownOpen && filteredCities.length > 0 && (
                    <div className="absolute top-full z-[100] mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl max-h-60 overflow-y-auto">
                      {filteredCities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleCitySelect(c)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <span className="text-gray-800">{c}</span>
                          {c === city && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Find Advocates Button */}
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#FFA800] px-6 text-sm font-semibold text-black transition-all hover:bg-[#FFB524] hover:shadow-lg active:scale-95 lg:min-w-[160px]"
                >
                  Find Advocates
                </button>
              </div>
            </form>

            {/* Stats Highlights - Hide when dropdown is open */}
            <div className={`relative z-10 mt-8 hidden md:flex flex-wrap gap-3 lg:gap-4 transition-opacity duration-200 ${cityDropdownOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaUserCheck className="h-4 w-4 text-white" />
                <span className="text-white">200+ Verified Advocates</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaMapMarkerAlt className="h-4 w-4 text-white" />
                <span className="text-white">50+ Cities covered</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaGavel className="h-4 w-4 text-white" />
                <span className="text-white">10+ Legal Categories</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaStar className="h-4 w-4 text-[#FFA800]" />
                <span className="text-white">4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Buttons Section */}
      <section className="sm:mx-auto sm:max-w-screen-xl py-6 sm:py-10 md:py-12">
        <div className="sm:ml-10 mb-6 sm:mb-8 px-4">
          <h2 className="text-xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Explore Our Services
          </h2>
          <p className="hidden sm:block text-gray-600 text-sm md:text-base">
            Access all our legal services and resources in one place
          </p>
        </div>

        <ServiceList />
      </section>

      <TopRatedProfiles />

      <BrowseByCategory onCategoryClick={handleCategoryClick} />

      {/* Explore Or Ask Legal Queries */}
      <section className="relative overflow-hidden bg-[#FBFBFB] py-16 sm:py-24">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 rounded-full bg-[#FFA800]/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10 sm:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="max-w-xl text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-[#FFA800] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFA800]">
                    Legal Forum & Community
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
                  Explore Or Ask <span className="text-[#FFA800]">Queries</span>
                </h2>
                <p className="mt-4 text-sm sm:text-lg text-gray-500 font-medium">
                  Get expert legal advice and insights from verified advocates and law firms across India.
                </p>
              </div>
              <button
                onClick={() => navigate('/queries')}
                className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:border-[#FFA800]/20 hover:shadow-md"
              >
                View All Community <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-[#FFA800]" />
              </button>
            </div>
          </div>

          {/* Controls + Row */}
          <div className="relative">
            {/* Navigation Buttons */}
            <div className="absolute -top-24 right-0 hidden items-center gap-2 sm:flex">
              <button
                aria-label="Scroll left"
                onClick={() => scrollBy("left")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm transition-all hover:bg-[#FFA800] hover:text-white hover:shadow-lg active:scale-95"
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Scroll right"
                onClick={() => scrollBy("right")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm transition-all hover:bg-[#FFA800] hover:text-white hover:shadow-lg active:scale-95"
              >
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Cards scroller */}
            <div
              ref={scrollerRef}
              className="flex gap-4 overflow-x-auto pb-8 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
            >
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`query-loading-${idx}`}
                    className="min-w-[280px] max-w-[320px] rounded-3xl bg-white p-6 shadow-sm border border-gray-100 animate-pulse"
                  >
                    <div className="mb-4 h-5 w-1/3 rounded-full bg-gray-100" />
                    <div className="mb-3 h-6 w-full rounded bg-gray-100" />
                    <div className="mb-6 h-4 w-3/4 rounded bg-gray-100" />
                    <div className="flex justify-between items-center">
                      <div className="h-10 w-24 rounded-full bg-gray-100" />
                      <div className="h-4 w-16 rounded bg-gray-100" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {(filteredQueries.length ? filteredQueries : processedQueries).map((item, idx) => (
                    <article
                      key={`${item.id}-${idx}`}
                      className="group relative min-w-[280px] max-w-[320px] flex flex-col rounded-3xl bg-white p-6 transition-all duration-500 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:border-[#FFA800]/20 sm:min-w-[340px] sm:p-8"
                    >
                      {/* Category Badge */}
                      <div className="mb-5 flex items-center justify-between">
                        <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FFA800]">
                          {item.category}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FFA800]/10 transition-colors">
                          <FaRegSmile className="h-4 w-4 text-gray-400 group-hover:text-[#FFA800]" />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-gray-900 transition-colors group-hover:text-[#FFA800] sm:text-xl">
                          {item.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm text-gray-500 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-8">
                        {/* Meta Info */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-gray-500 text-xs uppercase">
                            {item.askedBy?.[0] || 'L'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-gray-900 line-clamp-1">
                              {item.askedBy || "Verified User"}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">
                              {item.timeAgo}
                            </span>
                          </div>
                        </div>

                        {/* Action + Answers */}
                        <div className="flex items-center justify-between gap-4">
                          <button
                            onClick={() => handleAnswerQuery(item.id)}
                            className="flex-grow rounded-2xl bg-gray-900 px-4 py-3 text-xs font-bold text-white transition-all hover:bg-black hover:shadow-lg active:scale-95"
                          >
                            Answer / Reply
                          </button>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <span className="text-lg font-black text-[#FFA800]">
                              {item.answers}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                              Answers
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subtle Bottom Glow */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-0 bg-[#FFA800] transition-all duration-500 group-hover:w-1/3 rounded-full" />
                    </article>
                  ))}
                  <div className="min-w-[12px]" />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Expert Vakeel */}
      <WhyExpertVakeel />
    </main>
  );
}
