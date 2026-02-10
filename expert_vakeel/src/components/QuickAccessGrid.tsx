import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { serviceAPI, type Service } from "../services/api";
import { LayoutGrid } from "lucide-react";

export default function QuickAccessGrid() {
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
        <div className="mx-auto max-w-screen-xl px-4 py-4">
            <div className="grid grid-cols-4 gap-y-12 gap-x-4 sm:gap-x-12 sm:gap-y-16">
                {items.map((item, idx) => {
                    const service = findService(item.label);
                    const iconUrl = service?.image || item.localIcon;
                    const path = getPath(item);

                    return (
                        <Link
                            key={idx}
                            to={path}
                            className="group relative flex cursor-pointer flex-col items-center text-center transition-all"
                        >
                            {/* ICON BOX */}
                            <div
                                className="
                                    relative mb-4
                                    flex h-20 w-20 items-center justify-center
                                    rounded-[2rem] bg-[#F8F9FA]
                                    shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)]
                                    transition-all duration-500 ease-out
                                    group-hover:rotate-[6deg]
                                    group-hover:scale-110
                                    group-hover:shadow-[0_20px_40px_-12px_rgba(255,168,0,0.2)]
                                    group-hover:bg-white
                                    sm:h-28 sm:w-28
                                    overflow-hidden
                                "
                            >
                                {/* Decorative Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFA800]/0 to-[#FFA800]/0 group-hover:from-[#FFA800]/5 group-hover:to-transparent transition-all duration-500" />

                                {item.label === "More Services" ? (
                                    <div className="relative z-10 p-4 rounded-2xl bg-gray-50 group-hover:bg-[#FFA800]/10 transition-colors">
                                        <LayoutGrid className="h-8 w-8 text-[#1a365d] transition-transform duration-500 group-hover:scale-110 sm:h-12 sm:w-12 group-hover:text-[#FFA800]" />
                                    </div>
                                ) : (
                                    <img
                                        src={iconUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`}
                                        alt={item.label}
                                        className="relative z-10 h-12 w-12 sm:h-16 sm:w-16 object-contain transition-all duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`;
                                        }}
                                    />
                                )}

                                {/* Hover Dot */}
                                <div className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#FFA800] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* TITLE */}
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-[#1a365d] leading-snug sm:text-[15px] max-w-[90px] sm:max-w-none transition-all duration-300 group-hover:text-[#FFA800] group-hover:translate-y-[-2px]">
                                    {item.label}
                                </span>
                                {/* Subtle indicator line */}
                                <div className="mt-1.5 h-0.5 w-0 bg-[#FFA800] rounded-full transition-all duration-300 group-hover:w-8" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
