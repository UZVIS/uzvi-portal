// src/modules/performance/components/ReviewStatus.tsx

import React, { useEffect, useState } from "react";

import {
  getActiveCycle,
  getReviewStatus,
} from "../services/performanceService";

import type {
  ReviewCycle,
  ReviewStatus as ReviewStatusType,
} from "../types";


interface ReviewStatusProps {
  employeeId: string;
  cycleId: number;
}


const ReviewStatus: React.FC<ReviewStatusProps> = ({
  employeeId,
}) => {

  const [activeCycle, setActiveCycle] =
    useState<ReviewCycle | null>(null);

  const [status, setStatus] =
    useState<ReviewStatusType | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadStatus = async () => {

    try {

      setLoading(true);

      setError("");


      // ================= ACTIVE REVIEW CYCLE =================

      const cycle =
        await getActiveCycle(employeeId);


      setActiveCycle(cycle);


      if (!cycle) {

        setStatus(null);

        setError(
          "No active review cycle found"
        );

        return;

      }


      // ================= REVIEW STATUS =================

      const data =
        await getReviewStatus(cycle.id);


      setStatus(data);

    } catch (err) {

      console.error(
        "Unable to load review status:",
        err
      );

      setError(
        "Unable to load review status"
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadStatus();

  }, [employeeId]);


  if (loading) {

    return (

      <div className="flex items-center justify-center h-60">

        <p className="text-lg font-semibold text-gray-600">
          Loading Review Status...
        </p>

      </div>

    );

  }


  if (error) {

    return (

      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

        <h2 className="text-red-600 font-semibold">
          {error}
        </h2>

      </div>

    );

  }


  if (!status) {

    return (

      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">

        <h2 className="text-yellow-700 font-semibold">
          No Review Status Found
        </h2>

      </div>

    );

  }


  return (

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      {/* Header */}

      <div className="mb-8">

        <h2 className="text-3xl font-bold text-gray-800">
          Review Status
        </h2>

        <p className="text-gray-500 mt-2">
          Track your review completion status.
        </p>

      </div>


      {/* Active Review Cycle */}

      {activeCycle && (

        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6">

          <p className="text-sm text-gray-500">
            Active Review Cycle
          </p>

          <h3 className="text-xl font-bold text-gray-800 mt-2">
            {activeCycle.name}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Cycle ID: {activeCycle.id}
          </p>

        </div>

      )}


      {/* Top Summary */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">

          <p className="text-sm text-gray-500">
            Employee
          </p>

          <h3 className="text-xl font-bold text-gray-800 mt-2">
            {status.employee_name}
          </h3>

        </div>


        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">

          <p className="text-sm text-gray-500">
            Total Goals
          </p>

          <h3 className="text-xl font-bold text-gray-800 mt-2">
            {status.goals_count}
          </h3>

        </div>

      </div>


      {/* Status Summary */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        <div className="bg-white border border-gray-200 rounded-xl p-6">

          <p className="text-sm text-gray-500 mb-3">
            Overall Status
          </p>

          <span
            className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold
              ${
                status.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : status.status === "manager_reviewed"
                  ? "bg-blue-100 text-blue-700"
                  : status.status === "self_submitted"
                  ? "bg-orange-100 text-orange-700"
                  : status.status === "in_progress"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }
            `}
          >
            {status.status.replaceAll("_", " ")}
          </span>

        </div>


        <div className="bg-white border border-gray-200 rounded-xl p-6">

          <p className="text-sm text-gray-500 mb-3">
            Completion
          </p>

          <h2 className="text-3xl font-bold text-gray-800">
            {status.completion_percentage}%
          </h2>

        </div>

      </div>


      {/* Progress */}

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">

        <div className="flex justify-between items-center mb-3">

          <span className="font-semibold text-gray-700">
            Review Progress
          </span>

          <span className="font-semibold text-orange-600">
            {status.completion_percentage}%
          </span>

        </div>


        <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">

          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{
              width: `${status.completion_percentage}%`,
            }}
          />

        </div>

      </div>


      {/* Assessment Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Self Assessment */}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">

          <p className="text-sm text-gray-500 mb-2">
            Self Assessment
          </p>

          <h3
            className={`text-lg font-semibold ${
              status.self_assessment_submitted
                ? "text-green-600"
                : "text-orange-500"
            }`}
          >
            {status.self_assessment_submitted
              ? "Completed"
              : "Pending"}
          </h3>

        </div>


        {/* Manager Review */}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">

          <p className="text-sm text-gray-500 mb-2">
            Manager Review
          </p>

          <h3
            className={`text-lg font-semibold ${
              status.manager_review_completed
                ? "text-green-600"
                : "text-orange-500"
            }`}
          >
            {status.manager_review_completed
              ? "Completed"
              : "Pending"}
          </h3>

        </div>

      </div>

    </div>

  );

};

export default ReviewStatus;