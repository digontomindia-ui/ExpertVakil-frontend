import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User2, Menu, X } from "lucide-react";
import useAuth from "../hooks/useAuth";

const NAV_ITEMS = [
  { label: "Find Lawyers & Law Firms", to: "/findprofile" },
  { label: "Ask Queries", to: "/querypage" },
  { label: "Blogs", to: "/blogs" },
  { label: "Lawyer Signup", href: "https://www.google.com" },
  { label: "Help Centre", to: "/support" },
] as const;

export default function Header() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Clear search when navigating to a different page
  useEffect(() => {
    setQ(""); // Clear search on component mount
  }, []);

  // Simple auto-search on Enter key or after typing
  useEffect(() => {
    if (q.trim()) {
      const timeoutId = setTimeout(() => {
        setOpen(false);
        navigate(`/findprofile?search=${encodeURIComponent(q.trim())}`);
      }, 800); // 800ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [q, navigate]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-screen-xl px-4 py-3">
        {/* Top Row with Logo and Auth */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src="/assets/Group1.png"
              alt="Expert Vakeel"
              className="h-13 w-auto select-none"
              draggable={false}
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-8">
              {NAV_ITEMS.map((n) => {
                // Special case: Ask Queries requires login
                if (n.label === "Ask Queries" && !user) {
                  return (
                    <button
                      key={`${n.label}-guest`}
                      onClick={() => navigate("/login")}
                      className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
                    >
                      {n.label}
                    </button>
                  );
                }

                // External link (href) -> <a>
                if ("href" in n && n.href) {
                  return (
                    <a
                      key={`${n.label}-href`}
                      href={n.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
                    >
                      {n.label}
                    </a>
                  );
                }

                // Internal link (to) -> <Link>
                return (
                  <Link
                    key={`${n.label}-to`}
                    to={(n as any).to}
                    className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            {/* {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Hello, {user.name || (user as any).fullName}
                </span>
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="rounded-lg bg-[#FFA800] px-4 py-2 text-sm font-semibold text-black hover:bg-[#FFB524] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-[#FFA800] px-4 py-2 text-sm font-semibold text-black hover:bg-[#FFB524] transition-colors"
              >
                <User2 className="h-4 w-4" />
                <span>Login / Sign Up</span>
              </Link>
            )} */}
          </div>

          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((s) => !s)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Search Bar Row */}
        {/* <div className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const term = q.trim();
              if (term) {
                setOpen(false);
                navigate(`/findprofile?search=${encodeURIComponent(term)}`);
              }
            }}
            className="relative w-full max-w-2xl mx-auto"
          >
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search lawyers, law firms, or legal services..."
              aria-label="Search"
              className="h-12 w-full rounded-full bg-gray-100 pl-12 pr-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-2 focus:ring-[#FFA800]/50"
            />
          </form>
        </div> */}
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden border-t border-gray-200 transition-all duration-300 ease-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-3">
          <nav className="space-y-2">
            {NAV_ITEMS.map((n) => {
              if (n.label === "Ask Queries" && !user) {
                return (
                  <button
                    key={`${n.label}-mobile-guest`}
                    onClick={() => {
                      setOpen(false);
                      navigate("/login");
                    }}
                    className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
                  >
                    {n.label}
                  </button>
                );
              }

              if ("href" in n && n.href) {
                return (
                  <a
                    key={`${n.label}-mobile-href`}
                    href={n.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
                  >
                    {n.label}
                  </a>
                );
              }

              return (
                <Link
                  key={`${n.label}-mobile-to`}
                  to={(n as any).to}
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
                >
                  {n.label}
                </Link>
              );
            })}

            {/* {user ? (
              <div className="mt-4 space-y-2">
                <div className="px-4 py-2 text-sm text-gray-600">
                  Hello, {user.name || (user as any).fullName}
                </div>
                <button
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                    navigate("/login");
                  }}
                  className="w-full rounded-lg bg-[#FFA800] px-4 py-3 text-sm font-semibold text-black hover:bg-[#FFB524] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFA800] px-4 py-3 text-sm font-semibold text-black hover:bg-[#FFB524] transition-colors"
              >
                <User2 className="h-4 w-4" />
                Login / Sign Up
              </Link>
            )} */}
          </nav>
        </div>
      </div>
    </header>
  );
}
