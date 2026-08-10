// src/modules/performance/components/GoalsList.tsx

import React, { useEffect, useState } from "react";

import {
  getMyGoals,
  getGoalWithAssessments,
} from "../services/performanceService";

import type {
  Goal,
  GoalWithAssessments,
} from "../types";

const GoalsList: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] =
    useState<GoalWithAssessments | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyGoals();

      setGoals(data);
    } catch (err) {
      console.error(err);

      setError("Unable to load goals");
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (
    goalId: number
  ) => {
    try {
      const data =
        await getGoalWithAssessments(
          goalId
        );

      setSelectedGoal(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">

        <div className="text-lg font-semibold text-gray-600">
          Loading Goals...
        </div>

      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      {/* Header */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h2 className="text-3xl font-bold text-gray-800">
            My Goals
          </h2>

          <p className="text-gray-500 mt-2">
            View all your assigned performance goals.
          </p>

        </div>

      </div>

      {/* Error */}

      {error && (

        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

          <p className="text-red-600 font-medium">
            {error}
          </p>

        </div>

      )}

      {/* Empty State */}

      {goals.length === 0 ? (

        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">

          <h3 className="text-xl font-semibold text-gray-700">
            No Goals Found
          </h3>

          <p className="text-gray-500 mt-2">
            You don't have any performance goals yet.
          </p>

        </div>

      ) : (

        <div className="overflow-x-auto rounded-xl border border-gray-200">

          <table className="min-w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Target Outcome
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200">

                            {goals.map((goal) => (

                <tr
                  key={goal.id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {/* Description */}

                  <td className="px-6 py-5">

                    <div className="font-medium text-gray-800">
                      {goal.description}
                    </div>

                  </td>

                  {/* Target Outcome */}

                  <td className="px-6 py-5 text-gray-600">

                    {goal.target_outcome || "-"}

                  </td>

                  {/* Status */}

                  <td className="px-6 py-5 text-center">

                    {goal.status === "completed" && (

                      <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">

                        Completed

                      </span>

                    )}

                    {goal.status === "in_progress" && (

                      <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-700">

                        In Progress

                      </span>

                    )}

                    {goal.status === "not_started" && (

                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-700">

                        Pending

                      </span>

                    )}

                    {goal.status !== "completed" &&
                      goal.status !== "in_progress" &&
                      goal.status !== "not_started" && (

                      <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1 text-sm font-semibold text-gray-700">

                        {goal.status}

                      </span>

                    )}

                  </td>

                  {/* Action */}

                  <td className="px-6 py-5 text-center">

                    <button
                      onClick={() => viewDetails(goal.id)}
                      className="
                        rounded-lg
                        bg-orange-500
                        px-5
                        py-2
                        text-white
                        font-medium
                        transition-all
                        hover:bg-orange-600
                        hover:shadow-md
                      "
                    >
                      View
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

            {/* Goal Details */}

      {selectedGoal && (

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm p-8">

          <div className="flex items-center justify-between mb-6">

            <h3 className="text-2xl font-bold text-gray-800">
              Goal Details
            </h3>

            <button
              onClick={() => setSelectedGoal(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100 transition-all"
            >
              Close
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Description */}

            <div>

              <p className="text-sm font-semibold text-gray-500 mb-2">
                Goal Description
              </p>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-gray-700">
                {selectedGoal.description}
              </div>

            </div>

            {/* Status */}

            <div>

              <p className="text-sm font-semibold text-gray-500 mb-2">
                Current Status
              </p>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-gray-700">
                {selectedGoal.status}
              </div>

            </div>

            {/* Self Assessment */}

            <div>

              <p className="text-sm font-semibold text-gray-500 mb-2">
                Self Assessment
              </p>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 min-h-[120px] text-gray-700">

                {selectedGoal.self_assessment
                  ? selectedGoal.self_assessment.assessment_text
                  : "Not submitted"}

              </div>

            </div>

            {/* Manager Review */}

            <div>

              <p className="text-sm font-semibold text-gray-500 mb-2">
                Manager Review
              </p>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 min-h-[120px] text-gray-700">

                {selectedGoal.manager_review
                  ? selectedGoal.manager_review.review_text
                  : "Not reviewed"}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default GoalsList;
          