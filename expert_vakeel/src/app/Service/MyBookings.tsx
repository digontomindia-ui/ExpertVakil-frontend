// src/app/Service/MyBookings.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { serviceBookedAPI, type ServiceBooked } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { Calendar, Phone, FileText, Loader, Package } from "lucide-react";

export default function MyBookings() {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();

    const [bookings, setBookings] = useState<ServiceBooked[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!userLoading && !user) {
            navigate("/login");
            return;
        }

        const loadBookings = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);
                const clientId = user.id || user._id;
                const response = await serviceBookedAPI.getByClientId(clientId);

                if (response.data.success && response.data.data) {
                    setBookings(response.data.data);
                } else {
                    throw new Error("Failed to load bookings");
                }
            } catch (err) {
                console.error("Error loading bookings:", err);
                setError("Unable to load your bookings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadBookings();
        }
    }, [user, userLoading, navigate]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";

        // Handle Firestore timestamp
        if (timestamp._seconds) {
            const date = new Date(timestamp._seconds * 1000);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }

        // Handle regular date/ISO string
        try {
            return new Date(timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "N/A";
        }
    };

    if (userLoading || loading) {
        return (
            <main className="min-h-[100dvh] bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
                        <Loader className="relative inline-block animate-spin h-10 w-10 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Loading your bookings...</p>
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
                    <h2 className="mb-2 text-xl font-bold text-gray-900">Unable to Load Bookings</h2>
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
        <main className="min-h-[100dvh] bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 pb-32 pt-20 text-white md:pt-28">
                <div className="absolute left-0 top-0 h-full w-full overflow-hidden opacity-30">
                    <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-yellow-400 blur-3xl"></div>
                    <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-pink-500 blur-3xl"></div>
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight md:text-5xl drop-shadow-sm">
                            My Bookings
                        </h1>
                        <p className="mt-4 text-lg text-blue-100 font-medium">
                            Track and manage your service consultations and appointments.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="relative mx-auto -mt-20 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                {bookings.length === 0 ? (
                    <div className="rounded-3xl bg-white p-12 text-center shadow-xl ring-1 ring-gray-100 md:p-20">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                            <Package className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-gray-900">No bookings yet</h3>
                        <p className="mb-8 text-gray-500">
                            You haven't booked any services yet. Explore our expert legal services to get started.
                        </p>
                        <button
                            onClick={() => navigate("/services")}
                            className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 hover:shadow-lg"
                        >
                            Browse Services
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-xl hover:ring-blue-100 border border-transparent hover:border-blue-100"
                            >
                                {/* Header */}
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {booking.title}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDate(booking.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="mb-4 h-px w-full bg-gray-100"></div>

                                {/* Details */}
                                <div className="mb-6 flex-1 space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{booking.phoneNumber}</span>
                                    </div>
                                    {booking.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {booking.description}
                                        </p>
                                    )}
                                </div>

                                {/* Services Tags */}
                                <div className="mt-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {booking.servicesBooked.slice(0, 3).map((service, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                            >
                                                {service}
                                            </span>
                                        ))}
                                        {booking.servicesBooked.length > 3 && (
                                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                +{booking.servicesBooked.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ID Footer */}
                                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4 text-[10px] text-gray-400 uppercase tracking-wider">
                                    <span>ID: {booking.id.slice(0, 8)}...</span>
                                    <span className="font-semibold text-green-600">Confirmed</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
