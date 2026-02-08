import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Newspaper, MessageCircle } from "lucide-react";

export default function MobileNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: "Home", icon: Home, path: "/" },
        { label: "Services", icon: LayoutGrid, path: "/services" },
        { label: "Legal News", icon: Newspaper, path: "/legal-news" },
        { label: "Ask a Lawyer", icon: MessageCircle, path: "/queries" },
    ];

    const isActive = (path: string) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
            <div className="grid grid-cols-4 items-center">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1.5 py-3 transition-all ${isActive(item.path) ? "text-[#1a365d]" : "text-gray-400"
                            }`}
                    >
                        <div className={`relative p-1 ${isActive(item.path) ? "text-[#1a365d]" : "text-gray-400"}`}>
                            <item.icon
                                className="h-[22px] w-[22px]"
                                strokeWidth={isActive(item.path) ? 2.5 : 2}
                            />
                            {isActive(item.path) && (
                                <div className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                            )}
                        </div>
                        <span className={`text-[11px] font-bold tracking-tight ${isActive(item.path) ? "text-[#1a365d]" : "text-gray-500"}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
            {/* iOS Safe Area Support */}
            <div className="h-[env(safe-area-inset-bottom)] bg-white"></div>
        </div>
    );
}
