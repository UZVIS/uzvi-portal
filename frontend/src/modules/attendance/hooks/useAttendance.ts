// src/modules/attendance/hooks/useAttendance.ts

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

// =====================================
// Main Attendance Hook
// =====================================

export const useAttendance = () => {
  const [records, setRecords] =
    useState<Attendance[]>([]);

  const [summary, setSummary] =
    useState<AttendanceSummary | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // =====================================
  // Get All Attendance
  // =====================================

  const fetchAttendance = useCallback(
    async (filter?: AttendanceFilter) => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getAttendance(filter);

        setRecords(
          Array.isArray(data) ? data : []
        );

      } catch (error) {
        console.error(
          "Failed to fetch attendance:",
          error
        );

        setError(
          "Failed to fetch attendance."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  // =====================================
  // Employee Attendance
  // =====================================

  const fetchMyAttendance =
    useCallback(
      async (employeeId: string) => {
        try {
          setLoading(true);
          setError(null);

          const data =
            await getEmployeeAttendance(
              employeeId
            );

          setRecords(
            Array.isArray(data) ? data : []
          );

        } catch (error) {
          console.error(
            "Failed to fetch employee attendance:",
            error
          );

          setError(
            "Failed to fetch employee attendance."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Monthly Summary
  // =====================================

  const fetchSummary =
    useCallback(
      async (
        employeeId: string,
        year: number,
        month: number
      ) => {
        try {
          setLoading(true);
          setError(null);

          const data =
            await getAttendanceSummary(
              employeeId,
              year,
              month
            );

          setSummary(data);

        } catch (error) {
          console.error(
            "Failed to fetch monthly summary:",
            error
          );

          setError(
            "Failed to fetch monthly summary."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Create Attendance
  // =====================================

  const markAttendance =
    useCallback(
      async (
        data: AttendanceFormData
      ) => {
        try {
          setLoading(true);
          setError(null);

          const response =
            await createAttendance(data);

          setRecords((prev) => [
            ...prev,
            response,
          ]);

          return response;

        } catch (error) {
          console.error(
            "Failed to create attendance:",
            error
          );

          setError(
            "Failed to create attendance."
          );

          throw new Error(
            "Create attendance failed."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Update Attendance
  // =====================================

  const editAttendance =
    useCallback(
      async (
        id: number,
        data: AttendanceFormData
      ) => {
        try {
          setLoading(true);
          setError(null);

          const updated =
            await updateAttendance(
              id,
              data
            );

          setRecords((prev) =>
            prev.map((item) =>
              item.id === id
                ? updated
                : item
            )
          );

          return updated;

        } catch (error) {
          console.error(
            "Failed to update attendance:",
            error
          );

          setError(
            "Failed to update attendance."
          );

          throw new Error(
            "Update attendance failed."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Delete Attendance
  // =====================================

  const removeAttendance =
    useCallback(
      async (id: number) => {
        try {
          setLoading(true);
          setError(null);

          await deleteAttendance(id);

          setRecords((prev) =>
            prev.filter(
              (item) =>
                item.id !== id
            )
          );

        } catch (error) {
          console.error(
            "Failed to delete attendance:",
            error
          );

          setError(
            "Failed to delete attendance."
          );

          throw new Error(
            "Delete attendance failed."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Initial Attendance Load
  // =====================================

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);


  // =====================================
  // Return
  // =====================================

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


// =====================================
// Team Attendance Hook
// =====================================

export const useTeamAttendance = () => {
  const [teamRecords, setTeamRecords] =
    useState<TeamAttendance[]>([]);

  const [
    unexplainedAbsences,
    setUnexplainedAbsences,
  ] =
    useState<UnexplainedAbsence[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // =====================================
  // Team Attendance
  // =====================================

  const fetchTeamAttendance =
    useCallback(
      async (teamId: string) => {
        try {
          setLoading(true);
          setError(null);

          console.log(
            "Fetching team attendance for:",
            teamId
          );

          const data =
            await getTeamAttendance(teamId);

          console.log(
            "Team attendance response:",
            data
          );

          setTeamRecords(
            Array.isArray(data) ? data : []
          );

        } catch (error) {
          console.error(
            "Failed to fetch team attendance:",
            error
          );

          setTeamRecords([]);

          setError(
            "Failed to fetch team attendance."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Unexplained Absences
  // =====================================

  const fetchUnexplainedAbsences =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError(null);

          const data =
            await getUnexplainedAbsences();

          setUnexplainedAbsences(
            Array.isArray(data) ? data : []
          );

        } catch (error) {
          console.error(
            "Failed to fetch unexplained absences:",
            error
          );

          setError(
            "Failed to fetch unexplained absences."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================
  // Return
  // =====================================

  return {
    teamRecords,
    unexplainedAbsences,
    loading,
    error,

    fetchTeamAttendance,
    fetchUnexplainedAbsences,
  };
};