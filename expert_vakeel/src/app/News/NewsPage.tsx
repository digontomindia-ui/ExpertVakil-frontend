// src/app/News/NewsPage.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { newsAPI, type NewsPost } from "../../services/api";
import { Calendar, Eye, TrendingUp, ExternalLink, ArrowRight } from "lucide-react";

function Header() {
    return <header className="h-2" />;
}

function Footer() {
    return (
        <footer className="mt-16 border-t pb-24 md:pb-10">
            <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-gray-600">
                © {new Date().getFullYear()} Legal Network · All rights reserved.
            </div>
        </footer>
    );
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    // Fetch news
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const response = await newsAPI.getAll({
                    published: true,
                    limit: 50
                });
                const data = response.data?.data || [];
                setNews(data);
            } catch (error) {
                console.error("Error fetching news:", error);
                setNews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = news.map(n => n.category).filter(Boolean);
        return Array.from(new Set(cats));
    }, [news]);

    // Filter news by category
    const filteredNews = useMemo(() => {
        if (!selectedCategory) return news;
        return news.filter(n => n.category === selectedCategory);
    }, [news, selectedCategory]);

    const formatDate = (date: any) => {
        if (!date) return "Recent";
        try {
            // Handle Firestore timestamp
            const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return "Recent";
        }
    };

    const handleOpenNews = (item: NewsPost) => {
        if (item.liveLink) {
            window.open(item.liveLink, "_blank");
            // Also increment views
            newsAPI.incrementViews(item.id).catch(err => console.error("Error incrementing views:", err));
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-white">
                <Header />
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <div className="text-center py-20">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-gray-500 font-medium">Loading legal news...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-white">
            <Header />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 py-20 text-white">
                {/* Abstract Background Pattern */}
                <div className="absolute left-0 top-0 h-full w-full opacity-20">
                    <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-blue-400 blur-3xl"></div>
                    <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-indigo-300 blur-3xl"></div>
                </div>

                <div className="relative mx-auto max-w-6xl px-4 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
                        <TrendingUp size={14} className="text-blue-400" />
                        <span>Latest Updates & Trends</span>
                    </div>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl text-white">
                        Legal News Center
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-indigo-100 md:text-xl font-medium opacity-90">
                        Keep yourself updated with the most recent legal developments, court rulings, and legislative changes across India.
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="mx-auto max-w-6xl px-4 py-12">
                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="mb-10 overflow-x-auto pb-4 no-scrollbar">
                        <div className="flex items-center justify-start sm:justify-center gap-3 min-w-max px-2">
                            <button
                                onClick={() => setSelectedCategory("")}
                                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shadow-sm hover:shadow-md ${selectedCategory === ""
                                    ? "bg-indigo-600 text-white shadow-indigo-200"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                    }`}
                            >
                                All News
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shadow-sm hover:shadow-md ${selectedCategory === category
                                        ? "bg-indigo-600 text-white shadow-indigo-200"
                                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* News Grid */}
                {filteredNews.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium">
                            {selectedCategory ? `No legal news found in "${selectedCategory}" category.` : "No legal news available right now."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredNews.map((item) => (
                            <article
                                key={item.id}
                                className="group flex flex-col cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100"
                                onClick={() => handleOpenNews(item)}
                            >
                                {/* News Image */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400">
                                            <Newspaper size={40} strokeWidth={1} />
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {item.category && (
                                        <div className="absolute left-4 top-4 rounded-lg bg-indigo-600/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                                            {item.category}
                                        </div>
                                    )}

                                    {/* Trending Badge */}
                                    {item.isTrending && (
                                        <div className="absolute right-4 top-4 rounded-lg bg-amber-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md flex items-center gap-1">
                                            <TrendingUp size={10} />
                                            Trending
                                        </div>
                                    )}
                                </div>

                                {/* News Content */}
                                <div className="flex flex-1 flex-col p-6">
                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-indigo-600 line-clamp-2 leading-snug">
                                        {item.title}
                                    </h3>

                                    {/* Brief */}
                                    {item.brief && (
                                        <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                            {item.brief}
                                        </p>
                                    )}

                                    {/* Meta */}
                                    <div className="mt-auto pt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-[12px] font-medium text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-indigo-400" />
                                                <span>{formatDate(item.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Eye size={14} className="text-indigo-400" />
                                                <span>{item.views || 0}</span>
                                            </div>
                                        </div>

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-45">
                                            <ExternalLink size={18} />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

function Newspaper({ size, strokeWidth }: { size: number, strokeWidth: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></svg>
    )
}
