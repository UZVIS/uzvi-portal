import React, { useEffect } from "react";

import { useTeamAttendance } from "../hooks/useAttendance";

interface TeamAttendanceProps {
  teamId: string;
  onEmployeeClick?: (employeeId: string) => void;
}

const TeamAttendance: React.FC<TeamAttendanceProps> = ({
  teamId,
  onEmployeeClick,
}) => {
  const {
    teamRecords,
    loading,
    fetchTeamAttendance,
  } = useTeamAttendance();

  // ==========================================
  // Fetch Team Attendance
  // ==========================================

  useEffect(() => {
    if (teamId) {
      void fetchTeamAttendance(teamId);
    }
  }, [teamId, fetchTeamAttendance]);

  // ==========================================
  // Status Label
  // ==========================================

  const getStatusLabel = (status: string) => {
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

  // ==========================================
  // Status CSS Class
  // ==========================================

  const getStatusClass = (status: string) => {
    switch (status) {
      case "in-office":
        return "status office";

      case "wfh":
        return "status wfh";

      case "on-leave":
        return "status leave";

      case "absent":
        return "status absent";

      default:
        return "status";
    }
  };

  // ==========================================
  // Format Date
  // ==========================================

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const formattedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(formattedDate.getTime())) {
      return date;
    }

    return formattedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="loading-state">
        Loading team attendance...
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="team-attendance team-attendance-neat">

      {/* ======================================
          TEAM ATTENDANCE HEADING
          Same style as "Summary Cards"
      ====================================== */}

      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
            color: "#172033",
          }}
        >
          Team Attendance
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Attendance records for your team.
        </p>
      </div>

      {/* ======================================
          NO RECORDS
      ====================================== */}

      {teamRecords.length === 0 ? (
        <p>
          No team attendance records found.
        </p>
      ) : (
        <div className="table-wrapper team-attendance-table-wrapper">

          <table className="attendance-table team-attendance-table">

            {/* ================================
                Table Header
            ================================ */}

            <thead>
              <tr>

                <th>
                  Employee ID
                </th>

                <th>
                  Employee Name
                </th>

                <th>
                  Designation
                </th>

                <th>
                  Date
                </th>

                <th>
                  Status
                </th>

                <th>
                  Check In
                </th>

                <th>
                  Check Out
                </th>

              </tr>
            </thead>

            {/* ================================
                Table Body
            ================================ */}

            <tbody>

              {teamRecords.map(
                (record, index) => (

                  <tr
                    className={onEmployeeClick ? "team-attendance-row clickable" : "team-attendance-row"}
                    key={`${record.employee_id}-${record.attendance_date}-${index}`}
                    onClick={() =>
                      onEmployeeClick?.(
                        record.employee_id
                      )
                    }
                    style={{
                      cursor: onEmployeeClick
                        ? "pointer"
                        : "default",
                    }}
                  >

                    {/* Employee ID */}

                    <td>
                      {record.employee_id}
                    </td>

                    {/* Employee Name */}

                    <td>
                      {record.employee_name}
                    </td>

                    {/* Designation */}

                    <td>
                      {record.designation ?? "-"}
                    </td>

                    {/* Date */}

                    <td>
                      {formatDate(
                        record.attendance_date
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

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
};

export default TeamAttendance;