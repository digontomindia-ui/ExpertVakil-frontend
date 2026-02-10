import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { serviceAPI, type Service } from "../services/api";
import { LayoutGrid } from "lucide-react";

export default function QuickAccessGrid() {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await serviceAPI.getAll();
                if (response.data.success) {
                    setServices(response.data.data);
                }
            } catch (err) {
                console.error("Error fetching services for grid:", err);
            }
        };
        fetchServices();
    }, []);

    const findService = useCallback((label: string) => {
        return services.find(s =>
            s.name.toLowerCase().trim() === label.toLowerCase().trim()
        );
    }, [services]);

    const getPath = (item: { label: string, path: string }) => {
        if (item.label === "Traffic Challan") return "/challan-status";
        if (item.label === "More Services") return "/services";

        const service = findService(item.label);
        if (service) return `/service/${service.id}`;

        return item.path;
    };

    const items = [
        { label: "Legal Matters", localIcon: "/assets/services_logo/p1.png", path: "/services" },
        { label: "Marriage Registration", localIcon: "/assets/services_logo/p2.png", path: "/services" },
        { label: "Civil Disputes", localIcon: "/assets/services_logo/p3.png", path: "/services" },
        { label: "Business & Contracts", localIcon: "/assets/services_logo/p4.png", path: "/services" },
        { label: "Domestic Violence", localIcon: "/assets/services_logo/p5.png", path: "/services" },
        { label: "Consumer Complaints", localIcon: "/assets/services_logo/p6.png", path: "/services" },
        { label: "Traffic Challan", localIcon: "/assets/services_logo/p7.png", path: "/challan-status" },
        { label: "Cheque Bounce", localIcon: "/assets/services_logo/p8.png", path: "/services" },
        { label: "Property / Land Disputes", localIcon: "/assets/services_logo/p9.png", path: "/services" },
        { label: "Criminal / Bail / FIR", localIcon: "/assets/services_logo/p10.png", path: "/services" },
        { label: "Divorce & Family Matters", localIcon: "/assets/services_logo/p11.png", path: "/services" },
        { label: "More Services", localIcon: "", path: "/services" },
    ];

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8">
            <div className="grid grid-cols-4 gap-y-10 gap-x-2 sm:gap-x-6 sm:gap-y-12">
                {items.map((item, idx) => {
                    const service = findService(item.label);
                    const iconUrl = service?.image || item.localIcon;

                    return (
                        <button
                            key={idx}
                            onClick={() => navigate(getPath(item))}
                            className="group flex cursor-pointer flex-col items-center text-center transition-all"
                        >
                            {/* ICON BOX */}
                            <div
                                className="
                                    relative mb-3
                                    flex h-16 w-16 items-center justify-center
                                    rounded-3xl bg-[#F8F9FA]
                                    shadow-[0_4px_12px_rgba(0,0,0,0.02)]
                                    transition-all duration-300
                                    group-hover:translate-y-[-4px]
                                    group-hover:shadow-lg
                                    group-hover:bg-white
                                    sm:h-24 sm:w-24
                                "
                            >
                                {item.label === "More Services" ? (
                                    <LayoutGrid className="h-8 w-8 text-[#1a365d] transition-transform duration-500 group-hover:scale-110 sm:h-10 sm:w-10" />
                                ) : (
                                    <img
                                        src={iconUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`}
                                        alt={item.label}
                                        className="h-10 w-10 sm:h-14 sm:w-14 object-contain transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            // Final fallback if both API and local icon fail
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`;
                                        }}
                                    />
                                )}
                            </div>

                            {/* TITLE */}
                            <span className="text-[11px] font-bold text-[#4a4a4a] leading-tight sm:text-[14px] max-w-[80px] sm:max-w-none transition-colors group-hover:text-[#FFA800]">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
