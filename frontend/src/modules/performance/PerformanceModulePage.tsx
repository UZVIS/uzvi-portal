import React, { useEffect, useState } from "react";

import PerformanceDashboard from "./components/PerformanceDashboard";
import CreateGoal from "./components/CreateGoal";
import GoalsList from "./components/GoalsList";
import SelfAssessment from "./components/SelfAssessment";
import ManagerReview from "./components/ManagerReview";
import ReviewStatus from "./components/ReviewStatus";
import TeamGoals from "./components/TeamGoals";
import CreateReviewCycle from "./components/CreateReviewCycle";
import ReviewCycles from "./components/ReviewCycles";
import OrgReviewStatus from "./components/OrgReviewStatus";

import {
  getMyGoals,
  getTeamGoals,
} from "./services/performanceService";

import type {
  Goal,
  TeamGoal,
} from "./types";

interface PerformanceModulePageProps {
  role: "Admin" | "Manager" | "Employee";
}

const PerformanceModulePage: React.FC<
  PerformanceModulePageProps
> = ({ role }) => {

  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [currentGoalId, setCurrentGoalId] =
    useState<number | null>(null);

  const [currentEmployeeId, setCurrentEmployeeId] =
    useState("EMP001");

  const [loadingGoal, setLoadingGoal] =
    useState(false);

  const [goalError, setGoalError] =
    useState("");

  // ================= CURRENT EMPLOYEE =================

  useEffect(() => {
    const storedEmployeeId =
      localStorage.getItem("employee_id");

    if (storedEmployeeId) {
      setCurrentEmployeeId(storedEmployeeId);
      return;
    }

    if (role === "Admin") {
      setCurrentEmployeeId("ADMIN1");
      return;
    }

    if (role === "Manager") {
      setCurrentEmployeeId("MGR001");
      return;
    }

    setCurrentEmployeeId("EMP001");
  }, [role]);


  // ================= LOAD CURRENT GOAL =================

  useEffect(() => {

    const loadCurrentGoal = async () => {

      try {

        setLoadingGoal(true);
        setGoalError("");

        // ================= EMPLOYEE =================

        if (role === "Employee") {

          const goals: Goal[] =
            await getMyGoals();

          if (goals.length > 0) {

            // Use the latest created goal
            const latestGoal =
              goals[goals.length - 1];

            setCurrentGoalId(
              latestGoal.id
            );

          } else {

            setCurrentGoalId(null);

          }

          return;
        }


        // ================= MANAGER =================

        if (role === "Manager") {

          const teamGoals: TeamGoal[] =
            await getTeamGoals();

          if (teamGoals.length > 0) {

            // Use the latest team goal
            const latestTeamGoal =
              teamGoals[teamGoals.length - 1];

            setCurrentGoalId(
              latestTeamGoal.id
            );

          } else {

            setCurrentGoalId(null);

          }

          return;
        }


        // ================= ADMIN =================

        setCurrentGoalId(null);

      } catch (error) {

        console.error(
          "Unable to load current goal:",
          error
        );

        setGoalError(
          "Unable to load current goal."
        );

        setCurrentGoalId(null);

      } finally {

        setLoadingGoal(false);

      }

    };


    loadCurrentGoal();

  }, [role, currentEmployeeId]);


  return (

    <div className="p-6">

      {/* Header */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-gray-800">

          Performance & Goals

        </h1>

        <p className="text-gray-500 mt-2">

          Manage goals, self assessments and performance reviews

        </p>

      </div>


      {/* ================= GOAL LOADING / ERROR ================= */}

      {goalError && (

        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

          <p className="text-red-600 font-medium">

            {goalError}

          </p>

        </div>

      )}


      {/* Tabs */}

      <div className="flex gap-3 mb-6 border-b pb-3 flex-wrap">

        {/* Dashboard */}

        <button
          onClick={() => setActiveTab("dashboard")}
          className={
            activeTab === "dashboard"
              ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
              : "px-4 py-2 rounded-lg bg-gray-100"
          }
        >
          Dashboard
        </button>


        {/* ================= ADMIN ================= */}

        {role === "Admin" && (
          <>

            <button
              onClick={() => setActiveTab("createCycle")}
              className={
                activeTab === "createCycle"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Create Review Cycle
            </button>

            <button
              onClick={() => setActiveTab("reviewCycles")}
              className={
                activeTab === "reviewCycles"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Review Cycles
            </button>

            <button
              onClick={() => setActiveTab("orgStatus")}
              className={
                activeTab === "orgStatus"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Organization Status
            </button>

          </>
        )}


        {/* ================= EMPLOYEE ================= */}

        {role === "Employee" && (
          <>

            <button
              onClick={() => setActiveTab("create")}
              className={
                activeTab === "create"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Create Goal
            </button>

            <button
              onClick={() => setActiveTab("goals")}
              className={
                activeTab === "goals"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              My Goals
            </button>

            <button
              onClick={() => setActiveTab("assessment")}
              className={
                activeTab === "assessment"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Self Assessment
            </button>

            <button
              onClick={() => setActiveTab("status")}
              className={
                activeTab === "status"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Review Status
            </button>

          </>
        )}


        {/* ================= MANAGER ================= */}

        {role === "Manager" && (
          <>

            <button
              onClick={() => setActiveTab("teamGoals")}
              className={
                activeTab === "teamGoals"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Team Goals
            </button>

            <button
              onClick={() => setActiveTab("review")}
              className={
                activeTab === "review"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Manager Review
            </button>

            <button
              onClick={() => setActiveTab("status")}
              className={
                activeTab === "status"
                  ? "px-4 py-2 rounded-lg bg-orange-500 text-white"
                  : "px-4 py-2 rounded-lg bg-gray-100"
              }
            >
              Review Status
            </button>

          </>
        )}

      </div>


      {/* ================= CONTENT ================= */}

      <div>

        {/* Dashboard */}

        {activeTab === "dashboard" && (
          <PerformanceDashboard />
        )}


        {/* Create Goal */}

        {activeTab === "create" &&
          role === "Employee" && (
            <CreateGoal />
          )}


        {/* My Goals */}

        {activeTab === "goals" &&
          role === "Employee" && (
            <GoalsList />
          )}


        {/* Self Assessment */}

        {activeTab === "assessment" &&
          role === "Employee" && (

            <>
              {loadingGoal ? (

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                  <div className="text-lg font-semibold text-gray-600">
                    Loading goal...
                  </div>

                </div>

              ) : currentGoalId ? (

                <SelfAssessment
                  goalId={currentGoalId}
                />

              ) : (

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                  <h2 className="text-2xl font-bold text-gray-800">
                    No Goal Available
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Please create a goal before submitting a self assessment.
                  </p>

                </div>

              )}
            </>

          )}


        {/* Team Goals */}

        {activeTab === "teamGoals" &&
          role === "Manager" && (
            <TeamGoals />
          )}


        {/* Manager Review */}

        {activeTab === "review" &&
          role === "Manager" && (

            <>
              {loadingGoal ? (

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                  <div className="text-lg font-semibold text-gray-600">
                    Loading team goal...
                  </div>

                </div>

              ) : currentGoalId ? (

                <ManagerReview
                  goalId={currentGoalId}
                />

              ) : (

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                  <h2 className="text-2xl font-bold text-gray-800">
                    No Team Goal Available
                  </h2>

                  <p className="text-gray-500 mt-2">
                    No employee goal is available for manager review.
                  </p>

                </div>

              )}
            </>

          )}


        {/* Review Status */}

        {activeTab === "status" &&
          (role === "Employee" ||
            role === "Manager") && (

            <ReviewStatus
              employeeId={currentEmployeeId}
              cycleId={1}
            />

          )}


        {/* Create Review Cycle */}

        {activeTab === "createCycle" &&
          role === "Admin" && (
            <CreateReviewCycle />
          )}


        {/* Review Cycles */}

        {activeTab === "reviewCycles" &&
          role === "Admin" && (
            <ReviewCycles />
          )}


        {/* Organization Status */}

        {activeTab === "orgStatus" &&
          role === "Admin" && (
            <OrgReviewStatus />
          )}

      </div>

    </div>

  );

};

export default PerformanceModulePage;