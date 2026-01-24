import { useState } from "react";
import { Star, X } from "lucide-react";
import { ratingReviewAPI } from "../services/api";
import type { RatingReviewInput } from "../services/api";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string; // The user being rated/reviewed
  clientId: string; // The client doing the rating/review
  clientName?: string; // The name of the client doing the rating/review
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  userId,
  clientId,
  clientName,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: clientId must exist
    if (!clientId) {
      setError("You must be logged in to submit a rating or review");
      return;
    }

    // Validation: at least one of rating or review must be provided
    if (rating === 0 && review.trim().length < 10) {
      setError("Please provide either a rating or a review (at least 10 characters)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create combined rating/review data
      const ratingReviewData: RatingReviewInput = {
        ...(rating > 0 && { rating }),
        ...(review.trim() && { review: review.trim() }),
        userId,
        clientId,
        clientName,
      };

      console.log("Sending rating/review data:", ratingReviewData);
      await ratingReviewAPI.create(ratingReviewData);

      // Reset form and close modal
      setRating(0);
      setHoverRating(0);
      setReview("");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating and review");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setReview("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Rate & Review
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Rating Stars */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating (Optional)
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {rating > 0 && `${rating} star${rating !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Review (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this legal professional..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {review.length}/500 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (rating === 0 && review.trim().length < 10)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
