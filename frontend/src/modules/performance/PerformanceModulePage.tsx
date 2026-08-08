import React, { useState } from "react";

import PerformanceDashboard from "./components/PerformanceDashboard";
import CreateGoal from "./components/CreateGoal";
import GoalsList from "./components/GoalsList";
import SelfAssessment from "./components/SelfAssessment";
import ManagerReview from "./components/ManagerReview";
import ReviewStatus from "./components/ReviewStatus";


const PerformanceModulePage: React.FC = () => {

  const [activeTab, setActiveTab] = useState("dashboard");


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

      <div className="flex gap-3 mb-6 border-b pb-3">


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


      </div>




      {/* Content */}

      <div>


        {
          activeTab === "dashboard" && (
            <PerformanceDashboard />
          )
        }



        {
          activeTab === "create" && (
            <CreateGoal />
          )
        }



        {
          activeTab === "goals" && (
            <GoalsList />
          )
        }



        {
          activeTab === "assessment" && (
            <SelfAssessment
              goalId={1}
            />
          )
        }



        {
          activeTab === "review" && (
            <ManagerReview
              goalId={1}
            />
          )
        }



        {
          activeTab === "status" && (
            <ReviewStatus
              employeeId="EMP001"
              cycleId={1}
            />
          )
        }



      </div>


    </div>
  );
};


export default PerformanceModulePage;