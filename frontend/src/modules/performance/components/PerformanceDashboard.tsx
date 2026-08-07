// src/modules/performance/components/PerformanceDashboard.tsx

import React, { useEffect, useState } from "react";

import {
  getActiveCycle,
} from "../services/performanceService";

import type {
  ReviewCycle,
} from "../types";

const PerformanceDashboard: React.FC = () => {

  const [activeCycle, setActiveCycle] =
    useState<ReviewCycle | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");

      const cycle =
        await getActiveCycle();

      setActiveCycle(cycle);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load dashboard"
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadDashboard();

  }, []);

  if (loading) {

    return (

      <div className="flex justify-center items-center h-60">

        <h2 className="text-lg font-semibold text-gray-600">
          Loading Dashboard...
        </h2>

      </div>

    );

  }

  if (error) {

    return (

      <div className="bg-red-50 border border-red-200 rounded-xl p-6">

        <h2 className="text-red-600 font-semibold">
          {error}
        </h2>

      </div>

    );

  }

  if (!activeCycle) {

    return (

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">

        <h2 className="text-yellow-700 font-semibold">
          No Active Review Cycle
        </h2>

      </div>

    );

  }

  return (

    <div className="space-y-8">

      {/* Summary Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Total Goals
          </p>

          <h2 className="text-4xl font-bold text-gray-800 mt-3">
            0
          </h2>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Completed Reviews
          </p>

          <h2 className="text-4xl font-bold text-green-600 mt-3">
            0
          </h2>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Pending Reviews
          </p>

          <h2 className="text-4xl font-bold text-orange-500 mt-3">
            0
          </h2>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Active Review Cycle
          </p>

          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            1
          </h2>

        </div>

      </div>

            {/* Performance & Goals */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Card Header */}

        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gray-50">

          <div>

            <h2 className="text-2xl font-bold text-gray-800">
              Performance & Goals
            </h2>

            <p className="text-gray-500 mt-1">
              Active review cycle information
            </p>

          </div>

          <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            Active
          </span>

        </div>

        {/* Card Body */}

        <div className="p-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left */}

            <div>

              <p className="text-sm text-gray-500 mb-2">
                Review Cycle
              </p>

              <h3 className="text-2xl font-bold text-gray-800">
                {activeCycle.name}
              </h3>

            </div>

            {/* Right */}

            <div className="space-y-5">

              <div className="flex justify-between items-center border-b border-gray-100 pb-3">

                <span className="font-medium text-gray-600">
                  Start Date
                </span>

                <span className="font-semibold text-gray-800">

                  {new Date(
                    activeCycle.period_start
                  ).toLocaleDateString()}

                </span>

              </div>

              <div className="flex justify-between items-center">

                <span className="font-medium text-gray-600">
                  End Date
                </span>

                <span className="font-semibold text-gray-800">

                  {new Date(
                    activeCycle.period_end
                  ).toLocaleDateString()}

                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};

export default PerformanceDashboard;