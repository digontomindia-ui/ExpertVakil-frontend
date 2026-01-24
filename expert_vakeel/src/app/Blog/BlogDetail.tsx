// src/app/Blog/BlogDetail.tsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publicBlogAPI, type Blog } from "../../services/api";
import { Calendar, ArrowLeft, Share2 } from "lucide-react";

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
          setError("Blog not found");
          return;
        }

        setBlog(blogData);
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title || 'Legal Blog',
        text: blog?.subtitle || blog?.description.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading blog post...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => navigate('/blogs')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <ArrowLeft size={16} />
              Back to Blogs
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <Header />

      {/* Back Button */}
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <button
          onClick={() => navigate('/blogs')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Blogs
        </button>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-8">
        {/* Blog Header */}
        <header className="mb-8">
          {/* Category */}
          {blog.category && (
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {blog.category}
            </span>
          )}

          {/* Title */}
          <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl lg:text-5xl leading-tight">
            {blog.title}
          </h1>

          {/* Subtitle */}
          {blog.subtitle && (
            <p className="mt-4 text-xl text-gray-600 leading-relaxed">{blog.subtitle}</p>
          )}

          {/* Meta Information */}
          <div className="mt-6 flex items-center justify-between border-b border-gray-200 pb-6">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </header>
        {/* Blog Image */}
        {blog.image && (
          <div className="mb-10 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gray-900/5">
            <img
              src={blog.image}
              alt={blog.title}
              className="h-auto w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Blog Content */}
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {blog.description}
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => navigate('/blogs')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-95"
            >
              <ArrowLeft size={18} />
              Back to All Blogs
            </button>

            <button
              onClick={handleShare}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-100 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
            >
              <Share2 size={18} />
              Share Article
            </button>
          </div>
        </footer>
      </article>

      <Footer />
    </div>
  );
}
