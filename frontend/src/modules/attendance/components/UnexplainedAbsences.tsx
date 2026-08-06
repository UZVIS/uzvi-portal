import React from "react";

const UnexplainedAbsences: React.FC = () => {
  return (
    <div className="unexplained-absences">

      <div className="table-header">

        <div>
          <h2>Unexplained Absences</h2>
          <p>Employees with unexplained absences</p>
        </div>

        <button className="export-btn">
          Export Attendance
        </button>

      </div>

      <div className="table-wrapper">

        <table>

          <thead>

            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
            </tr>

          </thead>

          <tbody>

            <tr>

              <td>EMP001</td>

              <td>Arjun Kumar</td>

              <td>Technology</td>

              <td>04 Aug 2026</td>

              <td>05 Aug 2026</td>

              <td>

                <span className="days-badge">
                  2
                </span>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default UnexplainedAbsences;