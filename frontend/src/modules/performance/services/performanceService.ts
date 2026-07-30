// src/modules/performance/services/performanceService.ts


import axios from "axios";

import type {
  Goal,
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




// ================= REVIEW CYCLES =================


export const getCycles = async():
Promise<ReviewCycle[]> => {


  const response =
    await api.get("/cycles");


  return response.data;

};




// ================= CREATE GOAL =================


export const createGoal = async(
  data: CreateGoalData
): Promise<Goal> => {


  const response =
    await api.post(
      "/goals",
      data
    );


  return response.data;

};




// ================= GET MY GOALS =================


export const getMyGoals = async():
Promise<Goal[]> => {


  const response =
    await api.get(
      "/goals/me"
    );


  return response.data;

};




// ================= GET GOAL BY ID =================


export const getGoalById = async(
  goalId:number
): Promise<Goal> => {


  const response =
    await api.get(
      `/goals/${goalId}`
    );


  return response.data;

};




// ================= GOAL WITH ASSESSMENTS =================


export const getGoalWithAssessments =
async(
 goalId:number
):Promise<GoalWithAssessments>=>{


 const response =
 await api.get(
   `/goals/${goalId}`
 );


 return response.data;


};




// ================= SELF ASSESSMENT =================


export const submitSelfAssessment =
async(

 goalId:number,

 data:{
   assessment_text:string;
 }

):Promise<SelfAssessment>=>{


 const response =
 await api.post(

   `/goals/${goalId}/self-assessment`,

   data

 );


 return response.data;


};




// ================= MANAGER REVIEW =================


export const submitManagerReview =
async(

 goalId:number,

 data:{
   rating:number;
   review_text?:string;
 }

):Promise<ManagerReview>=>{


 const response =
 await api.post(

   `/goals/${goalId}/manager-review`,

   data

 );


 return response.data;


};




// ================= REVIEW STATUS =================


export const getReviewStatus =
async(

 cycleId:number

):Promise<ReviewStatus>=>{


 const response =
 await api.get(

   `/status/me?cycle_id=${cycleId}`

 );


 return response.data;


};




// ================= ACTIVE REVIEW CYCLE =================


export const getActiveCycle =
async():
Promise<ReviewCycle | null> => {


  const response =
    await api.get(
      "/cycles/active"
    );


  return response.data;

};



export default api;