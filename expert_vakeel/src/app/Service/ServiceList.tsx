import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { serviceAPI, type Service } from "../../services/api";
import { Loader, ArrowRight } from "lucide-react";

export default function ServiceList() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

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

  // Helper function to get image URL - use service.image if available, otherwise fallback to default
  const getServiceImage = useCallback((service: Service, index: number): string => {
    // If image already failed, use fallback directly
    if (service.image && failedImages.has(service.id)) {
      return `/assets/services_logo/p${(index % 10) + 1}.png`;
    }
    if (service.image && service.image.trim()) {
      return service.image;
    }
    // Fallback to default images based on index (mod 10 to cycle through available images)
    return `/assets/services_logo/p${(index % 10) + 1}.png`;
  }, [failedImages]);

  // Handle image error - mark as failed and don't retry
  const handleImageError = useCallback((serviceId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    // Prevent infinite loop by only handling error once per service
    if (!failedImages.has(serviceId)) {
      setFailedImages(prev => new Set([...prev, serviceId]));
    }
    // Hide the broken image
    (e.target as HTMLImageElement).style.display = 'none';
  }, [failedImages]);

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
    <div className="bg-white py-6 sm:py-10">
      <div className="mx-auto max-w-screen-xl px-4">
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
          <div className="grid grid-cols-4 gap-y-12 gap-x-3 sm:gap-x-8 sm:gap-y-16">
            {filteredServices.map((service, index) => {
              const logoPath = getServiceImage(service, index);

              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  className="group flex cursor-pointer flex-col items-center text-center transition-all"
                >
                  {/* ICON BOX */}
                  <div
                    className="
                      relative mb-4
                      flex h-16 w-16 items-center justify-center
                      rounded-3xl bg-[#F4F6F8]
                      shadow-sm
                      transition-all duration-300
                      group-hover:translate-y-[-5px]
                      group-hover:shadow-md
                      group-hover:bg-white
                      sm:h-24 sm:w-24
                    "
                  >
                    <img
                      src={logoPath}
                      alt={service.name}
                      className="h-10 w-10 object-contain transition-transform duration-500 group-hover:scale-110 sm:h-14 sm:w-14"
                      onError={(e) => handleImageError(service.id, e)}
                    />
                  </div>

                  {/* TITLE */}
                  <h3
                    className="
                      text-[12px] font-bold text-[#444]
                      leading-[1.3] sm:text-[14px]
                      max-w-[100px] sm:max-w-[140px]
                      transition-colors group-hover:text-[#FFA800]
                    "
                  >
                    {service.name}
                  </h3>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


