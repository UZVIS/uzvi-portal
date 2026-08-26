// src/modules/attendance/hooks/useAttendance.ts

import { useCallback, useEffect, useState } from "react";

import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendance,
  getAttendanceSummary,
  getTeamAttendance,
  getUnexplainedAbsences,
} from "../api";

import type {
  Attendance,
  AttendanceFormData,
  AttendanceSummary,
  AttendanceFilter,
  TeamAttendance,
  UnexplainedAbsence,
} from "../types";

// autoFetch = true for Admin/Manager.
// Employee passes false so the hook never makes an unfiltered GET /attendance/
// request before the logged-in employee ID is resolved.
export const useAttendance = (autoFetch = true) => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async (filter?: AttendanceFilter) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAttendance(filter);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setError("Failed to fetch attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyAttendance = useCallback(async (employeeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getEmployeeAttendance(employeeId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch employee attendance:", err);
      setError("Failed to fetch employee attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(
    async (employeeId: string, year: number, month: number) => {
      try {
        setLoading(true);
        setError(null);

        const data = await getAttendanceSummary(employeeId, year, month);
        setSummary(data);
      } catch (err) {
        console.error("Failed to fetch monthly summary:", err);
        setError("Failed to fetch monthly summary.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAttendance = useCallback(async (data: AttendanceFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createAttendance(data);
      setRecords((prev) => [...prev, response]);
      return response;
    } catch (err) {
      console.error("Failed to create attendance:", err);
      setError("Failed to create attendance.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const editAttendance = useCallback(
    async (id: number, data: AttendanceFormData) => {
      try {
        setLoading(true);
        setError(null);

        const updated = await updateAttendance(id, data);
        setRecords((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } catch (err) {
        console.error("Failed to update attendance:", err);
        setError("Failed to update attendance.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeAttendance = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      await deleteAttendance(id);
      setRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete attendance:", err);
      setError("Failed to delete attendance.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // IMPORTANT:
  // Do not call fetchAttendance() for Employee. That would load all employees.
  useEffect(() => {
    if (!autoFetch) return;
    void fetchAttendance();
  }, [autoFetch, fetchAttendance]);

  return {
    records,
    summary,
    loading,
    error,
    fetchAttendance,
    fetchMyAttendance,
    fetchSummary,
    markAttendance,
    editAttendance,
    removeAttendance,
  };
};

export const useTeamAttendance = () => {
  const [teamRecords, setTeamRecords] = useState<TeamAttendance[]>([]);
  const [unexplainedAbsences, setUnexplainedAbsences] = useState<
    UnexplainedAbsence[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamAttendance = useCallback(async (teamId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getTeamAttendance(teamId);
      setTeamRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch team attendance:", err);
      setTeamRecords([]);
      setError("Failed to fetch team attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnexplainedAbsences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getUnexplainedAbsences();
      setUnexplainedAbsences(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch unexplained absences:", err);
      setUnexplainedAbsences([]);
      setError("Failed to fetch unexplained absences.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teamRecords,
    unexplainedAbsences,
    loading,
    error,
    fetchTeamAttendance,
    fetchUnexplainedAbsences,
  };
};