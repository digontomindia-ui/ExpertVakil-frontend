// app/whyexpertVakeel.tsx

type Feature = {
  icon: string;
  title: string;
  desc: string;
  alt: string;
};

const FEATURES: Feature[] = [
  {
    icon: "/assets/vector1.png",
    title: "Get Connected For Free",
    desc:
      "Connect with lawyers & law firms to discuss your legal matters for free",
    alt: "Connected chain icon",
  },
  {
    icon: "/assets/vector2.png",
    title: "Real Time Conversations",
    desc: "Chat with lawyers & firms live on the go",
    alt: "Chat bubbles icon",
  },
  {
    icon: "/assets/vector3.png",
    title: "Filters & Search Functionalities",
    desc:
      "Use over 15+ filters & search functionality to find relevant profiles for your legal matter",
    alt: "Filter sliders icon",
  },
  {
    icon: "/assets/vector4.png",
    title: "Ask Your Queries",
    desc: "Ask your queries to experts & get your answers lightning fast",
    alt: "People asking queries icon",
  },
];

export default function WhyExpertVakeel() {
  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:py-12 md:py-14 lg:py-16">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl md:text-4xl">
            Why Expert Vakeel
          </h1>
          <p className="mt-2 text-xs text-gray-500 sm:text-sm">
            Get Connected With Manually Verified Profiles &amp; Law Firms
          </p>
        </div>

        {/* Features */}
        <div
          className="
            mt-8 flex gap-4 overflow-x-auto pb-4
            sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible
            lg:grid-cols-4 lg:gap-8
          "
        >
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="
                min-w-[260px] sm:min-w-0
                group rounded-[22px] bg-[#F5F6F7] p-6
                shadow-[0_0_0_1px_rgba(0,0,0,0.03)]
                transition hover:shadow-md sm:rounded-[28px] sm:p-7 lg:p-8
              "
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 grid h-35 w-35 place-items-center sm:h-32 sm:w-32">
                  <img
                    src={f.icon}
                    alt={f.alt}
                    className="h-16 w-16 sm:h-20 sm:w-20"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <h3 className="text-base font-semibold text-gray-800 sm:text-lg">
                  {f.title}
                </h3>

                <p className="mt-2 max-w-[32ch] text-[12px] leading-5 text-gray-600 sm:max-w-[28ch] sm:text-xs md:text-sm">
                  {f.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
