import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { serviceAPI, type Service } from "../../services/api";
import { Loader, ArrowRight } from "lucide-react";

export default function ServiceList() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await serviceAPI.getAll();

        if (response.data.success && response.data.data) {
          setServices(response.data.data);
        } else {
          throw new Error("Failed to load services");
        }
      } catch (err) {
        console.error("Error loading services:", err);
        setError("Unable to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    const refreshKey = "service_list_refresh";
    let refreshCount = parseInt(sessionStorage.getItem(refreshKey) || "0");
    const maxRefreshes = 2;

    if (refreshCount < maxRefreshes) {
      refreshCount++;
      sessionStorage.setItem(refreshKey, refreshCount.toString());

      const timer = setTimeout(() => {
        window.location.reload();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      sessionStorage.removeItem(refreshKey);
    }
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const query = searchQuery.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.categories.some((cat) => cat.toLowerCase().includes(query)),
    );
  }, [services, searchQuery]);

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
            <Loader className="relative inline-block animate-spin h-10 w-10 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            Finding the best services for you...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Something went wrong
          </h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="relative mx-auto mt-2 max-w-7xl px-4 sm:px-6 lg:px-8">
        {filteredServices.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-8 w-8 text-blue-400"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No services found
            </h3>
            <p className="mt-2 text-gray-500">
              We couldn't find any services matching "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-y-6 gap-x-2 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
            {filteredServices.map((service, index) => {
              // Compute logo path dynamically
              const logoPath = `/assets/services_logo/p${index + 1}.png`;

              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  className="
                    group cursor-pointer
                    flex flex-col items-center gap-2
                    sm:flex-row sm:gap-4
                    transition-all duration-300
                  "
                >
                  {/* ICON BOX */}
                  <div
                    className="
                      relative
                      flex h-14 w-14 sm:h-16 sm:w-16
                      shrink-0 items-center justify-center
                      rounded-2xl
                      bg-gray-50
                      border border-gray-100/50
                      shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
                      transition-all duration-300
                      group-hover:translate-y-[-4px]
                      group-hover:shadow-lg
                      group-hover:border-[#FFA800]/30
                      group-hover:bg-white
                    "
                  >
                    <img
                      src={logoPath}
                      alt={service.name}
                      className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Subtle Brand Accent on Hover */}
                    <div className="absolute bottom-0 h-0.5 w-0 bg-[#FFA800] transition-all duration-300 group-hover:w-1/2" />
                  </div>

                  {/* TITLE */}
                  <div className="flex flex-col sm:items-start items-center overflow-hidden">
                    <h3
                      className="
                        text-[10.5px] sm:text-lg
                        font-semibold text-gray-800
                        leading-[1.2] text-center sm:text-left
                        line-clamp-2
                        transition-colors group-hover:text-[#FFA800]
                      "
                    >
                      {service.name}
                    </h3>
                    <div className="mt-1 hidden sm:flex items-center gap-1 text-[12px] font-medium text-[#FFA800] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      Explore <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
