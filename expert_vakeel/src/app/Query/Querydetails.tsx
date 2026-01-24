// app/queries/Querydetails.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  MessageSquareMore,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Copy,
} from "lucide-react";
import {Link} from "react-router-dom";
import { queryAPI, queryAnswerAPI, publicQueryAnswerAPI } from "../../services/api";
import type { Query, QueryAnswer } from "../../services/api";
import { useUser } from "../../context/UserContext";


export default function Querydetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();

  // Query state
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Answers state
  const [answers, setAnswers] = useState<QueryAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [answersError, setAnswersError] = useState<string | null>(null);


  const [reply, setReply] = useState("");


  // Load query details and answers on mount
  useEffect(() => {
    const loadQuery = async () => {
      if (!id) {
        setError("Query ID is missing");
        setLoading(false);
        setLoadingAnswers(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await queryAPI.getById(id);

        if (response.data.success && response.data.data) {
          const currentQuery = response.data.data;
          setQuery(currentQuery);

        } else {
          throw new Error("Query not found");
        }
      } catch (err) {
        console.error("Error loading query:", err);
        setError("Failed to load query details");
      } finally {
        setLoading(false);
      }
    };

    const loadAnswers = async () => {
      if (!id) {
        setLoadingAnswers(false);
        return;
      }

      try {
        setLoadingAnswers(true);
        setAnswersError(null);

        const response = await publicQueryAnswerAPI.getByQueryId(id, { limit: 50 });

        if (response.data.success && response.data.data) {
          setAnswers(response.data.data);
        } else {
          setAnswers([]);
        }
      } catch (err) {
        console.error("Error loading answers:", err);
        setAnswersError("Failed to load answers");
        setAnswers([]);
      } finally {
        setLoadingAnswers(false);
      }
    };

    loadQuery();
    loadAnswers();
  }, [id]);

  // Helper function to format Firestore timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Unknown";

    try {
      // Handle Firestore timestamp format
      if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
        const date = new Date(timestamp._seconds * 1000);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
      }

      // Handle regular Date or ISO string
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";

      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return "Unknown";
    }
  };


  const postReply = async () => {
    if (!reply.trim() || !query || !user) return;

    try {
      const answerData = {
        queryId: query.id,
        userId: user.id || '',
        userType: (user?.userType === "firm" ? "LAWYER" : "CLIENT") as "CLIENT" | "LAWYER" | "ADMIN" | "SUBADMIN",
        userName: user.fullName || user.name || 'Anonymous',
        answer: reply.trim(),
      };

      const response = await queryAnswerAPI.create(answerData);

      if (response.data.success) {
        // Refresh answers after posting
        const answersResponse = await publicQueryAnswerAPI.getByQueryId(query.id, { limit: 50 });
        if (answersResponse.data.success && answersResponse.data.data) {
          setAnswers(answersResponse.data.data);
        }

        // Update query answers count (you may want to refresh the query as well)
        // For now, just clear the reply
        setReply("");

        // Show success message
        alert("Answer posted successfully!");
      } else {
        throw new Error("Failed to post answer");
      }
    } catch (err) {
      console.error("Error posting answer:", err);
      alert("Failed to post answer. Please try again.");
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[1fr_320px] md:gap-8 md:py-10">
        {/* ======== LEFT CONTENT ======== */}
        <section>
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                <p className="mt-2 text-sm text-gray-600">Loading query details...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Query details */}
          {query && !loading && !error && (
            <article className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm md:p-7">
              {/* heading row */}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-[15px] font-semibold leading-6 text-gray-900 md:text-[16px]">
                    {query.title}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Asked by {query.askedByName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimestamp(query.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="hidden shrink-0 md:block">
                  <span className="inline-block rounded-full bg-[#0C63E7] px-3 py-1 text-[11px] font-medium text-white">
                    {query.answersCount || 0} Answers
                  </span>
                </div>
              </div>

              {/* body */}
              <div className="mt-4 rounded-[14px] bg-gray-50 p-4 text-[12px] leading-relaxed text-gray-700">
                {query.description}
                <div className="mt-3 text-[12px] font-medium text-gray-900">
                  Asked by {query.askedByName}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatTimestamp(query.createdAt)}
                </div>
              </div>
            </article>
          )}

          {/* Share Query Section */}
          {query && !loading && !error && (
            <section className="mt-5 rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share This Query</h3>
              <p className="text-gray-600 text-sm mb-6">
                Help others find answers by sharing this legal query with your network.
              </p>

              {/* Social Media Share Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {/* Facebook */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Check out this legal query: "${query.title}" on Expert Vakeel`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="text-sm font-medium">Facebook</span>
                </button>

                {/* Twitter */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Legal Query: "${query.title}" - Get expert answers on Expert Vakeel #LegalHelp`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">Twitter</span>
                </button>

                {/* Instagram */}
                <button
                  onClick={() => {
                    // Instagram doesn't support direct sharing via URL, so copy to clipboard
                    navigator.clipboard.writeText(`${window.location.href}\n\nLegal Query: "${query.title}"\nGet expert answers on Expert Vakeel`);
                    alert('Query link copied! You can now paste it on Instagram.');
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="text-sm font-medium">Instagram</span>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const title = encodeURIComponent(`Legal Query: ${query.title}`);
                    const summary = encodeURIComponent(`Interesting legal query: "${query.title}". Get expert answers and insights from legal professionals on Expert Vakeel.`);
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Check out this legal query: "${query.title}"\n\nGet expert answers on Expert Vakeel\n\n${url}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageSquareMore className="w-4 h-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Query link copied to clipboard!');
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm font-medium">Copy Link</span>
                </button>
              </div>

              {/* Additional Share Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Sharing helps build a stronger legal community
                </p>
              </div>
            </section>
          )}


          {/* reply box */}
          <section className="mt-5 rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-[18px] font-semibold text-gray-900">
              Reply To This Query (Only If Asked From Community)
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                disabled
                value={user?.fullName || "Loading..."}
                className="h-11 w-full rounded-full bg-gray-100 px-5 text-[13px] text-gray-500 outline-none"
                readOnly
              />
              <button
                onClick={postReply}
                className="h-11 rounded-full bg-black px-5 text-[12px] font-semibold text-white hover:opacity-90"
              >
                Post Now!
              </button>
            </div>

            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Add Your Answer Here"
              rows={5}
              className="mt-3 w-full resize-none rounded-[16px] border border-gray-200 bg-gray-50 p-4 text-[13px] outline-none focus:border-gray-300"
            />
          </section>

          {/* other answers */}
          <section className="mt-7">
            <h4 className="px-1 text-[16px] font-semibold text-gray-900">
              Other Answers
            </h4>

            {/* Loading answers */}
            {loadingAnswers && (
              <div className="mt-3 flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading answers...</p>
                </div>
              </div>
            )}

            {/* Answers error */}
            {answersError && !loadingAnswers && (
              <div className="mt-3 text-center py-8">
                <p className="text-red-600 text-sm">{answersError}</p>
              </div>
            )}

            {/* No answers available */}
            {!loadingAnswers && !answersError && answers.length === 0 && (
              <div className="mt-3 text-center py-8">
                <div className="text-gray-500">
                  <MessageSquareMore className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No answers available yet</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to answer this query!</p>
                </div>
              </div>
            )}

            {/* Answers list */}
            {!loadingAnswers && !answersError && answers.length > 0 && (
              <>
                <ul className="mt-3 space-y-4">
                  {answers.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-[16px] border border-gray-200 bg-white p-4 shadow-sm md:p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[13px] font-semibold text-gray-900">
                            Replied By {a.userName}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            {a.userType}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatTimestamp(a.createdAt)}
                        </div>
                      </div>

                      <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
                        {a.answer}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-[12px] text-gray-600">
                        <span>Answer</span>
                        <span className="text-blue-600 font-medium">{a.userType}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 text-center">
                  <button className="inline-flex items-center gap-2 rounded-full bg-[#0B0B0B] px-5 py-2 text-[12px] font-semibold text-white hover:opacity-95">
                    Load More Answers
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </section>
        </section>

        {/* ======== RIGHT SIDEBAR ======== */}
        <aside className="md:sticky md:top-24">
          <div className="rounded-[18px] bg-[#E7EEF6] p-5 md:p-6">
            <h3 className="text-[22px] font-semibold leading-7 text-gray-900">
              Ask Your Queries All At One Place
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
              You may ask your queries directly from Expert Vakeel Team or our
              community.
            </p>
            <Link
              to="/queries/ask"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white hover:opacity-90"
            >
              <MessageSquareMore className="h-4 w-4" />
              Ask Now
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
