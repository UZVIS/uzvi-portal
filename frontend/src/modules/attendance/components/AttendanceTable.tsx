// src/modules/attendance/components/AttendanceTable.tsx

import React from "react";

import type {
  Attendance,
} from "../types";

interface AttendanceTableProps {

  records: Attendance[];

  loading?: boolean;

  onEdit?: (
    record: Attendance
  ) => void;

  onDelete?: (
    id: number
  ) => void;

}

const AttendanceTable: React.FC<
  AttendanceTableProps
> = ({

  records,

  loading = false,

  onEdit,

  onDelete,

}) => {

  const getEmployeeName = (
    employeeId: string
  ) => {

    switch (employeeId) {

      case "EMP001":
        return "Arjun Kumar";

      default:
        return "Arjun Kumar";

    }

  };

  const getStatusLabel = (
    status: string
  ) => {

    switch (status) {

      case "in-office":
        return "In Office";

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

  if (loading) {

    return (

      <div className="attendance-table">

        <div className="loading-state">

          Loading attendance records...

        </div>

      </div>

    );

  }

  return (

    <div className="attendance-table">

      <div className="table-header">

        <div>

          <h2>

            Attendance Records

          </h2>

          <p>

            Monthly attendance history

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

              <th>Employee ID</th>

              <th>Employee Name</th>

              <th>Date</th>

              <th>Status</th>

              <th>Check In</th>

              <th>Check Out</th>

              <th>Source</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {records.length === 0 ? (

              <tr>

                <td
                  colSpan={8}
                  className="empty-state"
                >

                  No attendance records found.

                </td>

              </tr>

            ) : (

                            records.map((record) => (

                <tr key={record.id}>

                  {/* Employee ID */}

                  <td>

                    {record.employee_id}

                  </td>

                  {/* Employee Name */}

                  <td className="employee-name">

                    {getEmployeeName(
                      record.employee_id
                    )}

                  </td>

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
                      className={
                        getStatusClass(
                          record.status
                        )
                      }
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

                  {/* Source */}

                  <td>

                    <span className="source-badge">

                      {record.source ?? "Manual"}

                    </span>

                  </td>

                  {/* Actions */}

                  <td>

                    <div className="action-buttons">

                      <button
                        className="edit-btn"
                        title="Edit Attendance"
                        onClick={() =>
                          onEdit?.(record)
                        }
                      >

                        ✏️

                      </button>

                      <button
                        className="delete-btn"
                        title="Delete Attendance"
                        onClick={() =>
                          onDelete?.(
                            record.id
                          )
                        }
                      >

                        🗑️

                      </button>

                    </div>

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

export default AttendanceTable;