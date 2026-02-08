import { useNavigate } from "react-router-dom";

export default function QuickAccessGrid() {
    const navigate = useNavigate();

    const items = [
        { label: "Family", icon: "/assets/services_logo/p1.png", path: "/services?specialization=Family%20Matters" },
        { label: "Criminal", icon: "/assets/services_logo/p2.png", path: "/services?specialization=Criminal%20Matters" },
        { label: "Civil / Property", icon: "/assets/services_logo/p3.png", path: "/services?specialization=Civil%20Matters" },
        { label: "Business", icon: "/assets/services_logo/p4.png", path: "/services?specialization=Business%20Matters" },
        { label: "Documentation", icon: "/assets/services_logo/p5.png", path: "/services?specialization=Documentation%20&%20Registration" },
        { label: "Challan", icon: "/assets/services_logo/p6.png", path: "/challan-status" },
        { label: "Registration", icon: "/assets/services_logo/p7.png", path: "/services" },
        { label: "Ask a Lawyer", icon: "/assets/services_logo/p8.png", path: "/queries" },
        { label: "Legal News", icon: "/assets/services_logo/p9.png", path: "/legal-news" },
        { label: "Recently Answered Questions", icon: "/assets/services_logo/p10.png", path: "/queries" },
    ];

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:hidden">
            <div className="grid grid-cols-2 gap-3">
                {items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(item.path)}
                        className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-50 transition-all hover:shadow-md active:scale-[0.98]"
                    >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl flex items-center justify-center">
                            <img
                                src={item.icon}
                                alt={item.label}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=f3f4f6&color=1e3a8a&font-size=0.33`;
                                }}
                            />
                        </div>
                        <span className="text-[13px] font-extrabold text-[#1a365d] leading-tight text-left">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
