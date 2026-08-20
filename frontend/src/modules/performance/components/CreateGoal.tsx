// src/modules/performance/components/CreateGoal.tsx

import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  createGoal,
  getActiveCycle,
} from "../services/performanceService";

import type {
  CreateGoalData,
  ReviewCycle,
} from "../types";

const CreateGoal: React.FC = () => {
  const navigate = useNavigate();

  // =====================================
  // Form Data
  // =====================================

  const [formData, setFormData] =
    useState<CreateGoalData>({
      description: "",
      target_outcome: "",
      cycle_id: 0,
    });

  // =====================================
  // Active Review Cycle
  // =====================================

  const [activeCycle, setActiveCycle] =
    useState<ReviewCycle | null>(null);

  const [cycleLoading, setCycleLoading] =
    useState(true);

  // =====================================
  // Submit State
  // =====================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================
  // Load Active Review Cycle
  // =====================================

  useEffect(() => {
    const loadActiveCycle = async () => {
      try {
        setCycleLoading(true);
        setError("");

        const cycle =
          await getActiveCycle();

        if (!cycle) {
          setActiveCycle(null);

          setError(
            "No active review cycle is available."
          );

          return;
        }

        setActiveCycle(cycle);

        // Automatically assign active cycle ID
        setFormData((prev) => ({
          ...prev,
          cycle_id: cycle.id,
        }));
      } catch (err) {
        console.error(
          "Failed to load active review cycle:",
          err
        );

        setActiveCycle(null);

        setError(
          "Unable to load active review cycle."
        );
      } finally {
        setCycleLoading(false);
      }
    };

    loadActiveCycle();
  }, []);

  // =====================================
  // Handle Form Change
  // =====================================

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

  // =====================================
  // Handle Submit
  // =====================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // Safety check
    if (!formData.cycle_id) {
      setError(
        "No active review cycle is available."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await createGoal(formData);

      navigate("/performance");
    } catch (err: any) {
      console.error(
        "Failed to create goal:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to create goal."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Render
  // =====================================

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

      {/* Error Message */}

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

        {/* ===================================== */}
        {/* Goal Description */}
        {/* ===================================== */}

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

        {/* ===================================== */}
        {/* Target Outcome */}
        {/* ===================================== */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Target Outcome
          </label>

          <textarea
            name="target_outcome"
            value={formData.target_outcome}
            onChange={handleChange}
            placeholder="Enter target outcome"
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

        {/* ===================================== */}
        {/* Active Review Cycle */}
        {/* ===================================== */}

        <div>

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Active Review Cycle
          </label>

          <div
            className="
              w-full
              min-h-12
              rounded-xl
              border
              border-gray-300
              bg-gray-50
              px-4
              py-3
              text-gray-700
            "
          >
            {cycleLoading ? (
              <span className="text-gray-500">
                Loading active review cycle...
              </span>
            ) : activeCycle ? (
              <div className="flex flex-col gap-1">

                <span className="font-semibold text-gray-800">
                  {activeCycle.name}
                </span>

                <span className="text-sm text-gray-500">
                  Cycle ID: {activeCycle.id}
                </span>

              </div>
            ) : (
              <span className="text-red-500">
                No active review cycle available.
              </span>
            )}
          </div>

        </div>

        {/* ===================================== */}
        {/* Buttons */}
        {/* ===================================== */}

        <div className="flex justify-end gap-4 pt-4">

          {/* Cancel */}

          <button
            type="button"
            onClick={() =>
              navigate("/performance")
            }
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

          {/* Create Goal */}

          <button
            type="submit"
            disabled={
              loading ||
              cycleLoading ||
              !activeCycle ||
              !formData.cycle_id
            }
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
            {loading
              ? "Creating..."
              : cycleLoading
              ? "Loading Cycle..."
              : "Create Goal"}
          </button>

        </div>

      </form>

    </div>
  );
};

export default CreateGoal;