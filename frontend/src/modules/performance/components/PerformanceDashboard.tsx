// src/modules/performance/components/PerformanceDashboard.tsx

import React, { useEffect, useState } from "react";

import {
  getActiveCycle,
  getMyGoals,
} from "../services/performanceService";

import type {
  ReviewCycle,
  Goal,
} from "../types";

const PerformanceDashboard: React.FC = () => {

  const [activeCycle, setActiveCycle] =
    useState<ReviewCycle | null>(null);

  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");


      // ================= ACTIVE REVIEW CYCLE =================

      const cycle =
        await getActiveCycle();

      setActiveCycle(cycle);


      if (!cycle) {

        setGoals([]);

        return;

      }


      // ================= CURRENT EMPLOYEE GOALS =================

      const allGoals =
        await getMyGoals();


      // Only show goals belonging to the active review cycle
      const cycleGoals =
        allGoals.filter(
          (goal) =>
            goal.cycle_id === cycle.id
        );


      setGoals(cycleGoals);


    } catch (err) {

      console.error(
        "Dashboard loading error:",
        err
      );

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


  // ================= SUMMARY CALCULATIONS =================

  const totalGoals =
    goals.length;


  const completedReviews =
    goals.filter(
      (goal) =>
        goal.status === "completed"
    ).length;


  const pendingReviews =
    goals.filter(
      (goal) =>
        goal.status !== "completed"
    ).length;


  const selfSubmittedGoals =
    goals.filter(
      (goal) =>
        goal.status === "self_submitted" ||
        goal.status === "manager_reviewed" ||
        goal.status === "completed"
    ).length;


  const managerReviewedGoals =
    goals.filter(
      (goal) =>
        goal.status === "manager_reviewed" ||
        goal.status === "completed"
    ).length;


  const completionPercentage =
    totalGoals === 0
      ? 0
      : Math.round(
          (completedReviews / totalGoals) * 100
        );


  return (

    <div className="space-y-8">


      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">


        {/* Total Goals */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Total Goals
          </p>

          <h2 className="text-4xl font-bold text-gray-800 mt-3">
            {totalGoals}
          </h2>

        </div>


        {/* Completed Reviews */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Completed Reviews
          </p>

          <h2 className="text-4xl font-bold text-green-600 mt-3">
            {completedReviews}
          </h2>

        </div>


        {/* Pending Reviews */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Pending Reviews
          </p>

          <h2 className="text-4xl font-bold text-orange-500 mt-3">
            {pendingReviews}
          </h2>

        </div>


        {/* Active Review Cycle */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <p className="text-sm text-gray-500">
            Active Review Cycle
          </p>

          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {activeCycle.id}
          </h2>

        </div>

      </div>



      {/* ================= PERFORMANCE & GOALS ================= */}

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


            {/* Review Cycle */}

            <div>

              <p className="text-sm text-gray-500 mb-2">
                Review Cycle
              </p>

              <h3 className="text-2xl font-bold text-gray-800">
                {activeCycle.name}
              </h3>

            </div>


            {/* Dates */}

            <div className="space-y-5">


              {/* Start Date */}

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


              {/* End Date */}

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



          {/* ================= REVIEW PROGRESS ================= */}

          <div className="mt-8">


            <div className="flex justify-between items-center mb-3">

              <span className="font-medium text-gray-600">
                Review Progress
              </span>

              <span className="font-semibold text-orange-500">
                {completionPercentage}%
              </span>

            </div>


            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />

            </div>

          </div>



          {/* ================= REVIEW SUMMARY ================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">


            {/* Self Assessment */}

            <div className="rounded-2xl border border-gray-200 p-6 bg-gray-50">

              <p className="text-sm text-gray-500">
                Self Assessment
              </p>

              <h3 className="text-xl font-semibold mt-2">

                {totalGoals === 0
                  ? "Pending"
                  : selfSubmittedGoals === totalGoals
                  ? "Submitted"
                  : "Pending"}

              </h3>

            </div>


            {/* Manager Review */}

            <div className="rounded-2xl border border-gray-200 p-6 bg-gray-50">

              <p className="text-sm text-gray-500">
                Manager Review
              </p>

              <h3 className="text-xl font-semibold mt-2">

                {totalGoals === 0
                  ? "Pending"
                  : managerReviewedGoals === totalGoals
                  ? "Completed"
                  : "Pending"}

              </h3>

            </div>

          </div>


          {/* ================= GOAL DETAILS SUMMARY ================= */}

          {goals.length > 0 && (

            <div className="mt-8">

              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Current Goals
              </h3>


              <div className="space-y-3">

                {goals.map((goal) => (

                  <div
                    key={goal.id}
                    className="rounded-xl border border-gray-200 p-5"
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">


                      <div>

                        <p className="font-semibold text-gray-800">
                          {goal.description}
                        </p>

                        {goal.target_outcome && (

                          <p className="text-sm text-gray-500 mt-1">
                            {goal.target_outcome}
                          </p>

                        )}

                      </div>


                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-full
                          px-4
                          py-1
                          text-sm
                          font-semibold
                          whitespace-nowrap
                          ${
                            goal.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : goal.status === "self_submitted"
                              ? "bg-blue-100 text-blue-700"
                              : goal.status === "manager_reviewed"
                              ? "bg-purple-100 text-purple-700"
                              : goal.status === "in_progress"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        `}
                      >

                        {goal.status === "not_started"
                          ? "Pending"
                          : goal.status === "in_progress"
                          ? "In Progress"
                          : goal.status === "self_submitted"
                          ? "Self Submitted"
                          : goal.status === "manager_reviewed"
                          ? "Manager Reviewed"
                          : "Completed"}

                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

};

export default PerformanceDashboard;