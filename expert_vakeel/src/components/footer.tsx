// src/components/Footer.tsx
"use client";

import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const WRAP = "mx-auto w-full max-w-[1280px] px-4 sm:px-5 lg:px-6";
const TITLE = "mb-3 text-[13px] sm:text-[15px] font-semibold text-white tracking-tight";
const LINK =
  "text-xs sm:text-sm leading-6 text-gray-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded break-words";

type Item =
  | string
  | { label: string; to?: string; href?: string; external?: boolean };

type Column = { title: string; items: Item[] };

const COLUMNS: Column[] = [
  { title: "Find By Services", items: [ "Cheque Bounce Cases","Property Dispute Cases","Money Recovery Disputes","Mutual Consent Divorce Cases","Maternity Benefit Cases","Family Property Dispute Cases","Landlord Tenant Disputes","Name Change Cases","Succession Certificate","Defamation Cases","Theft / Robbery","Summons / Warrants","Will Drafting","Power Of Attorney","Labour Union Matters","Service Matters" ]},
  { title: "Queries", items: [
    { label: "Ask Legal Queries", to: "/querypage" },
    { label: "Explore Answered Queries", to: "/querypage" },
    { label: "Family Matters Queries", to: "/querypage" },
    { label: "High Court Queries", to: "/querypage" },
    { label: "Supreme Court Queries", to: "/querypage" },
    { label: "Civil Matters Queries", to: "/querypage" },
    { label: "Criminal Matters Queries", to: "/querypage" },
    { label: "Taxation Matters Queries", to: "/querypage" },
    { label: "View All", to: "/querypage" }
  ]},
  { title: "Find By Specialization", items: [ "Family Matters","Criminal Matters","Supreme Court Matters","Labour / Employee Matters","Taxation Matters","Documentation & Registrations","Trademark & Copyright Matters","Forums & Tribunal Matters","Business Matters","High Court Matters","Civil Matters" ]},
  { title: "Find By City", items: [ "Lawyers In New Delhi","Lawyers In Mumbai","Lawyers In Pune","Lawyers In Noida","Lawyers In Gurugram","Lawyers In Chennai","Lawyers In Kolkata","Lawyers In Chandigarh","Lawyers In NCR" ]},
  { title: "Quick Links", items: [
    { label: "My Queries", to: "/querypage" },
    { label: "About Expert Vakeel", to: "/about" },
    { label: "Privacy Policy", to: "/privacypolicy", external: false },
    { label: "Terms Of Use", href: "#", external: false },
    { label: "Help & Support", to: "/support" },
    { label: "Blogs", to: "/blogs" },
    { label: "FAQs", to: "/support" },
    { label: "Download Our App For Lawyers", href: "#", external: false }
  ]},
];

const SOCIAL = [
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "Twitter", icon: Twitter, href: "#" },
  { label: "LinkedIn", icon: Linkedin, href: "#" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0B] text-gray-300 overflow-x-hidden" role="contentinfo">
      <div className={`${WRAP} py-8 sm:py-10`}>
        {/* ⬇️ two columns by default, 3 on md, 5 on lg */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-5 [&>*]:min-w-0">
          {COLUMNS.map((col) => (
            <Column key={col.title} {...col} />
          ))}
        </div>

        {/* keep this section single-column on mobile */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
          <section aria-labelledby="download-app">
            <h3 id="download-app" className={TITLE}>Download Our App For Lawyers</h3>
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-4 sm:p-5">
              <p className="text-base sm:text-lg font-semibold text-white">Download Our App</p>
              <p className="text-xs sm:text-sm text-gray-400">Available For All Devices</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StoreBadge store="google" />
                <StoreBadge store="apple" />
              </div>
            </div>
          </section>

          <section className="lg:col-span-2" aria-labelledby="social-links">
            <h3 id="social-links" className={TITLE}>Social</h3>
            <div className="flex flex-wrap items-center gap-3">
              {SOCIAL.map(({ label, icon: Icon, href }) => (
                <a key={label} href={href} aria-label={label}
                   className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className={`${WRAP} py-4 text-center text-[11px] sm:text-xs text-gray-400`}>
          Copyright 2025 By Expert Vakeel. Powered By Legal Network. All Rights Reserved
        </div>
      </div>
    </footer>
  );
}

/* ---------- Subcomponents ---------- */

const Column = memo(function Column({ title, items }: Column) {
  const navigate = useNavigate();
  const id = title.replace(/\s+/g, "-").toLowerCase();

  const getFilterParams = (label: string, section: string) => {
    if (section === "Find By Services") {
      const map: Record<string, string> = {
        "Cheque Bounce Cases": "Civil Matters",
        "Property Dispute Cases": "Civil Matters",
        "Money Recovery Disputes": "Civil Matters",
        "Mutual Consent Divorce Cases": "Family Matters",
        "Maternity Benefit Cases": "Labour/Employee Matters",
        "Family Property Dispute Cases": "Family Matters",
        "Landlord Tenant Disputes": "Civil Matters",
        "Name Change Cases": "Civil Matters",
        "Succession Certificate": "Civil Matters",
        "Defamation Cases": "Civil Matters",
        "Theft / Robbery": "Criminal Matters",
        "Summons / Warrants": "Criminal Matters",
        "Will Drafting": "Civil Matters",
        "Power Of Attorney": "Civil Matters",
        "Labour Union Matters": "Labour/Employee Matters",
        "Service Matters": "Labour/Employee Matters",
      };
      return map[label] ? `?specialization=${encodeURIComponent(map[label])}` : "";
    }
    if (section === "Find By Specialization") {
      const map: Record<string, string> = {
        "Family Matters": "Family Matters",
        "Criminal Matters": "Criminal Matters",
        "Supreme Court Matters": "Supreme Court Matters",
        "Labour / Employee Matters": "Labour/Employee Matters",
        "Taxation Matters": "Taxation Matters",
        "Documentation & Registrations": "Documentation & Registration",
        "Trademark & Copyright Matters": "Trademark & Copyright Matters",
        "Forums & Tribunal Matters": "Forums and Tribunal Matters",
        "Business Matters": "Business Matters",
        "High Court Matters": "High Court Matters",
        "Civil Matters": "Civil Matters",
      };
      return map[label] ? `?specialization=${encodeURIComponent(map[label])}` : "";
    }
    if (section === "Find By City") {
      const cityMap: Record<string, string> = {
        "New Delhi": "Delhi",
        "Mumbai": "Mumbai",
        "Pune": "Pune",
        "Noida": "Delhi", // Noida is part of NCR/Delhi region
        "Gurugram": "Delhi", // Gurugram is part of NCR/Delhi region
        "Chennai": "Chennai",
        "Kolkata": "Kolkata",
        "Chandigarh": "Chandigarh",
        "NCR": "Delhi", // NCR maps to Delhi region
      };
      const m = label.match(/Lawyers In (.+)/);
      const extractedCity = m ? m[1] : "";
      const mappedCity = cityMap[extractedCity] || extractedCity;
      return mappedCity ? `?city=${encodeURIComponent(mappedCity)}` : "";
    }
    return "";
  };

  return (
    <nav aria-labelledby={id} className="min-w-0">
      <h2 id={id} className={TITLE}>{title}</h2>
      <ul className="space-y-1.5 sm:space-y-2">
        {items.map((it) => {
          const obj: Exclude<Item, string> =
            typeof it === "string" ? { label: it, to: "#" } : it;

          const filterable =
            title === "Find By Services" ||
            title === "Find By Specialization" ||
            title === "Find By City";

          if (obj.href) {
            return (
              <li key={obj.label} className="min-w-0">
                <a href={obj.href} rel={obj.external ? "noopener noreferrer" : undefined}
                   target={obj.external ? "_blank" : undefined}
                   className={`${LINK} block`}>{obj.label}</a>
              </li>
            );
          }

          if (filterable && !obj.label.includes("View All")) {
            return (
              <li key={obj.label} className="min-w-0">
                <button
                  onClick={() => {
                    const q = getFilterParams(obj.label, title);
                    if (q) {
                      navigate(`/findprofile${q}`);
                      // Ensure scroll to top
                      setTimeout(() => window.scrollTo(0, 0), 0);
                    }
                  }}
                  className={`${LINK} block text-left w-full`}
                >
                  {obj.label}
                </button>
              </li>
            );
          }

          return (
            <li key={obj.label} className="min-w-0">
              <Link
                to={obj.to ?? "#"}
                className={`${LINK} block`}
                onClick={() => {
                  // Ensure scroll to top for Link navigation
                  if (obj.to && obj.to !== "#") {
                    setTimeout(() => window.scrollTo(0, 0), 0);
                  }
                }}
              >
                {obj.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

const StoreBadge = memo(function StoreBadge({ store }: { store: "google" | "apple" }) {
  const isGoogle = store === "google";
  return (
    <a
      href="#"
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-black px-3.5 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-4 sm:py-2.5"
    >
      {isGoogle ? (
        <svg viewBox="0 0 512 512" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" aria-hidden>
          <path d="M325.3 234.3L96.5 29.5C86.6 21 73.7 16 60 16l250.7 246.3 14.6-28zM60 496c13.7 0 26.6-5 36.5-13.5l228.8-204.8-14.6-28L60 496zM448 256c0-18.1-9.7-35-25.5-44.2l-60.1-35.3-27.3 27.3 25.8 52.2-25.8 52.2 27.3 27.3 60.1-35.3C438.3 291 448 274.1 448 256z" />
        </svg>
      ) : (
        <svg viewBox="0 0 384 512" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" aria-hidden>
          <path d="M318.7 268.7c-.5-54.1 44.2-79.9 46.3-81.2-25.2-36.9-64.3-42-78.3-42.4-33.4-3.4-65.1 19.7-82 19.7-17.1 0-43.1-19.2-71-18.7-36.4.5-70 21.1-88.7 53.6-37.7 65.4-9.6 162 27.1 215 18 26 39.4 55.2 67.6 54 27.3-1.1 37.8-17.5 70.9-17.5 33.1 0 42.6 17.5 71.1 17.1 29.5-.5 48.2-26.7 66.1-52.8 20.8-30.4 29.5-59.9 30-61.4-.7-.3-57.6-22.1-58.1-87.4zM257.3 79.8c14.9-18.1 25-43.4 22.3-68.8-21.6.9-47.9 14.4-63.4 32.5-13.9 16.1-26.1 41.9-22.9 66.6 24.2 1.9 49.1-12.3 64-30.3z" />
        </svg>
      )}
      <span className="leading-tight">
        <span className="block text-[9px] sm:text-[10px] uppercase text-gray-300">Get it on</span>
        <span className="block text-[12px] sm:text-sm font-semibold text-white">
          {isGoogle ? "Google Play" : "App Store"}
        </span>
      </span>
    </a>
  );
});
