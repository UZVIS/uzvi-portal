// src/modules/performance/components/PerformanceDashboard.tsx

import React, { useEffect, useState } from "react";

import {
  getActiveCycle,
} from "../services/performanceService";

import type {
  ReviewCycle,
} from "../types";

import CreateGoal from "./CreateGoal";
import GoalsList from "./GoalsList";
//import SelfAssessment from "./SelfAssessment";
//import ManagerReview from "./ManagerReview";
import ReviewStatus from "./ReviewStatus";

const PerformanceDashboard: React.FC = () => {
  const [activeCycle, setActiveCycle] =
    useState<ReviewCycle | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const employeeId =
    localStorage.getItem("employee_id") || "";

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const cycle =
        await getActiveCycle();

      setActiveCycle(cycle);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>{error}</h2>
      </div>
    );
  }

  if (!activeCycle) {
    return (
      <div>
        <h2>No Active Review Cycle</h2>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">

      <h1>Performance & Goals</h1>

      <div className="cycle-card">
        <h2>{activeCycle.name}</h2>

        <p>
          <strong>Start:</strong>{" "}
          {new Date(
            activeCycle.period_start
          ).toLocaleDateString()}
        </p>

        <p>
          <strong>End:</strong>{" "}
          {new Date(
            activeCycle.period_end
          ).toLocaleDateString()}
        </p>
      </div>

      <hr />

      <CreateGoal />

      <hr />

      <GoalsList />

      <hr />

      {/* <SelfAssessment /> */}

      <hr />

      {/* <ManagerReview /> */}

      <hr />

    

      <ReviewStatus
          employeeId={employeeId}
          cycleId={activeCycle.id}
      />

    </div>
  );
};

export default PerformanceDashboard;