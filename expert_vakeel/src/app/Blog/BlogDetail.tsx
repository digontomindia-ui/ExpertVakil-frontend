// src/app/Blog/BlogDetail.tsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publicBlogAPI, type Blog } from "../../services/api";
import { Calendar, ArrowLeft, Share2, BookOpen } from "lucide-react";

export default function BlogDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await publicBlogAPI.getById(id);
        const blogData = response.data?.data;

        if (!blogData) {
          setError("Blog post not found");
          return;
        }

        setBlog(blogData);
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title || 'Legal Blog',
        text: blog?.subtitle || blog?.description.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-black text-[#1a365d] mb-4">Post Not Found</h1>
            <p className="text-gray-500 mb-8 font-medium">{error}</p>
            <button
              onClick={() => navigate('/blogs')}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-200"
            >
              <ArrowLeft size={18} />
              Return to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">

      {/* Hero Section with Title */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 pt-12 pb-16 border-b border-orange-100/50">
        <div className="mx-auto max-w-4xl px-4">
          <button
            onClick={() => navigate('/blogs')}
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-amber-600 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to Articles
          </button>

          <header>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {blog.category && (
                <span className="rounded-xl bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 shadow-sm border border-amber-100">
                  {blog.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black text-[#1a365d] md:text-5xl leading-tight mb-8">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between border-t border-amber-100/50 pt-8">
              <div className="flex items-center gap-6 text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-amber-500" />
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 hover:text-amber-500 hover:border-amber-200 transition-all shadow-sm"
                  title="Share Article"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </header>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12">
        {/* Cover Image */}
        <div className="mb-12 overflow-hidden rounded-[2.5rem] shadow-2xl shadow-amber-500/10 ring-1 ring-gray-900/5">
          {blog.image ? (
            <img
              src={blog.image}
              alt={blog.title}
              className="h-auto w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-gray-50 text-gray-200">
              <BookOpen size={80} strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-amber max-w-none">
          {blog.subtitle && (
            <p className="text-2xl font-bold text-[#1a365d] leading-relaxed mb-8 border-l-4 border-amber-500 pl-6 italic">
              {blog.subtitle}
            </p>
          )}

          <div className="whitespace-pre-wrap text-gray-700 text-lg leading-relaxed font-medium">
            {blog.description}
          </div>
        </div>

        {/* Floating Action Bar - Mobile */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm md:hidden">
          <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-white/50 p-3 rounded-[2rem] shadow-2xl">
            <button
              onClick={() => navigate('/blogs')}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={handleShare}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white font-bold text-sm uppercase tracking-widest"
            >
              <Share2 size={18} /> Share
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="mt-20 border-t border-gray-100 pt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <button
              onClick={() => navigate('/blogs')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-[2rem] bg-gray-900 px-10 py-4 text-sm font-black text-white hover:bg-black shadow-xl transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
              ALL ARTICLES
            </button>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Source:</span>
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                Legal Network
              </span>
            </div>
          </div>
        </footer>
      </article>

    </div>
  );
}
