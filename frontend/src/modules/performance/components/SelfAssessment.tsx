// src/modules/performance/components/SelfAssessment.tsx

import React, {
  useEffect,
  useState,
} from "react";

import {
  getGoalWithAssessments,
  submitSelfAssessment,
} from "../services/performanceService";

interface SelfAssessmentProps {
  goalId: number;
}

const SelfAssessment: React.FC<SelfAssessmentProps> = ({
  goalId,
}) => {

  const [assessmentText, setAssessmentText] =
    useState("");

  const [submittedAssessment, setSubmittedAssessment] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [error, setError] =
    useState("");


  // ================= LOAD EXISTING ASSESSMENT =================

  const loadAssessment = async () => {

    try {

      setLoading(true);
      setError("");
      setMessage("");

      const goal =
        await getGoalWithAssessments(goalId);

      if (goal.self_assessment) {

        setSubmittedAssessment(
          goal.self_assessment.assessment_text
        );

      } else {

        setSubmittedAssessment(null);

      }

    } catch (error) {

      console.error(
        "Unable to load existing self assessment:",
        error
      );

      setError(
        "Unable to load self assessment."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    if (goalId) {
      loadAssessment();
    }

  }, [goalId]);


  // ================= SUBMIT =================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!assessmentText.trim()) {
      setIsSuccess(false);

      setMessage(
        "Please enter your self assessment."
      );

      return;
    }


    try {

      setSubmitting(true);

      setMessage("");
      setError("");


      const response =
        await submitSelfAssessment(
          goalId,
          {
            assessment_text:
              assessmentText.trim(),
          }
        );


      // Store the submitted assessment
      setSubmittedAssessment(
        response.assessment_text
      );


      setAssessmentText("");

      setIsSuccess(true);

      setMessage(
        "Self assessment submitted successfully."
      );

    } catch (error: any) {

      console.error(error);

      setIsSuccess(false);

      setMessage(
        error?.response?.data?.detail ||
        "Failed to submit assessment."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // ================= LOADING =================

  if (loading) {

    return (

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-800">
            Self Assessment
          </h2>

          <p className="text-gray-500 mt-2">
            Describe your achievements, challenges and
            overall performance for this review cycle.
          </p>

        </div>


        <div className="flex items-center justify-center py-16">

          <p className="text-lg font-semibold text-gray-600">
            Loading Self Assessment...
          </p>

        </div>

      </div>

    );

  }


  // ================= ERROR =================

  if (error) {

    return (

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-800">
            Self Assessment
          </h2>

          <p className="text-gray-500 mt-2">
            Describe your achievements, challenges and
            overall performance for this review cycle.
          </p>

        </div>


        <div className="rounded-xl border border-red-200 bg-red-50 p-5">

          <p className="text-red-600 font-medium">
            {error}
          </p>

        </div>

      </div>

    );

  }


  // ================= ALREADY SUBMITTED =================

  if (submittedAssessment) {

    return (

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Header */}

        <div className="mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h2 className="text-3xl font-bold text-gray-800">
                Self Assessment
              </h2>

              <p className="text-gray-500 mt-2">
                Your self assessment for this review cycle.
              </p>

            </div>


            <span className="
              inline-flex
              items-center
              rounded-full
              bg-green-100
              px-5
              py-2
              text-sm
              font-semibold
              text-green-700
              w-fit
            ">
              Submitted
            </span>

          </div>

        </div>


        {/* Success Message */}

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


        {/* Submitted Assessment */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">

            Your Assessment

          </label>


          <div className="
            w-full
            min-h-[220px]
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            px-5
            py-5
            text-gray-700
            leading-7
            whitespace-pre-wrap
          ">

            {submittedAssessment}

          </div>

        </div>


        {/* Status */}

        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

          <p className="text-green-700 font-medium">

            Your self assessment has been submitted successfully
            and is now available for manager review.

          </p>

        </div>

      </div>

    );

  }


  // ================= SUBMISSION FORM =================

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
            disabled={submitting}
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
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={
              submitting ||
              !assessmentText.trim()
            }
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

            {submitting
              ? "Submitting..."
              : "Submit Assessment"}

          </button>

        </div>

      </form>

    </div>

  );

};

export default SelfAssessment;