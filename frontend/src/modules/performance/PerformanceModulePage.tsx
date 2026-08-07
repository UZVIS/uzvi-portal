import React, { useState } from "react";

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

interface PerformanceModulePageProps {
  role: "Admin" | "Manager" | "Employee";
}

const PerformanceModulePage: React.FC<
  PerformanceModulePageProps
> = ({ role }) => {

  const [activeTab, setActiveTab] =
    useState("dashboard");

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

        {activeTab === "dashboard" && (
          <PerformanceDashboard />
        )}

        {activeTab === "create" && role === "Employee" && (
          <CreateGoal />
        )}

        {activeTab === "goals" && role === "Employee" && (
          <GoalsList />
        )}

        {activeTab === "assessment" && role === "Employee" && (
          <SelfAssessment goalId={1} />
        )}

        {activeTab === "teamGoals" && role === "Manager" && (
          <TeamGoals />
        )}

        {activeTab === "review" && role === "Manager" && (
          <ManagerReview goalId={1} />
        )}

        {activeTab === "status" &&
          (role === "Employee" || role === "Manager") && (
            <ReviewStatus
              employeeId="EMP001"
              cycleId={1}
            />
        )}

        {activeTab === "createCycle" && role === "Admin" && (
          <CreateReviewCycle />
        )}

        {activeTab === "reviewCycles" && role === "Admin" && (
          <ReviewCycles />
        )}

        {activeTab === "orgStatus" && role === "Admin" && (
          <OrgReviewStatus />
        )}

      </div>

    </div>

  );

};

export default PerformanceModulePage;