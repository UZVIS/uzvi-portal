export { default } from "./PerformanceModulePage";

export { default as PerformanceModulePage } from "./PerformanceModulePage";
export { default as PerformanceDashboard } from "./components/PerformanceDashboard";
export { default as CreateGoal } from "./components/CreateGoal";
export { default as GoalsList } from "./components/GoalsList";
export { default as SelfAssessment } from "./components/SelfAssessment";
export { default as ManagerReview } from "./components/ManagerReview";
export { default as ReviewStatus } from "./components/ReviewStatus";

// Services
export {
  getActiveCycle,
  getCycles,
  createGoal,
  getMyGoals,
  getGoalById,
  getGoalWithAssessments,
  submitSelfAssessment,
  submitManagerReview,
  getReviewStatus,
} from "./services/performanceService";

// Types
export type {
  Goal,
  GoalStatus,
  ReviewCycle,
  CreateGoalData,
  GoalWithAssessments,
  SelfAssessment as SelfAssessmentType,
  ManagerReview as ManagerReviewType,
  ReviewStatus as ReviewStatusType,
  CreateSelfAssessmentData,
  CreateManagerReviewData,
} from "./types";