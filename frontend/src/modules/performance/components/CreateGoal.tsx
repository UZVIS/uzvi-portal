// src/modules/performance/components/CreateGoal.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createGoal } from "../services/performanceService";
import type { CreateGoalData } from "../types";

const CreateGoal: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateGoalData>({
    description: "",
    target_outcome: "",
    cycle_id: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "cycle_id"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await createGoal(formData);

      navigate("/performance");
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to create goal"
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
          Create Goal
        </h2>

        <p className="text-gray-500 mt-2">
          Create a new goal for the active review cycle.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-600 font-medium">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-7"
      >

        {/* Goal Description */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Goal Description
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter goal description"
            required
            rows={5}
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              px-4
              py-3
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

        {/* Target Outcome */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Target Outcome
          </label>

          <textarea
            name="target_outcome"
            value={formData.target_outcome}
            onChange={handleChange}
            placeholder="Enter target outcome"
            rows={5}
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              px-4
              py-3
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

                {/* Review Cycle ID */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Review Cycle ID
          </label>

          <input
            type="number"
            name="cycle_id"
            value={formData.cycle_id}
            onChange={handleChange}
            placeholder="Enter Review Cycle ID"
            required
            className="
              w-full
              h-12
              rounded-xl
              border
              border-gray-300
              px-4
              text-gray-700
              placeholder:text-gray-400
              focus:border-orange-500
              focus:ring-2
              focus:ring-orange-200
              outline-none
              transition-all
            "
          />

        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-4 pt-4">

          <button
            type="button"
            onClick={() => navigate("/performance")}
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
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? "Creating..." : "Create Goal"}
          </button>

        </div>

      </form>

    </div>
  );
};

export default CreateGoal;