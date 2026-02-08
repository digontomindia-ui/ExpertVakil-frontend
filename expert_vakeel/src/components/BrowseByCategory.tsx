"use client";

import { useState, useEffect } from "react";
import { categoriesAPI, type Category } from "../services/api";

// Default categories as fallback if none exist in the database
const defaultCategories: Omit<Category, 'id' | 'order' | 'createdAt' | 'updatedAt'>[] = [
  { title: "Family Matters", subtitle: "Divorce, Custody, Heritage", image: "/assets/image1.png", isActive: true },
  { title: "Criminal Matters", subtitle: "Bail, Defense, Investigation", image: "/assets/image2.png", isActive: true },
  { title: "Labour Matters", subtitle: "Employment, Wages, Disputes", image: "/assets/image3.png", isActive: true },
  { title: "Taxation Matters", subtitle: "GST, IT, Corporate Tax", image: "/assets/images4.png", isActive: true },
  { title: "Business Matters", subtitle: "Startup, Compliance, Mergers", image: "/assets/images5.png", isActive: true },
  { title: "Civil Matters", subtitle: "Property, Contracts, Disputes", image: "/assets/image6.png", isActive: true },
  { title: "Trademark & IP", subtitle: "Copyright, Patents, Brands", image: "/assets/image7.png", isActive: true },
  { title: "Documentation", subtitle: "Agreements, Deeds, Registration", image: "/assets/image8.png", isActive: true },
  { title: "High Court", subtitle: "Appeals, Writ Petitions", image: "/assets/image9.png", isActive: true },
  { title: "Supreme Court", subtitle: "Special Leave Petitions", image: "/assets/image10.png", isActive: true },
  { title: "Forums & Tribunal", subtitle: "NCLT, DRT, Consumer Court", image: "/assets/image11.png", isActive: true },
];

const titleColors = [
  "text-rose-500",
  "text-blue-500",
  "text-amber-500",
  "text-indigo-500",
  "text-emerald-500",
  "text-pink-500",
  "text-cyan-500",
  "text-teal-500",
  "text-orange-500",
  "text-lime-500",
  "text-fuchsia-500",
];

const bgGradients = [
  "from-rose-500/10",
  "from-blue-500/10",
  "from-amber-500/10",
  "from-indigo-500/10",
  "from-emerald-500/10",
  "from-pink-500/10",
  "from-cyan-500/10",
  "from-teal-500/10",
  "from-orange-500/10",
  "from-lime-500/10",
  "from-fuchsia-500/10",
];

type CategoryDisplay = {
  title: string;
  subtitle: string;
  image: string;
};

function CategoryCard({
  title,
  subtitle,
  image,
  colorIndex,
  onExplore,
}: CategoryDisplay & { colorIndex: number; onExplore: (category: string) => void }) {
  const titleColor = titleColors[colorIndex % titleColors.length];
  const bgGradient = bgGradients[colorIndex % bgGradients.length];

  return (
    <div
      onClick={() => onExplore(title)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-[#FFA800]/20"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/placeholder.png";
          }}
        />
        {/* Color Overlay Hint */}
        <div className={`absolute inset-0 bg-gradient-to-t ${bgGradient} to-transparent opacity-60`} />
      </div>

      {/* Content Area */}
      <div className="relative p-4 sm:p-6 bg-white">
        <div className="flex flex-col gap-1">
          <h3 className={`text-sm sm:text-lg font-bold leading-tight ${titleColor}`}>
            {title}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium line-clamp-1 uppercase tracking-wider">
            {subtitle}
          </p>
        </div>

        {/* Action Button - Subtle and Premium */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold bg-[#FFA800] text-white sm:bg-transparent sm:text-[#FFA800] opacity-100 sm:opacity-0 transition-all duration-300 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 px-3 py-1.5 rounded-full sm:rounded-none sm:px-0 sm:py-0 -translate-x-2">
            View Experts
          </span>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all duration-300 sm:group-hover:bg-[#FFA800] sm:group-hover:text-white sm:group-hover:rotate-[-45deg] hover:bg-amber-700 hover:text-white">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Glow on Hover */}
      <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-transparent via-transparent to-[#FFA800]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}

export default function BrowseByCategoryPage({
  onCategoryClick,
}: {
  onCategoryClick?: (category: string) => void;
}) {
  const [categories, setCategories] = useState<CategoryDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll({ isActive: true });
        const apiCategories = response.data.data || [];

        if (apiCategories.length > 0) {
          // Use categories from API
          setCategories(apiCategories.map(c => ({
            title: c.title,
            subtitle: c.subtitle,
            image: c.image,
          })));
        } else {
          // Fallback to default categories
          setCategories(defaultCategories.map(c => ({
            title: c.title,
            subtitle: c.subtitle,
            image: c.image,
          })));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories on error
        setCategories(defaultCategories.map(c => ({
          title: c.title,
          subtitle: c.subtitle,
          image: c.image,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleExplore = (category: string) => {
    if (onCategoryClick) onCategoryClick(category);
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16 lg:py-24">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFA800]" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12 lg:py-16">
      {/* Modern Centered Header */}
      <div className="mb-10 sm:mb-16 text-center">
        <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFA800]">
          Diverse Legal Expertise
        </span>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Browse By <span className="text-[#FFA800]">Category</span>
        </h2>
        <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#FFA800] to-orange-300 sm:mt-6" />
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <CategoryCard
            key={c.title}
            title={c.title}
            subtitle={c.subtitle}
            image={c.image}
            colorIndex={i}
            onExplore={handleExplore}
          />
        ))}
      </div>
    </section>
  );
}