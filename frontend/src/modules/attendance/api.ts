import axios from "axios";

import type {
  Attendance,
  AttendanceFormData,
  AttendanceFilter,
  AttendanceSummary,
  TeamAttendance,
  UnexplainedAbsence,
} from "./types";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1/attendance";


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// GET ALL ATTENDANCE

export const getAttendance = async (
  params?: AttendanceFilter
): Promise<Attendance[]> => {

  const response = await api.get("/", {
    params,
  });

  return response.data;
};


// GET BY ID

export const getAttendanceById = async (
  id: number
): Promise<Attendance> => {

  const response = await api.get(`/${id}`);

  return response.data;
};


// CREATE

export const createAttendance = async (
  data: AttendanceFormData
): Promise<Attendance> => {

  const response = await api.post("/", data);

  return response.data;
};


// UPDATE

export const updateAttendance = async (
  id: number,
  data: AttendanceFormData
): Promise<Attendance> => {

  const response = await api.put(
    `/${id}`,
    data
  );

  return response.data;
};


// DELETE

export const deleteAttendance = async (
  id: number
): Promise<void> => {

  await api.delete(`/${id}`);

};


// EMPLOYEE ATTENDANCE

export const getEmployeeAttendance = async (
  employeeId: string
): Promise<Attendance[]> => {

  const response =
    await api.get(`/employee/${employeeId}`);

  return response.data;
};


// MONTHLY SUMMARY

export const getAttendanceSummary = async (
  employeeId: string,
  year: number,
  month: number
): Promise<AttendanceSummary> => {

  const response =
    await api.get(
      `/summary/${employeeId}`,
      {
        params: {
          year,
          month,
        },
      }
    );

  return response.data;
};


// UNEXPLAINED ABSENCES

export const getUnexplainedAbsences =
async (): Promise<UnexplainedAbsence[]> => {

  const response =
    await api.get("/unexplained-absences");

  return response.data;
};


// TEAM ATTENDANCE

export const getTeamAttendance = async (
  teamId: string
): Promise<TeamAttendance[]> => {

  const response =
    await api.get(`/team/${teamId}`);

  return response.data;
};


// EXPORT

export const exportAttendance = async (
  employeeId: string
): Promise<Blob> => {

  const response =
    await api.get(
      `/export/${employeeId}`,
      {
        responseType: "blob",
      }
    );

  return response.data;
};


export default api;