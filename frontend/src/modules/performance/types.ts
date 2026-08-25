// src/modules/performance/types.ts


export type GoalStatus =

  | "not_started"

  | "in_progress"

  | "self_submitted"

  | "manager_reviewed"

  | "completed";



export interface ReviewCycle {

  id:number;

  name:string;

  period_start:string;

  period_end:string;

  created_at:string;

  updated_at?:string;

}



export interface Goal {

  id:number;

  employee_id:string;

  cycle_id:number;

  description:string;

  target_outcome?:string;

  status:GoalStatus;

  created_at:string;

  updated_at?:string;

}



export interface CreateGoalData {

  description:string;

  target_outcome?:string;

  cycle_id:number;

}



export interface SelfAssessment {

  id:number;

  goal_id:number;

  assessment_text:string;

  submitted_at:string;

}



export interface ManagerReview {

  id:number;

  goal_id:number;

  reviewer_id:string;

  rating:number;

  review_text?:string;

  submitted_at:string;

}



export interface GoalWithAssessments extends Goal {

  self_assessment?:SelfAssessment;

  manager_review?:ManagerReview;

}



export interface ReviewStatus{

  employee_id:string;

  employee_name:string;

  goals_count:number;

  status:GoalStatus;

  self_assessment_submitted:boolean;

  manager_review_completed:boolean;

  completion_percentage:number;

}



export interface CreateSelfAssessmentData {

  assessment_text:string;

}



export interface CreateManagerReviewData {

  rating:number;

  review_text?:string;

}

export interface TeamGoal {

  id: number;

  employee_id: string;

  employee_name: string;

  cycle_id: number;

  description: string;

  target_outcome?: string;

  status: GoalStatus;

}