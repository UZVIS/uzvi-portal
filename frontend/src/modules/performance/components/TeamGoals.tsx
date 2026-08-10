import React, { useEffect, useState } from "react";

import {
  getTeamGoals,
  getGoalWithAssessments,
} from "../services/performanceService";

import type {
  TeamGoal,
  GoalWithAssessments,
} from "../types";

const TeamGoals: React.FC = () => {

  const [goals, setGoals] =
    useState<TeamGoal[]>([]);

  const [filteredGoals, setFilteredGoals] =
    useState<TeamGoal[]>([]);

  const [selectedGoal, setSelectedGoal] =
    useState<GoalWithAssessments | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {

    loadGoals();

  }, []);

  useEffect(() => {

    if (!search) {

      setFilteredGoals(goals);

      return;

    }

    const data =
      goals.filter((goal) =>

        goal.employee_name
          .toLowerCase()
          .includes(search.toLowerCase())

      );

    setFilteredGoals(data);

  }, [search, goals]);

  const loadGoals = async () => {

    try {

      setLoading(true);

      setError("");

      const data =
        await getTeamGoals();

      setGoals(data);

      setFilteredGoals(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load team goals"
      );

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

      <div className="flex justify-center items-center h-60">

        <h2 className="text-lg font-semibold text-gray-600">

          Loading Team Goals...

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

    return (

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-3xl font-bold text-gray-800">
            Team Goals
          </h2>

          <p className="text-gray-500 mt-2">
            View and manage your team's performance goals.
          </p>

        </div>

        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-72 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-orange-500"
        />

      </div>

      {

        filteredGoals.length === 0 ? (

          <div className="border rounded-xl p-12 text-center bg-gray-50">

            <h3 className="text-xl font-semibold text-gray-700">

              No Team Goals Found

            </h3>

            <p className="text-gray-500 mt-2">

              No employee goals are available for this review cycle.

            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">

              <thead className="bg-orange-500 text-white">

                <tr>

                  <th className="px-5 py-3 text-left">
                    Employee
                  </th>

                  <th className="px-5 py-3 text-left">
                    Goal
                  </th>

                  <th className="px-5 py-3 text-left">
                    Target
                  </th>

                  <th className="px-5 py-3 text-left">
                    Status
                  </th>

                  <th className="px-5 py-3 text-center">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {

                  filteredGoals.map((goal) => (

                    <tr
                      key={goal.id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="px-5 py-4 font-medium">

                        {goal.employee_id}

                      </td>

                      <td className="px-5 py-4">

                        {goal.description}

                      </td>

                      <td className="px-5 py-4">

                        {goal.target_outcome || "-"}

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold

                          ${
                            goal.status === "completed"
                              ? "bg-green-100 text-green-700"

                              : goal.status === "manager_reviewed"
                              ? "bg-blue-100 text-blue-700"

                              : goal.status === "self_submitted"
                              ? "bg-orange-100 text-orange-700"

                              : goal.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-700"

                              : "bg-gray-100 text-gray-700"
                          }

                          `}
                        >

                          {goal.status.replaceAll("_", " ")}

                        </span>

                      </td>

                      <td className="px-5 py-4 text-center">

                        <button

                          onClick={() =>
                            viewDetails(goal.id)
                          }

                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"

                        >

                          View

                        </button>

                      </td>

                    </tr>

                  ))

                }

              </tbody>

            </table>

          </div>

        )

      }

            {

        selectedGoal && (

          <div className="mt-10">

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">

              <div className="flex items-center justify-between mb-6">

                <h3 className="text-2xl font-bold text-gray-800">

                  Goal Details

                </h3>

                <button

                  onClick={() =>
                    setSelectedGoal(null)
                  }

                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"

                >

                  Close

                </button>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>

                  <p className="text-sm text-gray-500">

                    Goal Description

                  </p>

                  <h4 className="mt-2 font-semibold text-gray-800">

                    {selectedGoal.description}

                  </h4>

                </div>

                <div>

                  <p className="text-sm text-gray-500">

                    Goal Status

                  </p>

                  <span

                    className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-semibold

                    ${
                      selectedGoal.status === "completed"

                        ? "bg-green-100 text-green-700"

                        : selectedGoal.status === "manager_reviewed"

                        ? "bg-blue-100 text-blue-700"

                        : selectedGoal.status === "self_submitted"

                        ? "bg-orange-100 text-orange-700"

                        : selectedGoal.status === "in_progress"

                        ? "bg-yellow-100 text-yellow-700"

                        : "bg-gray-100 text-gray-700"
                    }

                    `}

                  >

                    {selectedGoal.status.replaceAll("_", " ")}

                  </span>

                </div>

                <div>

                  <p className="text-sm text-gray-500">

                    Target Outcome

                  </p>

                  <h4 className="mt-2 font-semibold text-gray-800">

                    {selectedGoal.target_outcome || "-"}

                  </h4>

                </div>

                <div>

                  <p className="text-sm text-gray-500">

                    Self Assessment

                  </p>

                  <div className="mt-2 rounded-lg bg-white border p-4">

                    {

                      selectedGoal.self_assessment

                        ? selectedGoal.self_assessment.assessment_text

                        : "Not Submitted"

                    }

                  </div>

                </div>

                <div className="md:col-span-2">

                  <p className="text-sm text-gray-500">

                    Manager Review

                  </p>

                  <div className="mt-2 rounded-lg bg-white border p-4">

                    {

                      selectedGoal.manager_review

                        ? selectedGoal.manager_review.review_text

                        : "Not Reviewed"

                    }

                  </div>

                </div>

              </div>

            </div>

          </div>

        )

      }

    </div>

  );

};

export default TeamGoals;