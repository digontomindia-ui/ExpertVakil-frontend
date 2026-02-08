import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Loader } from "lucide-react";
import { serviceAPI, type Service } from "../services/api";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const navigate = useNavigate();
  const servicesRef = useRef<HTMLDivElement>(null);

  // Handle sticky profile on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await serviceAPI.getAll();
        if (response.data.success && response.data.data) {
          setServices(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    };

    if (servicesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [servicesOpen]);

  // Navigate to service page
  const handleServiceClick = (serviceId: string) => {
    setServicesOpen(false);
    setMobileServicesOpen(false);
    setOpen(false);
    navigate(`/service/${serviceId}`);
  };

  return (
    <header className={`z-50 w-full transition-all duration-300 ${isScrolled ? "fixed top-0 bg-white shadow-md border-b" : "relative bg-white"}`}>
      <div className={`mx-auto max-w-screen-xl px-4 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        {/* Main Row */}
        <div className="flex items-center justify-between">
          {/* Left: Logo (horizontal) */}
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src="/assets/logo_horizontal.png"
              alt="ExpertVakeel"
              className={`transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10 md:h-12'}`}
              draggable={false}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 lg:flex">
            <nav className="flex items-center gap-6">

              {/* Services Dropdown */}
              <div ref={servicesRef} className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
                >
                  Services
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {servicesOpen && (
                  <div
                    onMouseLeave={() => setServicesOpen(false)}
                    className="absolute left-0 top-full mt-2 w-[480px] rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-gray-50 pb-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1a365d]">Our Legal Services</h4>
                      <Link to="/services" onClick={() => setServicesOpen(false)} className="text-[11px] font-bold text-[#FFA800] hover:underline">VIEW ALL</Link>
                    </div>

                    {loadingServices ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader className="h-6 w-6 animate-spin text-[#FFA800]" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {services.length > 0 ? (
                          services.map((service) => (
                            <button
                              key={service.id}
                              onClick={() => handleServiceClick(service.id)}
                              className="group flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1a365d] transition-all"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-gray-200 group-hover:bg-[#FFA800] transition-colors" />
                              <span className="font-medium truncate">{service.name}</span>
                            </button>
                          ))
                        ) : (
                          <p className="col-span-2 text-center text-xs text-gray-400 py-4">No services available</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Find Advocates */}
              <Link
                to="/findprofile"
                className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
              >
                Find Advocates
              </Link>

              {/* Ask a Question */}
              <Link
                to="/queries"
                className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
              >
                Ask a Question
              </Link>

              {/* Check Challan */}
              {/* <Link
                to="/challan-status"
                className="text-sm font-black text-[#1a365d] hover:text-[#FFA800] transition-colors bg-blue-50 px-3 py-1 rounded-full border border-blue-100"
              >
                Check Challan
              </Link> */}

              {/* Lawyer Signup */}
              <Link
                to="/signup"
                className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
              >
                Lawyer Signup
              </Link>

              {/* Login / Register */}
              {/* <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-[#FFA800] transition-colors"
              >
                Login / Register
              </Link> */}
            </nav>
          </div>

          {/* Mobile: Hamburger Menu */}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((s) => !s)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`lg:hidden overflow-hidden border-t border-gray-200 transition-all duration-300 ease-out ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-4 pb-4 pt-3">
          <nav className="space-y-1">

            {/* Services (Expandable) */}
            <div>
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Services
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
              </button>

              {mobileServicesOpen && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-100 pl-4 max-h-60 overflow-y-auto">
                  {loadingServices ? (
                    <div className="flex items-center py-2">
                      <Loader className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : services.length > 0 ? (
                    <>
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleServiceClick(service.id)}
                          className="block w-full text-left rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
                        >
                          {service.name}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-400">No services found</div>
                  )
                  }
                </div>
              )}
            </div>

            {/* Find Advocates */}
            <Link
              to="/findprofile"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
            >
              Find Advocates
            </Link>

            {/* Ask a Question */}
            <Link
              to="/queries"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
            >
              Ask a Question
            </Link>

            {/* Check Challan */}
            {/* <Link
              to="/challan-status"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-4 py-3 text-sm font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 transition-colors border-l-4 border-blue-600"
            >
              Check Challan
            </Link> */}

            {/* Login / Register */}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
            >
              Login / Register
            </Link>

            {/* Lawyer Signup */}
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FFA800] transition-colors"
            >
              Lawyer Signup
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
