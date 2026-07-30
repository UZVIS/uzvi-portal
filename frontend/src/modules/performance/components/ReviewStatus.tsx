// src/modules/performance/components/ReviewStatus.tsx

import React, { useEffect, useState } from "react";

import {
  getReviewStatus,
} from "../services/performanceService";

import type {
  ReviewStatus as ReviewStatusType,
} from "../types";


interface ReviewStatusProps {
  employeeId: string;
  cycleId: number;
}


const ReviewStatus: React.FC<ReviewStatusProps> = ({
  employeeId,
  cycleId,
}) => {


  const [status, setStatus] =
    useState<ReviewStatusType | null>(null);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");



  useEffect(() => {

    loadStatus();

  }, [employeeId, cycleId]);




  const loadStatus = async () => {

    try {

      setLoading(true);

      setError("");

      const data =
        await getReviewStatus(
          cycleId
        );


      setStatus(data);


    } catch (err) {

      console.error(err);

      setError(
        "Unable to load review status"
      );

    } finally {

      setLoading(false);

    }

  };





  if (loading) {

    return (
      <p>
        Loading review status...
      </p>
    );

  }





  if (error) {

    return (

      <p className="error">
        {error}
      </p>

    );

  }





  if (!status) {

    return null;

  }





  return (

    <div className="review-status">


      <h2>
        Review Status
      </h2>




      <p>
        Employee:
        {" "}
        {status.employee_name}
      </p>




      <p>
        Total Goals:
        {" "}
        {status.goals_count}
      </p>




      <p>
        Status:
        {" "}
        {status.status}
      </p>




      <p>
        Self Assessment:
        {" "}
        {
          status.self_assessment_submitted
            ? "Completed"
            : "Pending"
        }
      </p>




      <p>
        Manager Review:
        {" "}
        {
          status.manager_review_completed
            ? "Completed"
            : "Pending"
        }
      </p>




      <div>
        Completion:
        {" "}
        {status.completion_percentage}%
      </div>



    </div>

  );

};


export default ReviewStatus;