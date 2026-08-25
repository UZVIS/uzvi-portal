// src/modules/performance/components/CreateReviewCycle.tsx

import React, { useState } from "react";

import { createReviewCycle } from "../services/performanceService";

const CreateReviewCycle: React.FC = () => {

  const [name, setName] =
    useState("");

  const [periodStart, setPeriodStart] =
    useState("");

  const [periodEnd, setPeriodEnd] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    setSuccess("");

    setError("");

    try {

      await createReviewCycle({

        name,

        period_start: periodStart,

        period_end: periodEnd,

      });

      setSuccess(
        "Review Cycle Created Successfully"
      );

      setName("");

      setPeriodStart("");

      setPeriodEnd("");

    } catch (err) {

      console.error(err);

      setError(
        "Unable to create review cycle"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      <div className="mb-8">

        <h2 className="text-3xl font-bold text-gray-800">

          Create Review Cycle

        </h2>

        <p className="text-gray-500 mt-2">

          Create a new performance review cycle.

        </p>

      </div>

            {success && (

        <div className="mb-6 rounded-lg bg-green-100 border border-green-300 p-4">

          <p className="text-green-700 font-medium">
            {success}
          </p>

        </div>

      )}

      {error && (

        <div className="mb-6 rounded-lg bg-red-100 border border-red-300 p-4">

          <p className="text-red-700 font-medium">
            {error}
          </p>

        </div>

      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* Review Cycle Name */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Review Cycle Name

          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Enter Review Cycle Name"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
          />

        </div>

        {/* Start Date */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Period Start

          </label>

          <input
            type="datetime-local"
            value={periodStart}
            onChange={(e) =>
              setPeriodStart(e.target.value)
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
          />

        </div>

        {/* End Date */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Period End

          </label>

          <input
            type="datetime-local"
            value={periodEnd}
            onChange={(e) =>
              setPeriodEnd(e.target.value)
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
          />

        </div>

                {/* Buttons */}

        <div className="flex gap-4 pt-4">

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >

            {
              loading
                ? "Creating..."
                : "Create Review Cycle"
            }

          </button>

          <button
            type="button"
            onClick={() => {

              setName("");

              setPeriodStart("");

              setPeriodEnd("");

              setError("");

              setSuccess("");

            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold"
          >

            Reset

          </button>

        </div>

      </form>

    </div>

  );

};

export default CreateReviewCycle;