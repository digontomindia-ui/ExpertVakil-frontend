// src/app/Blog/BlogListing.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { publicBlogAPI, type Blog } from "../../services/api";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";

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
          limit: 100
        });
        const allBlogs = response.data?.data || [];
        const publishedBlogs = allBlogs.filter(b => b.published);
        setBlogs(publishedBlogs);
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
    if (!date) return "Recent";
    try {
      const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "Recent";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fffbeb] to-[#fff7ed] pt-32 pb-24 text-gray-900 border-b border-orange-100/30">
        {/* Abstract Background Pattern */}
        <div className="absolute left-0 top-0 h-full w-full opacity-40">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl"></div>
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 shadow-sm border border-amber-100">
            <BookOpen size={14} />
            <span>Expert Legal Insights</span>
          </div>
          <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl text-[#1a365d] leading-[1.05]">
            Our Legal <span className="text-amber-500">Blog</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl font-medium">
            Discover in-depth articles, legal tips, and expert guides from our professional network.
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
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all shadow-sm hover:shadow-md ${selectedCategory === ""
                  ? "bg-amber-500 text-white shadow-amber-200"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all shadow-sm hover:shadow-md ${selectedCategory === category
                    ? "bg-amber-500 text-white shadow-amber-200"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
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
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-bold">
              {selectedCategory ? `No posts found in "${selectedCategory}" category.` : "No blog posts available right now."}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className="group flex flex-col cursor-pointer overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-100"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {/* Image Section */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <BookOpen size={48} strokeWidth={1} />
                    </div>
                  )}

                  {/* Category Badge */}
                  {blog.category && (
                    <div className="absolute left-6 top-6 rounded-xl bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#1a365d] shadow-sm backdrop-blur-md border border-white/50">
                      {blog.category}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar size={14} className="text-amber-500" />
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>

                  <h3 className="text-xl font-black text-[#1a365d] transition-colors group-hover:text-amber-500 line-clamp-2 leading-tight mb-4">
                    {blog.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed font-medium mb-6">
                    {blog.subtitle || blog.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                      Read Full Story
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 transition-all group-hover:bg-amber-500 group-hover:text-white group-hover:rotate-45 shadow-sm">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
