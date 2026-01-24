"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaMapMarkerAlt, FaRegSmile, FaStar } from "react-icons/fa";
import { ChevronDown, Check } from "lucide-react";
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

  // Dynamic data from API
  const [dynamicCities, setDynamicCities] = useState<string[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [dynamicLoading, setDynamicLoading] = useState(true);

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
    if (!citySearch.trim()) return dynamicCities.slice(0, 5); // Show first 5 if no search

    const regex = new RegExp(
      citySearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    return dynamicCities.filter((city) => regex.test(city)).slice(0, 5); // Limit to 5 results for better UX
  }, [dynamicCities, citySearch]);

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
    // Don't close dropdown if clicking on dropdown items
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (
      cityDropdownRef.current &&
      relatedTarget &&
      cityDropdownRef.current.contains(relatedTarget)
    ) {
      return;
    }

    // Delay hiding dropdown to allow click selection
    setTimeout(() => setCityDropdownOpen(false), 200);
  };

  // ------------------------------
  // DYNAMIC DATA FROM API
  // ------------------------------
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setDynamicLoading(true);
        const response = await publicUserAPI.getAll();

        if (response.data.data) {
          const users = response.data.data;

          // Extract unique cities with regex cleanup
          const citiesSet = new Set<string>();
          const categoriesSet = new Set<string>();

          for (const user of users) {
            // Process cities with regex (clean whitespace, remove special chars, normalize)
            if (user.city) {
              const cleanedCity = user.city
                .trim()
                .replace(/\s+/g, " ") // normalize whitespace
                .replace(/[^\w\s-]/g, "") // remove special chars except hyphens
                .replace(/^\s*-\s*|\s*-\s*$/g, "") // remove leading/trailing hyphens
                .trim();

              if (cleanedCity) {
                citiesSet.add(cleanedCity);
              }
            }

            // Extract specializations (categories)
            if (user.specializations?.length) {
              user.specializations.forEach((spec) => {
                if (spec) categoriesSet.add(spec.trim());
              });
            }
          }

          // Sort and set the dynamic data
          setDynamicCities(Array.from(citiesSet).sort());
          setDynamicCategories(Array.from(categoriesSet).sort());
        } else {
          // Fallback to static data if API fails
          setDynamicCities([
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
          ]);
          setDynamicCategories([
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
          ]);
        }
      } catch (err) {
        console.error("Error fetching dynamic data:", err);
        // Fallback to static data
        setDynamicCities([
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
        ]);
        setDynamicCategories([
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
        ]);
      } finally {
        setDynamicLoading(false);
      }
    };

    fetchDynamicData();
  }, []);

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

  // ------------------------------
  // DYNAMIC QUERIES STATE
  // ------------------------------
  const [queries, setQueries] = useState<Query[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(true);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setQueriesLoading(true);
        const response = await queryAPI.getAll({ limit: 10 });
        if (response.data.success) setQueries(response.data.data);
        else setQueries([]);
      } catch (err) {
        console.error("Error fetching queries:", err);
        setQueries([]);
      } finally {
        setQueriesLoading(false);
      }
    };
    fetchQueries();
  }, []);

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
    return queries.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      answers: q.answersCount,
      askedBy: q.askedByName,
      timeAgo: formatTimeAgo(q.createdAt),
      category: determineCategory(q),
    }));
  }, [queries]);

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
    <main className="min-h-[100dvh] bg-white pb-safe pt-safe">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden min-h-[380px] md:min-h-[600px]">
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
              Find the Right Legal Expertise
            </h1>

            <p className="mb-6 text-lg text-gray-100 lg:text-xl ">
              Litigation • Advisory • Documentation
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
                    disabled={dynamicLoading}
                    className="h-12 w-full appearance-none rounded-xl bg-white px-4 pr-10 text-sm text-gray-900 outline-none ring-2 ring-transparent focus:ring-2 focus:ring-[#FFA800] hover:ring-gray-300 transition-all"
                  >
                    <option value="">
                      {dynamicLoading
                        ? "Loading categories..."
                        : "Select Legal Category"}
                    </option>
                    {dynamicCategories.map((cat) => (
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
                    <div className="absolute top-full z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl max-h-60 overflow-y-auto">
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

                {/* Search Button */}
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#FFA800] px-6 text-sm font-semibold text-black transition-all hover:bg-[#FFB524] hover:shadow-lg active:scale-95 lg:min-w-[160px]"
                >
                  Search Now!
                </button>
              </div>
            </form>

            {/* Stats Highlights */}
            <div className="mt-8 hidden md:flex flex-wrap gap-3 lg:gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaHome className="h-4 w-4 text-white" />
                <span className="text-white">2M+ Profiles</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaRegSmile className="h-4 w-4 text-white" />
                <span className="text-white">46K+ Clients</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm backdrop-blur-md border border-white/30">
                <FaStar className="h-4 w-4 text-white" />
                <span className="text-white">4.8 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Buttons Section */}
      <section className="sm:mx-auto sm:max-w-screen-xl py-8 sm:px-6 sm:py-10 md:py-12">
        <div className="sm:ml-10 mb-8 px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Explore Our Services
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Access all our legal services and resources in one place
          </p>
        </div>

        <ServiceList />
      </section>

      <TopRatedProfiles />

      <BrowseByCategory onCategoryClick={handleCategoryClick} />

      {/* Explore Or Ask Legal Queries */}
      <section className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:py-12">
        {/* Header */}
        <div className="mb-5 text-center sm:mb-8 md:mb-10">
          <h2 className="font-bold leading-tight tracking-tight text-black text-[clamp(22px,6vw,40px)]">
            Explore Or Ask Legal Queries
          </h2>
          <p className="mt-2 text-xs text-gray-500 sm:text-sm md:text-base">
            Get Your Query Answered By Lawyers &amp; Firms
          </p>
        </div>

        {/* Controls + Row */}
        <div className="relative">
          {/* Left button (hidden on very small screens to avoid covering cards) */}
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy("left")}
            className="absolute left-[-6px] top-1/2 z-10 hidden -translate-y-1/2 select-none items-center justify-center rounded-full border border-gray-200 bg-white shadow transition-colors hover:bg-gray-50 sm:flex h-9 w-9"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>

          {/* Cards scroller */}
          <div
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 md:gap-5"
          >
            {queriesLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`loading-${idx}`}
                  className="min-w-[220px] max-w-[260px] rounded-2xl border bg-white px-3 py-3 shadow-sm ring-1 ring-transparent [border-color:#D9F4E0] sm:min-w-[240px] sm:max-w-[280px] md:min-w-[280px] md:max-w-[320px] animate-pulse"
                >
                  <div className="mb-2 h-4 rounded bg-gray-200" />
                  <div className="mb-1 h-4 rounded bg-gray-200" />
                  <div className="mb-3 h-4 w-3/4 rounded bg-gray-200" />
                  <div className="flex justify-between">
                    <div className="h-6 w-20 rounded bg-gray-200" />
                    <div className="h-4 w-16 rounded bg-gray-200" />
                  </div>
                  <div className="mt-3 flex justify-between">
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {(filteredQueries.length
                  ? filteredQueries
                  : processedQueries
                ).map((item, idx) => (
                  <article
                    key={`${item.id}-${idx}`}
                    className="min-w-[220px] max-w-[260px] rounded-xl border bg-white px-3 py-3 transition-all hover:scale-[1.01] hover:shadow-md [border-color:#D9F4E0] sm:min-w-[240px] sm:max-w-[280px] sm:rounded-2xl sm:px-3.5 sm:py-3.5 md:min-w-[280px] md:max-w-[320px] md:px-4 md:py-4"
                  >
                    <h3 className="line-clamp-3 text-sm font-semibold leading-tight text-black sm:text-[16px] md:text-[17px]">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 text-sm text-grey-200">
                      {item.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between sm:mt-4">
                      <button
                        onClick={() => handleAnswerQuery(item.id)}
                        className="rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 sm:px-4 sm:text-[12px]"
                      >
                        Answer / Reply
                      </button>
                      <span className="text-[11px] text-gray-500 sm:text-[12px]">
                        {item.answers} Answers
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 sm:mt-4 sm:text-[11px]">
                      <span>
                        Asked by{" "}
                        <span className="text-gray-700">
                          {item.askedBy || "Lawyer"}
                        </span>
                      </span>
                      <span>{item.timeAgo}</span>
                    </div>
                  </article>
                ))}

                {/* A small buffer at the end so last card isn't flush with edge */}
                <div className="min-w-[8px] sm:min-w-[12px]" />
              </>
            )}
          </div>

          {/* Right button */}
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy("right")}
            className="absolute right-[-6px] top-1/2 z-10 hidden -translate-y-1/2 select-none items-center justify-center rounded-full border border-gray-200 bg-white shadow transition-colors hover:bg-gray-50 sm:flex h-9 w-9"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* Why Expert Vakeel */}
      <WhyExpertVakeel />
    </main>
  );
}
