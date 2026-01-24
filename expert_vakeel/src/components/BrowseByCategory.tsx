"use client";

type Category = {
  title: string;
  subtitle: string;
  image: string;
};

const categories: Category[] = [
  { title: "Civil Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Criminal Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Family Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Labour/Employee Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Taxation Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Documentation & Registration", subtitle: "", image: "/assets/image10.png" },
  { title: "Trademark & Copyright Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "High Court Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Supreme Court Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Forums and Tribunal Matters", subtitle: "", image: "/assets/image10.png" },
  { title: "Business Matters", subtitle: "", image: "/assets/image10.png" },
];

// 🎨 Unique text colors per category
const titleColors = [
  "text-[#FF6B6B]", // Civil Matters
  "text-[#1E90FF]", // Criminal Matters
  "text-[#FF9F1C]", // Family Matters
  "text-[#6C63FF]", // Labour/Employee Matters
  "text-[#2EC4B6]", // Taxation Matters
  "text-[#FF66B3]", // Documentation
  "text-[#00B4D8]", // Trademark
  "text-[#06D6A0]", // High Court
  "text-[#E85D04]", // Supreme Court
  "text-[#8AC926]", // Forums
  "text-[#F15BB5]", // Business
];

function CategoryCard({
  title,
  subtitle,
  image,
  colorIndex,
  onExplore,
}: Category & { colorIndex: number; onExplore: (category: string) => void }) {
  const titleColor = titleColors[colorIndex % titleColors.length];

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* ----- Desktop / Tablet version (with image) ----- */}
      <div className="hidden sm:block group relative w-full overflow-hidden rounded-2xl">
        <div className="relative aspect-[4/3] w-full">
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* White bottom panel */}
          <div
            className="
              absolute bottom-0 right-0 left-0
              h-1/2 bg-white
              px-5 pt-3 pb-4
              [border-top-left-radius:48px]
            "
          >
            <h3 className={`line-clamp-2 text-base font-semibold ${titleColor}`}>
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
            )}

            <div className="mt-3">
              <button
                onClick={() => onExplore(title)}
                className="
                  inline-block rounded-full px-4 py-2 text-xs font-semibold
                  text-white bg-[#FFA800]
                  shadow-sm transition
                  hover:bg-[#FFB800] hover:translate-y-[-1px] hover:shadow-md
                "
              >
                Explore Now!
              </button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
      </div>

      {/* ----- Mobile version (no image) ----- */}
      <div className="block sm:hidden bg-white px-4 py-5 rounded-2xl shadow-sm text-center">
        <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{subtitle}</p>
        )}

        <button
          onClick={() => onExplore(title)}
          className="
            mt-3 w-full rounded-full bg-[#FFA800]
            px-4 py-2 text-xs font-semibold text-white
            transition hover:bg-[#FFB800]
          "
        >
          Explore Now!
        </button>
      </div>
    </div>
  );
}

export default function BrowseByCategoryPage({
  onCategoryClick,
}: {
  onCategoryClick?: (category: string) => void;
}) {
  const handleExplore = (category: string) => {
    if (onCategoryClick) onCategoryClick(category);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">
          Browse By Category
        </h2>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Over 10 Categories To Select From
        </p>
      </div>

      {/* Grid: 2 cards per row on mobile, 3 md, 4 lg */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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