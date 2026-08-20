import React, { useEffect, useState } from "react";
import { useTeamAttendance } from "../hooks/useAttendance";

interface FollowUpData {
  employeeId: string;
  employeeName: string;
  date: string;
  attendanceStatus: string;
  leaveStatus: string;
}

const UnexplainedAbsences: React.FC = () => {
  const {
    unexplainedAbsences,
    loading,
    error,
    fetchUnexplainedAbsences,
  } = useTeamAttendance();

  // ==========================================
  // Selected absence for Follow-up modal
  // ==========================================

  const [selectedAbsence, setSelectedAbsence] =
    useState<FollowUpData | null>(null);

  // ==========================================
  // Fetch unexplained absences
  // ==========================================

  useEffect(() => {
    fetchUnexplainedAbsences();
  }, []);

  // ==========================================
  // Get value safely from API response
  // ==========================================

  const getValue = (
    item: unknown,
    keys: string[]
  ): string => {
    if (!item || typeof item !== "object") {
      return "-";
    }

    const record =
      item as Record<string, unknown>;

    for (const key of keys) {
      const value = record[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return String(value);
      }
    }

    return "-";
  };

  // ==========================================
  // Get employee information
  // ==========================================

  const getEmployeeValue = (
    item: unknown,
    keys: string[]
  ): string => {
    if (!item || typeof item !== "object") {
      return "-";
    }

    const record =
      item as Record<string, unknown>;

    // Check direct fields
    for (const key of keys) {
      const value = record[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return String(value);
      }
    }

    // Check nested employee object
    const employee =
      record.employee;

    if (
      employee &&
      typeof employee === "object"
    ) {
      const employeeRecord =
        employee as Record<string, unknown>;

      for (const key of keys) {
        const value =
          employeeRecord[key];

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          return String(value);
        }
      }
    }

    return "-";
  };

  // ==========================================
  // Format date
  // ==========================================

  const formatDate = (
    value: string
  ): string => {
    if (!value || value === "-") {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // Open Follow-up modal
  // ==========================================

  const handleFollowUp = (
    item: unknown
  ) => {
    const employeeId =
      getEmployeeValue(
        item,
        [
          "employee_id",
          "employeeId",
          "emp_id",
          "empId",
          "id",
        ]
      );

    const employeeName =
      getEmployeeValue(
        item,
        [
          "employee_name",
          "employeeName",
          "name",
          "full_name",
          "fullName",
        ]
      );

    const date =
      getValue(
        item,
        [
          "date",
          "attendance_date",
          "attendanceDate",
          "absence_date",
          "absenceDate",
          "start_date",
          "startDate",
        ]
      );

    const rawAttendanceStatus =
      getValue(
        item,
        [
          "attendance_status",
          "attendanceStatus",
          "status",
        ]
      );

    const attendanceStatus =
      rawAttendanceStatus === "-" ||
      rawAttendanceStatus.toLowerCase() ===
        "absent"
        ? "Not Marked"
        : rawAttendanceStatus;

    const rawLeaveStatus =
      getValue(
        item,
        [
          "leave_status",
          "leaveStatus",
        ]
      );

    const leaveStatus =
      rawLeaveStatus === "-"
        ? "No Approved Leave"
        : rawLeaveStatus;

    // Store only strings
    setSelectedAbsence({
      employeeId,
      employeeName,
      date,
      attendanceStatus,
      leaveStatus,
    });
  };

  // ==========================================
  // Close Follow-up modal
  // ==========================================

  const closeFollowUp = () => {
    setSelectedAbsence(null);
  };

  return (
    <div className="unexplained-absences">

      {/* ======================================
          Header
      ====================================== */}

      <div className="table-header">

        <div>
          <h2>
            Unexplained Absences
          </h2>

          <p>
            Employees with no attendance
            record and no approved leave
          </p>
        </div>

        <button
          type="button"
          className="export-btn"
        >
          Export Attendance
        </button>

      </div>

      {/* ======================================
          Error Message
      ====================================== */}

      {error && (
        <div
          style={{
            padding: "14px 18px",
            marginBottom: "16px",
            borderRadius: "8px",
            backgroundColor: "#fff1f0",
            color: "#d32f2f",
            border:
              "1px solid #ffcdd2",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================
          Loading
      ====================================== */}

      {loading && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
          }}
        >
          Loading unexplained absences...
        </div>
      )}

      {/* ======================================
          Attendance Table
      ====================================== */}

      {!loading && (
        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  Employee ID
                </th>

                <th>
                  Employee Name
                </th>

                <th>
                  Date
                </th>

                <th>
                  Attendance Status
                </th>

                <th>
                  Leave Status
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {unexplainedAbsences.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    No unexplained absences found.
                  </td>

                </tr>

              ) : (

                unexplainedAbsences.map(
                  (item, index) => {

                    // ==============================
                    // Employee ID
                    // ==============================

                    const employeeId =
                      getEmployeeValue(
                        item,
                        [
                          "employee_id",
                          "employeeId",
                          "emp_id",
                          "empId",
                          "id",
                        ]
                      );

                    // ==============================
                    // Employee Name
                    // ==============================

                    const employeeName =
                      getEmployeeValue(
                        item,
                        [
                          "employee_name",
                          "employeeName",
                          "name",
                          "full_name",
                          "fullName",
                        ]
                      );

                    // ==============================
                    // Date
                    // ==============================

                    const date =
                      getValue(
                        item,
                        [
                          "date",
                          "attendance_date",
                          "attendanceDate",
                          "absence_date",
                          "absenceDate",
                          "start_date",
                          "startDate",
                        ]
                      );

                    // ==============================
                    // Attendance Status
                    // ==============================

                    const rawAttendanceStatus =
                      getValue(
                        item,
                        [
                          "attendance_status",
                          "attendanceStatus",
                          "status",
                        ]
                      );

                    const attendanceStatus =
                      rawAttendanceStatus === "-" ||
                      rawAttendanceStatus.toLowerCase() ===
                        "absent"
                        ? "Not Marked"
                        : rawAttendanceStatus;

                    // ==============================
                    // Leave Status
                    // ==============================

                    const rawLeaveStatus =
                      getValue(
                        item,
                        [
                          "leave_status",
                          "leaveStatus",
                        ]
                      );

                    const leaveStatus =
                      rawLeaveStatus === "-"
                        ? "No Approved Leave"
                        : rawLeaveStatus;

                    return (
                      <tr
                        key={`${employeeId}-${date}-${index}`}
                      >

                        {/* Employee ID */}

                        <td>
                          {employeeId}
                        </td>

                        {/* Employee Name */}

                        <td>
                          {employeeName}
                        </td>

                        {/* Date */}

                        <td>
                          {formatDate(date)}
                        </td>

                        {/* Attendance Status */}

                        <td>

                          <span
                            className="days-badge"
                            style={{
                              background:
                                "#fff3e0",
                              color:
                                "#ef6c00",
                              padding:
                                "6px 12px",
                              borderRadius:
                                "20px",
                              fontWeight:
                                600,
                            }}
                          >
                            {attendanceStatus}
                          </span>

                        </td>

                        {/* Leave Status */}

                        <td>
                          {leaveStatus}
                        </td>

                        {/* Follow-up */}

                        <td>

                          <button
                            type="button"
                            className="export-btn"
                            onClick={() =>
                              handleFollowUp(item)
                            }
                            style={{
                              padding:
                                "8px 14px",
                              fontSize:
                                "14px",
                              whiteSpace:
                                "nowrap",
                              cursor:
                                "pointer",
                            }}
                          >
                            Follow-up
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>
      )}

      {/* ======================================
          Follow-up Modal
      ====================================== */}

      {selectedAbsence && (
        <div
          onClick={closeFollowUp}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "520px",
              background:
                "#ffffff",
              borderRadius:
                "16px",
              padding:
                "28px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >

            {/* Modal Header */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "24px",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "24px",
                    color:
                      "#172033",
                  }}
                >
                  Follow-up
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "#6b7a90",
                  }}
                >
                  Unexplained attendance
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeFollowUp
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  fontSize:
                    "26px",
                  cursor:
                    "pointer",
                  color:
                    "#666",
                }}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* ==================================
                Employee ID
            ================================== */}

            <div
              style={{
                padding:
                  "14px 16px",
                background:
                  "#f7f8fb",
                borderRadius:
                  "10px",
                marginBottom:
                  "14px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#718096",
                  marginBottom:
                    "5px",
                }}
              >
                Employee ID
              </div>

              <strong>
                {
                  selectedAbsence.employeeId
                }
              </strong>

            </div>

            {/* ==================================
                Employee Name
            ================================== */}

            <div
              style={{
                padding:
                  "14px 16px",
                background:
                  "#f7f8fb",
                borderRadius:
                  "10px",
                marginBottom:
                  "14px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#718096",
                  marginBottom:
                    "5px",
                }}
              >
                Employee Name
              </div>

              <strong>
                {
                  selectedAbsence.employeeName
                }
              </strong>

            </div>

            {/* ==================================
                Date
            ================================== */}

            <div
              style={{
                padding:
                  "14px 16px",
                background:
                  "#f7f8fb",
                borderRadius:
                  "10px",
                marginBottom:
                  "14px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#718096",
                  marginBottom:
                    "5px",
                }}
              >
                Date
              </div>

              <strong>
                {formatDate(
                  selectedAbsence.date
                )}
              </strong>

            </div>

            {/* ==================================
                Attendance Status
            ================================== */}

            <div
              style={{
                padding:
                  "14px 16px",
                background:
                  "#fff8ed",
                borderRadius:
                  "10px",
                marginBottom:
                  "14px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#718096",
                  marginBottom:
                    "5px",
                }}
              >
                Attendance Status
              </div>

              <strong
                style={{
                  color:
                    "#ef6c00",
                }}
              >
                {
                  selectedAbsence.attendanceStatus
                }
              </strong>

            </div>

            {/* ==================================
                Leave Status
            ================================== */}

            <div
              style={{
                padding:
                  "14px 16px",
                background:
                  "#f7f8fb",
                borderRadius:
                  "10px",
                marginBottom:
                  "24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#718096",
                  marginBottom:
                    "5px",
                }}
              >
                Leave Status
              </div>

              <strong>
                {
                  selectedAbsence.leaveStatus
                }
              </strong>

            </div>

            {/* ==================================
                Modal Footer
            ================================== */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
              }}
            >

              <button
                type="button"
                onClick={
                  closeFollowUp
                }
                style={{
                  padding:
                    "10px 20px",
                  border:
                    "1px solid #d9dfe8",
                  borderRadius:
                    "8px",
                  background:
                    "#ffffff",
                  color:
                    "#334155",
                  cursor:
                    "pointer",
                  fontWeight:
                    600,
                }}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default UnexplainedAbsences;