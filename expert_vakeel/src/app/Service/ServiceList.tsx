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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredServices.map((service, index) => {
              // Compute logo path dynamically
              const logoPath = `/assets/services_logo/p${index + 1}.png`;

              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  className="
  group cursor-pointer
  flex items-center gap-3 sm:gap-4
  rounded-2xl bg-white
  border border-gray-100
  px-3 py-3 sm:px-5 sm:py-4
  shadow-sm
  transition-all duration-300
  hover:-translate-y-[2px]
  hover:shadow-md
"
                >
                  {/* LEFT ICON / LOGO */}
                  <div
                    className="
    flex h-10 w-10 sm:h-15 sm:w-15
    shrink-0 items-center justify-center
    rounded-xl
    bg-blue-50
    transition
    group-hover:bg-blue-50
  "
                  >
                    <img
                      src={logoPath}
                      alt={service.name}
                      className="h-10 w-10 sm:h-15 sm:w-15 object-contain"
                    />
                  </div>

                  {/* TITLE */}
                  <h3
                    className="
    text-sm sm:text-lg
    font-semibold text-gray-900
    leading-tight
    line-clamp-2
  "
                  >
                    {service.name}
                  </h3>

                  {/* RIGHT ARROW */}
                  <ArrowRight className="ml-auto h-5 w-5 text-blue-500 opacity-0 transition group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
