import React from "react";

import type { Attendance } from "../types";

interface EmployeeAttendanceTableProps {
  records: Attendance[];
  loading?: boolean;
}

const EmployeeAttendanceTable: React.FC<
  EmployeeAttendanceTableProps
> = ({
  records,
  loading = false,
}) => {

  const getStatusLabel = (
    status: string
  ) => {

    switch (status) {

      case "in-office":
        return "Present";

      case "wfh":
        return "WFH";

      case "on-leave":
        return "On Leave";

      case "absent":
        return "Absent";

      default:
        return status;

    }

  };

  const getStatusClass = (
    status: string
  ) => {

    switch (status) {

      case "in-office":
        return "status-badge office";

      case "wfh":
        return "status-badge wfh";

      case "on-leave":
        return "status-badge leave";

      case "absent":
        return "status-badge absent";

      default:
        return "status-badge";

    }

  };

  const getWorkingHours = (
    checkIn?: string | null,
    checkOut?: string | null
  ) => {

    if (!checkIn || !checkOut)
      return "-";

    const start = checkIn.split(":");
    const end = checkOut.split(":");

    const startMinutes =
      Number(start[0]) * 60 +
      Number(start[1]);

    const endMinutes =
      Number(end[0]) * 60 +
      Number(end[1]);

    const diff =
      endMinutes - startMinutes;

    const hours =
      Math.floor(diff / 60);

    const mins =
      diff % 60;

    return `${hours}h ${mins}m`;

  };

  if (loading) {

    return (

      <div className="attendance-table">

        <div className="loading-state">

          Loading attendance...

        </div>

      </div>

    );

  }

  return (

    <div className="attendance-table">

      <div className="table-header">

        <div>

          <h2>
            My Attendance
          </h2>

          <p>
            View your attendance history
          </p>

        </div>

        <div className="record-count">

          {records.length} Records

        </div>

      </div>

      <div className="table-wrapper">

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Status</th>

              <th>Check In</th>

              <th>Check Out</th>

              <th>Working Hours</th>

            </tr>

          </thead>

          <tbody>

            {records.length === 0 ? (

  <tr>

    <td
      colSpan={5}
      className="empty-state"
    >

      No attendance records found.

    </td>

  </tr>

) : (

  records.map((record) => (

    <tr key={record.id}>

      {/* Date */}

      <td>

        {new Date(
          record.attendance_date
        ).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )}

      </td>

      {/* Status */}

      <td>

        <span
          className={getStatusClass(
            record.status
          )}
        >

          {getStatusLabel(
            record.status
          )}

        </span>

      </td>

      {/* Check In */}

      <td>

        {record.check_in ?? "-"}

      </td>

      {/* Check Out */}

      <td>

        {record.check_out ?? "-"}

      </td>

      {/* Working Hours */}

      <td>

        {getWorkingHours(
          record.check_in,
          record.check_out
        )}

      </td>

    </tr>

  ))

)}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default EmployeeAttendanceTable;
          