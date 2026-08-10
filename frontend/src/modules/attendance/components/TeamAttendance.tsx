// src/modules/attendance/components/TeamAttendance.tsx

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

  useEffect(() => {

    if (teamId) {

      fetchTeamAttendance(teamId);

    }

  }, [teamId]);

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

  if (loading) {

    return (

      <div className="loading-state">

        Loading team attendance...

      </div>

    );

  }

  const displayRecords =
  teamRecords.length > 0
    ? teamRecords
    : [
        {
          employee_id: "EMP001",
          employee_name: "Arjun Kumar",
          designation: "Software Engineer",
          department: "Engineering",
          status: "in-office",
          check_in: "09:00",
          check_out: "18:00",
        },
        {
          employee_id: "EMP002",
          employee_name: "Rahul Sharma",
          designation: "QA Engineer",
          department: "Engineering",
          status: "wfh",
          check_in: "09:30",
          check_out: "18:15",
        },
        {
          employee_id: "EMP003",
          employee_name: "Sneha Reddy",
          designation: "UI Developer",
          department: "Engineering",
          status: "on-leave",
          check_in: null,
          check_out: null,
        },
      ];

  return (

    <div className="team-attendance">

      <h2>

        Team Attendance

      </h2>

      {displayRecords.length === 0 ? (

        <p>

          No team attendance records found.

        </p>

      ) : (

        <table className="attendance-table">

          <thead>

            <tr>

              <th>Employee ID</th>

              <th>Employee Name</th>

              <th>Designation</th>

              <th>Department</th>

              <th>Status</th>

              <th>Check In</th>

              <th>Check Out</th>

            </tr>

          </thead>

          <tbody>

            {displayRecords.map((record) => (

              <tr

                key={record.employee_id}

                onClick={() =>
                  onEmployeeClick?.(
                    record.employee_id
                  )
                }

              >

                <td>

                  {record.employee_id}

                </td>

                <td>

                  {record.employee_name}

                </td>

                <td>

                  {record.designation ?? "-"}

                </td>

                <td>

                  {record.department ?? "-"}

                </td>

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

                <td>

                  {record.check_in ?? "-"}

                </td>

                <td>

                  {record.check_out ?? "-"}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

};

export default TeamAttendance;