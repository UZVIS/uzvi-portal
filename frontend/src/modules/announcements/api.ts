import axios from "axios";

import type {
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
  AnnouncementAck,
  PaginatedAnnouncements,
  DashboardSummary
} from "./types";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json"
  }
});

// ----------------------------
// Create
// ----------------------------

export const createAnnouncement = async (
  data: AnnouncementCreate
): Promise<Announcement> => {

  const response = await API.post(
    "/announcements",
    data
  );

  return response.data;
};

// ----------------------------
// Update
// ----------------------------

export const updateAnnouncement = async (
  id: number,
  data: AnnouncementUpdate
): Promise<Announcement> => {

  const response = await API.put(
    `/announcements/${id}`,
    data
  );

  return response.data;
};

// ----------------------------
// Delete
// ----------------------------

export const deleteAnnouncement = async (
  id: number
): Promise<void> => {

  await API.delete(
    `/announcements/${id}`
  );
};

// ----------------------------
// Archive
// ----------------------------

export const archiveAnnouncement = async (
  id: number
): Promise<Announcement> => {

  const response = await API.patch(
    `/announcements/${id}/archive`
  );

  return response.data;
};

// ----------------------------
// Get One
// ----------------------------

export const getAnnouncement = async (
  id: number
): Promise<Announcement> => {

  const response = await API.get(
    `/announcements/${id}`
  );

  return response.data;
};

// ----------------------------
// Get All
// ----------------------------

export const getAnnouncements = async (
  page = 1,
  size = 20
): Promise<PaginatedAnnouncements> => {

  const response = await API.get(
    `/announcements?page=${page}&size=${size}`
  );

  return response.data;
};

// ----------------------------
// Active
// ----------------------------

export const getActiveAnnouncements = async (
  page = 1,
  size = 20
): Promise<PaginatedAnnouncements> => {

  const response = await API.get(
    `/announcements/active/list?page=${page}&size=${size}`
  );

  return response.data;
};

// ----------------------------
// Filter
// ----------------------------

export const filterAnnouncements = async (
  team?: string,
  role?: string,
  page = 1,
  size = 20
): Promise<PaginatedAnnouncements> => {

  const response = await API.get(
    "/announcements/filter/list",
    {
      params: {
        team,
        role,
        page,
        size
      }
    }
  );

  return response.data;
};

// ----------------------------
// Acknowledge
// ----------------------------

export const acknowledgeAnnouncement = async (
  id: number,
  employee_id: string
) => {

  const payload: AnnouncementAck = {
    employee_id
  };

  const response = await API.post(
    `/announcements/${id}/acknowledge`,
    payload
  );

  return response.data;
};

// ----------------------------
// Acknowledgements
// ----------------------------

export const getAcknowledgements = async (
  id: number
) => {

  const response = await API.get(
    `/announcements/${id}/acknowledgements`
  );

  return response.data;
};

// ----------------------------
// Pending
// ----------------------------

export const getPendingAnnouncements = async (
  employeeId: string
) => {

  const response = await API.get(
    `/announcements/employee/${employeeId}/pending`
  );

  return response.data;
};

// ----------------------------
// Dashboard
// ----------------------------

export const getDashboardSummary = async (): Promise<DashboardSummary> => {

  const response = await API.get(
    "/announcements/dashboard/summary"
  );

  return response.data;
};

// ----------------------------
// Archive Expired
// ----------------------------

export const archiveExpired = async () => {

  const response = await API.post(
    "/announcements/archive-expired"
  );

  return response.data;
};