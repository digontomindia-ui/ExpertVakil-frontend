"use client";

type Feature = {
  title: string;
  desc: string;
  bullets?: string[];
};

type PlatformPoint = { title: string; desc: string };

const ABOUT_DATA = {
  title: "About Expert Vakeel",
  intro:
    "Expert Vakeel is a next-generation legal tech platform that connects individuals and businesses with verified lawyers and law firms across India. Built with simplicity and transparency at its core, the platform makes legal assistance more accessible, reliable, and convenient for everyone.",
  keyFeatures: [
    {
      title: "Smart Search & Filters",
      desc:
        "Users can easily discover lawyers and firms based on location, years of experience, courts of practice, areas of specialization, and ratings. This ensures that people find the most relevant legal professional for their specific case or query.",
    },
    {
      title: "Comprehensive Lawyer Profiles",
      desc:
        "Each registered lawyer and firm has a detailed profile displaying:",
      bullets: [
        "Years of professional experience",
        "Specializations and practice areas",
        "Courts they regularly appear in",
        "Educational and career background",
        "Bio/summary about their expertise",
        "Ratings and reviews from previous clients",
      ],
    },
  ] as Feature[],
  insight:
    "These insights empower users to make informed decisions before engaging a lawyer.",
  platform: [
    {
      title: "Direct Chat with Lawyers & Firms",
      desc:
        "Through the integrated chat feature, users can directly communicate with registered lawyers and law firms. This makes it possible to discuss cases, seek advice, or schedule consultations instantly—eliminating delays and improving access to justice.",
    },
    {
      title: "Legal Query Posting",
      desc:
        "Users can post their legal questions publicly on the platform. These queries can then be answered by verified lawyers, creating a knowledge–sharing ecosystem that benefits both the users and the legal community.",
    },
    {
      title: "Rating & Feedback System",
      desc:
        "After consultations or case interactions, users can provide ratings and reviews. This helps maintain transparency and accountability, while also allowing lawyers to build credibility based on client satisfaction.",
    },
  ] as PlatformPoint[],
  whyTitle: "Why Expert Vakeel?",
  whyPoints: [
    "Accessibility: Connect with qualified legal professionals anytime, anywhere.",
    "Transparency: View detailed information and ratings before choosing a lawyer.",
    "Efficiency: Save time by finding and chatting directly with the right expert.",
    "Trustworthy: Only verified and registered lawyers/firms are listed.",
    "Community–driven: Legal queries and answers help build a knowledge hub for all.",
  ],
  visionTitle: "Vision",
  vision:
    "To democratize access to legal services by leveraging technology, making legal help as easy, quick, and trustworthy as booking a doctor’s appointment or ordering a service online.",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 text-xl md:text-2xl font-semibold text-gray-900">
      {children}
    </h2>
  );
}

export default function AboutPage() {
  const d = ABOUT_DATA;

  
  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="mx-auto w-full max-w-4xl px-5 md:px-6 py-8 md:py-12">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
          {d.title}
        </h1>

        {/* Intro */}
        <p className="mt-3 text-[15px] leading-7 text-gray-700">{d.intro}</p>

        {/* Key Features */}
        <SectionHeading>Key Features</SectionHeading>
        <ol className="mt-3 list-decimal pl-6 space-y-4 text-[15px] leading-7 text-gray-700">
          {d.keyFeatures.map((f, i) => (
            <li key={i}>
              <span className="font-semibold text-gray-900">{f.title}</span>
              <span> — {f.desc}</span>
              {f.bullets && (
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {f.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        {/* Insight line */}
        <p className="mt-4 text-[15px] leading-7 text-gray-700">{d.insight}</p>

        {/* Platform Sections (numbered again like in screenshot) */}
        <ol className="mt-4 list-decimal pl-6 space-y-4 text-[15px] leading-7 text-gray-700">
          {d.platform.map((p, i) => (
            <li key={i}>
              <span className="font-semibold text-gray-900">{p.title}</span>
              <span> — {p.desc}</span>
            </li>
          ))}
        </ol>
        
        {/* Why Expert Vakeel */}
        <SectionHeading>{d.whyTitle}</SectionHeading>
        <ul className="mt-3 list-disc pl-6 space-y-1 text-[15px] leading-7 text-gray-700">
          {d.whyPoints.map((w, i) => (
            <li key={i}>{w}</li>
            
          ))}
        </ul>
        
        {/* Vision */}
        <SectionHeading>{d.visionTitle}</SectionHeading>
        <p className="mt-2 text-[15px] leading-7 text-gray-700">{d.vision}</p>
      </div>
    </main>
  );
}
