// src/modules/performance/services/performanceService.ts

import axios from "axios";

import type {
  Goal,
  TeamGoal,
  CreateGoalData,
  GoalWithAssessments,
  SelfAssessment,
  ManagerReview,
  ReviewCycle,
  ReviewStatus,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1/performance";

const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

// ================= CURRENT EMPLOYEE =================

const getCurrentEmployeeId = (): string => {
  const employeeId = localStorage.getItem("employee_id");

  return employeeId && employeeId.trim()
    ? employeeId.trim()
    : "EMP001";
};

// ================= REVIEW CYCLES =================

export const getCycles = async (): Promise<ReviewCycle[]> => {
  const response = await api.get("/cycles");

  return response.data;
};

// ================= CREATE REVIEW CYCLE =================

export const createReviewCycle = async (
  data: {
    name: string;
    period_start: string;
    period_end: string;
  }
): Promise<ReviewCycle> => {
  const response = await api.post(
    "/cycles",
    data
  );

  return response.data;
};

// ================= CREATE GOAL =================

export const createGoal = async (
  data: CreateGoalData
): Promise<Goal> => {
  const employeeId = getCurrentEmployeeId();

  const response = await api.post(
    `/goals?employee_id=${encodeURIComponent(
      employeeId
    )}`,
    data
  );

  return response.data;
};

// ================= GET MY GOALS =================

export const getMyGoals = async (): Promise<Goal[]> => {
  const employeeId = getCurrentEmployeeId();

  const response = await api.get(
    `/goals/me?employee_id=${encodeURIComponent(
      employeeId
    )}`
  );

  return response.data;
};

// ================= GET GOAL BY ID =================

export const getGoalById = async (
  goalId: number
): Promise<Goal> => {
  const response = await api.get(
    `/goals/${goalId}`
  );

  return response.data;
};

// ================= GOAL WITH ASSESSMENTS =================

export const getGoalWithAssessments = async (
  goalId: number
): Promise<GoalWithAssessments> => {
  const response = await api.get(
    `/goals/${goalId}`
  );

  return response.data;
};

// ================= SELF ASSESSMENT =================

export const submitSelfAssessment = async (
  goalId: number,
  data: {
    assessment_text: string;
  }
): Promise<SelfAssessment> => {
  const employeeId = getCurrentEmployeeId();

  const response = await api.post(
    `/goals/${goalId}/self-assessment?employee_id=${encodeURIComponent(
      employeeId
    )}`,
    data
  );

  return response.data;
};

// ================= MANAGER REVIEW =================

export const submitManagerReview = async (
  goalId: number,
  data: {
    rating: number;
    review_text?: string;
  }
): Promise<ManagerReview> => {
  // V1 local testing: Manager = MGR001
  const managerId = "MGR001";

  const response = await api.post(
    `/goals/${goalId}/manager-review?employee_id=${managerId}`,
    data
  );

  return response.data;
};

// ================= REVIEW STATUS =================

export const getReviewStatus = async (
  cycleId: number,
  employeeId?: string
): Promise<ReviewStatus> => {
  const currentEmployeeId =
    employeeId || getCurrentEmployeeId();

  const response = await api.get(
    `/status/employee/${encodeURIComponent(
      currentEmployeeId
    )}?cycle_id=${cycleId}`
  );

  return response.data;
};

// ================= ACTIVE REVIEW CYCLE =================

export const getActiveCycle = async (
  employeeId: string = getCurrentEmployeeId()
): Promise<ReviewCycle | null> => {
  const response = await api.get(
    `/cycles/active?employee_id=${encodeURIComponent(
      employeeId
    )}`
  );

  return response.data;
};

// ================= TEAM GOALS =================

export const getTeamGoals = async (): Promise<TeamGoal[]> => {
  // V1 local testing: Manager = MGR001
  const managerId = "MGR001";

  const activeCycle =
    await getActiveCycle(managerId);

  if (!activeCycle) {
    return [];
  }

  const response = await api.get(
    `/team?cycle_id=${activeCycle.id}&employee_id=${managerId}`
  );

  return response.data;
};

export default api;