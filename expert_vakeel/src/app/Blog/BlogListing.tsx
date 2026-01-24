// src/app/Blog/BlogListing.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { publicBlogAPI, type Blog } from "../../services/api";
import { Calendar, ArrowRight } from "lucide-react";

function Header() {
  return <header className="h-2" />;
}

function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-gray-600">
        © {new Date().getFullYear()} Legal Network · All rights reserved.
      </div>
    </footer>
  );
}

export default function BlogListing() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await publicBlogAPI.getAll({
          published: true,
          limit: 50
        });
        const data = response.data?.data || [];
        console.log(data);
        setBlogs(data);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = blogs.map(blog => blog.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [blogs]);

  // Filter blogs by category
  const filteredBlogs = useMemo(() => {
    if (!selectedCategory) return blogs;
    return blogs.filter(blog => blog.category === selectedCategory);
  }, [blogs, selectedCategory]);

  const formatDate = (date: any) => {
    if (!date) return "Unknown Date";
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "Unknown Date";
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading blogs...</p>
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
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 py-20 text-gray-900">
        {/* Abstract Background Pattern */}
        <div className="absolute left-0 top-0 h-full w-full opacity-30">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-yellow-200 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl drop-shadow-sm text-gray-900">
            Legal Blog & Insights
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-800 md:text-xl font-medium">
            Stay informed with the latest legal insights, news, and expert opinions
            from our team of experienced legal professionals.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-10">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setSelectedCategory("")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all shadow-sm hover:shadow-md ${selectedCategory === ""
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-offset-2 ring-amber-500"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
              >
                All Posts
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all shadow-sm hover:shadow-md ${selectedCategory === category
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-offset-2 ring-amber-500"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blog Grid */}
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">
              {selectedCategory ? `No blogs found in "${selectedCategory}" category.` : "No blogs available right now."}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-100"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {/* Blog Image */}
                {blog.image && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Blog Content */}
                <div className="p-6">
                  {/* Category */}
                  {blog.category && (
                    <span className="inline-block rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      {blog.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="mt-4 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600 line-clamp-2">
                    {blog.title}
                  </h3>

                  {/* Subtitle */}
                  {blog.subtitle && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{blog.subtitle}</p>
                  )}

                  {/* Description */}
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {truncateText(blog.description)}
                  </p>

                  {/* Meta */}
                  <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-blue-600 transition-all group-hover:gap-2">
                      <span>Read more</span>
                      <ArrowRight size={16} />
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
