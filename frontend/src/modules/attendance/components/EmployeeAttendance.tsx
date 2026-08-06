// src/modules/attendance/components/EmployeeAttendance.tsx

import React, { useEffect, useState } from "react";

import { getEmployeeAttendance } from "../api";

import type { Attendance } from "../types";

import AttendanceTable from "./AttendanceTable";

interface EmployeeAttendanceProps {
  employeeId: string;
}

const EmployeeAttendance: React.FC<EmployeeAttendanceProps> = ({
  employeeId,
}) => {

  const [records, setRecords] =
    useState<Attendance[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const fetchAttendance = async () => {

    try {

      setLoading(true);
      setError(null);

      const data =
        await getEmployeeAttendance(
          employeeId
        );

      setRecords(data);

    } catch (err) {

      console.error(err);

      setError(
        "Failed to fetch employee attendance."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (employeeId) {

      fetchAttendance();

    }

  }, [employeeId]);

  return (

    <div className="employee-attendance">

      <div className="section-header">

        <h2>
          Employee Attendance
        </h2>

      </div>

      {error && (

        <div className="error-message">
          {error}
        </div>

      )}

      <AttendanceTable
        records={records}
        loading={loading}
      />

    </div>

  );

};

export default EmployeeAttendance;