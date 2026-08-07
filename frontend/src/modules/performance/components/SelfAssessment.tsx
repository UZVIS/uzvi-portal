// src/modules/performance/components/SelfAssessment.tsx

import React, { useState } from "react";
import { submitSelfAssessment } from "../services/performanceService";

interface SelfAssessmentProps {
  goalId: number;
}

const SelfAssessment: React.FC<SelfAssessmentProps> = ({
  goalId,
}) => {

  const [assessmentText, setAssessmentText] =
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

      await submitSelfAssessment(
        goalId,
        {
          assessment_text: assessmentText,
        }
      );

      setIsSuccess(true);

      setMessage(
        "Self assessment submitted successfully."
      );

      setAssessmentText("");

    } catch (error) {

      console.error(error);

      setIsSuccess(false);

      setMessage(
        "Failed to submit assessment."
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
          Self Assessment
        </h2>

        <p className="text-gray-500 mt-2">
          Describe your achievements, challenges and
          overall performance for this review cycle.
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

        {/* Assessment */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">

            Assessment

          </label>

          <textarea

            value={assessmentText}

            onChange={(e) =>
              setAssessmentText(e.target.value)
            }

            placeholder="Describe your work, achievements, challenges and learning during this review period..."

            required

            rows={10}

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
              setAssessmentText("");
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
              : "Submit Assessment"}
          </button>

        </div>

      </form>

    </div>

  );

};

export default SelfAssessment;