import { Handshake, MessageCircle, Search, HelpCircle } from "lucide-react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  bg: string;
};

const FEATURES: Feature[] = [
  {
    icon: <Handshake className="h-6 w-6 sm:h-8 sm:w-8" />,
    title: "Get Connected For Free",
    desc: "Seamlessly connect with top-tier advocates to discuss your legal matters without any initial consultation fees.",
    color: "text-[#FFA800]",
    bg: "bg-orange-50",
  },
  {
    icon: <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />,
    title: "Real Time Conversations",
    desc: "Experience instant, secure chat with legal experts live on the go, ensuring your peace of mind anytime, anywhere.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: <Search className="h-6 w-6 sm:h-8 sm:w-8" />,
    title: "Advanced Search Tools",
    desc: "Leverage 15+ precision filters to pinpoint the exact legal expertise required for your unique case requirements.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8" />,
    title: "Ask Your Queries",
    desc: "Post your legal questions to our community of experts and receive authoritative answers with lightning-fast turnaround.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

export default function WhyExpertVakeel() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
      {/* Background Accents */}
      <div className="absolute left-0 top-0 -translate-x-1/2 opacity-20 blur-3xl pointer-events-none">
        <div className="h-96 w-96 rounded-full bg-[#FFA800]/10" />
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Flagship Header */}
        <div className="relative mb-12 flex flex-col items-center text-center sm:mb-20">
          <div className="mb-4 inline-flex items-center rounded-full bg-gray-900 px-4 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              The Legal Advantage
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Why <span className="text-[#FFA800]">Expert Vakil</span>
          </h2>
          <div className="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-[#FFA800] to-orange-300" />
          <p className="mt-8 max-w-2xl text-sm font-medium leading-relaxed text-gray-500 sm:text-lg">
            We bridge the gap between people and world-class legal assistance through a platform built on transparency, speed, and verification.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {FEATURES.map((f, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col rounded-[32px] border border-gray-100 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-[#FFA800]/20"
            >
              {/* Icon Box */}
              <div
                className={`mb-8 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${f.bg} ${f.color}`}
              >
                {f.icon}
              </div>

              {/* Text Content */}
              <div className="flex flex-col">
                <h3 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">
                  {f.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-gray-500">
                  {f.desc}
                </p>
              </div>

              {/* Decorative Accent */}
              <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 bg-gray-50 opacity-0 transition-opacity duration-500 group-hover:opacity-10 pointer-events-none rounded-full" />
            </div>
          ))}
        </div>

        {/* Dynamic Trust Stat - Hidden on smallest mobile if needed, but made responsive */}
        <div className="mt-16 sm:mt-24 rounded-[40px] bg-gray-900 p-8 sm:p-12 lg:p-16 text-center">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-black text-white sm:text-4xl">100%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Verified Advocates</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-black text-white sm:text-4xl">24/7</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expert Support</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-black text-white sm:text-4xl">15+</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Search Filters</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-black text-[#FFA800] sm:text-4xl">Zero</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Platform Fees</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

