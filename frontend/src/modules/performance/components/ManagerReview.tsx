// src/modules/performance/components/ManagerReview.tsx

import React, { useState } from "react";
import { submitManagerReview } from "../services/performanceService";

interface ManagerReviewProps {
  goalId: number;
}

const ManagerReview: React.FC<ManagerReviewProps> = ({
  goalId,
}) => {

  const [rating, setRating] =
    useState<number>(1);

  const [reviewText, setReviewText] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isSuccess, setIsSuccess] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      setLoading(true);

      setMessage("");

      await submitManagerReview(
        goalId,
        {
          rating,
          review_text: reviewText,
        }
      );

      setIsSuccess(true);

      setMessage(
        "Manager review submitted successfully."
      );

      setReviewText("");

      setRating(1);

    } catch (error) {

      console.error(error);

      setIsSuccess(false);

      setMessage(
        "Failed to submit manager review."
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      {/* Header */}

      <div className="mb-8">

        <h2 className="text-3xl font-bold text-gray-800">
          Manager Review
        </h2>

        <p className="text-gray-500 mt-2">
          Review employee performance and provide
          constructive feedback.
        </p>

      </div>

      {/* Message */}

      {message && (

        <div
          className={`mb-6 rounded-xl border p-4 ${
            isSuccess
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >

          {message}

        </div>

      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        {/* Rating */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">

            Rating (1 - 5)

          </label>

          <input
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) =>
              setRating(Number(e.target.value))
            }
            required
            className="
              w-full
              h-12
              rounded-xl
              border
              border-gray-300
              px-4
              text-gray-700
              focus:border-orange-500
              focus:ring-2
              focus:ring-orange-200
              outline-none
              transition-all
            "
          />

        </div>

        {/* Review Comments */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">

            Review Comments

          </label>

          <textarea
            value={reviewText}
            onChange={(e) =>
              setReviewText(e.target.value)
            }
            placeholder="Enter review comments..."
            rows={8}
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              px-4
              py-4
              text-gray-700
              placeholder:text-gray-400
              focus:border-orange-500
              focus:ring-2
              focus:ring-orange-200
              outline-none
              resize-none
              transition-all
            "
          />

        </div>

                {/* Buttons */}

        <div className="flex justify-end gap-4 pt-2">

          <button
            type="button"
            onClick={() => {
              setRating(1);
              setReviewText("");
              setMessage("");
            }}
            className="
              px-6
              py-3
              rounded-xl
              border
              border-gray-300
              bg-white
              text-gray-700
              font-medium
              hover:bg-gray-100
              transition-all
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              px-8
              py-3
              rounded-xl
              bg-orange-500
              hover:bg-orange-600
              text-white
              font-semibold
              shadow-sm
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading
              ? "Submitting..."
              : "Submit Review"}
          </button>

        </div>

      </form>

    </div>

  );

};

export default ManagerReview;