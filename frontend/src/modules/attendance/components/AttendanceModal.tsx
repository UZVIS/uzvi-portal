import React, { useEffect, useState } from "react";
import "./AttendanceModal.css";

import type {
  Attendance,
  AttendanceFormData,
  AttendanceStatus,
} from "../types";

import type { Employee } from "../../directory/api";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AttendanceFormData) => void;
  record?: Attendance | null;
  loading?: boolean;
  employeeId?: string;
  employeeName?: string;
  attendanceDate?: string;
  employees: Employee[];
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  record,
  loading = false,
  employeeId = "EMP001",
  employeeName: defaultEmployeeName = "",
  attendanceDate = new Date().toISOString().split("T")[0],
  employees,
}) => {
  const [selectedEmployee, setSelectedEmployee] =
    useState(employeeId);

  const [status, setStatus] =
    useState<AttendanceStatus>("in-office");

  const [date, setDate] =
    useState(attendanceDate);

  const [checkIn, setCheckIn] =
    useState("");

  const [checkOut, setCheckOut] =
    useState("");

  const [source, setSource] =
    useState("manual");

  /*
   * ======================================
   * Selected Employee Details
   * ======================================
   */

  const selectedEmployeeData = employees.find(
    (employee) =>
      String(employee.employee_id) ===
      String(selectedEmployee)
  );

  const employeeName =
    selectedEmployeeData?.name ??
    defaultEmployeeName ??
    "";

  /*
   * ======================================
   * Load / Reset Employee Details
   * ======================================
   */

  useEffect(() => {
    if (record) {
      // Editing existing attendance
      setSelectedEmployee(record.employee_id);

      setDate(record.attendance_date);

      setStatus(record.status);

      setCheckIn(record.check_in ?? "");

      setCheckOut(record.check_out ?? "");

      setSource(record.source ?? "manual");

      return;
    }

    // Adding new attendance
    setDate(attendanceDate);

    setStatus("in-office");

    setCheckIn("");

    setCheckOut("");

    setSource("manual");

    // If default employee exists in Directory,
    // use it. Otherwise use the first employee
    // received from Directory.
    const defaultEmployeeExists = employees.some(
      (employee) =>
        String(employee.employee_id) ===
        String(employeeId)
    );

    if (defaultEmployeeExists) {
      setSelectedEmployee(employeeId);
    } else if (employees.length > 0) {
      setSelectedEmployee(
        employees[0].employee_id
      );
    } else {
      setSelectedEmployee("");
    }
  }, [
    record,
    employeeId,
    attendanceDate,
    employees,
  ]);

  /*
   * ======================================
   * Employee Change
   * ======================================
   */

  const handleEmployeeChange = (
    value: string
  ) => {
    setSelectedEmployee(value);
  };

  /*
   * ======================================
   * Submit
   * ======================================
   */

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedEmployee) {
      return;
    }

    const formData: AttendanceFormData = {
      employee_id: selectedEmployee,
      attendance_date: date,
      status,
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      source,
    };

    onSave(formData);
  };

  /*
   * ======================================
   * Modal Closed
   * ======================================
   */

  if (!isOpen) {
    return null;
  }

  /*
   * ======================================
   * UI
   * ======================================
   */

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* ================================
            Header
        ================================= */}

        <div className="modal-header">

          <h2>
            {record
              ? "Edit Attendance"
              : "Add Attendance"}
          </h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        {/* ================================
            Form
        ================================= */}

        <form onSubmit={handleSubmit}>

          <div className="modal-body">

            {/* ==============================
                Employee
            =============================== */}

            <div className="form-row">

              {/* Employee ID */}

              <div className="form-group">

                <label>
                  Employee ID
                  <span className="required">
                    *
                  </span>
                </label>

                <select
                  value={selectedEmployee}
                  onChange={(e) =>
                    handleEmployeeChange(
                      e.target.value
                    )
                  }
                  required
                >

                  {employees.length === 0 ? (

                    <option value="">
                      No employees available
                    </option>

                  ) : (

                    employees.map((emp) => (

                      <option
                        key={emp.employee_id}
                        value={emp.employee_id}
                      >
                        {emp.employee_id}
                      </option>

                    ))

                  )}

                </select>

              </div>

              {/* Employee Name */}

              <div className="form-group">

                <label>
                  Employee Name
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={employeeName}
                  readOnly
                  placeholder={
                    employees.length === 0
                      ? "No employee available"
                      : "Employee name"
                  }
                />

              </div>

            </div>

            {/* ==============================
                Date & Status
            =============================== */}

            <div className="form-row">

              {/* Date */}

              <div className="form-group">

                <label>
                  Date
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

              {/* Status */}

              <div className="form-group">

                <label>
                  Status
                  <span className="required">
                    *
                  </span>
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as AttendanceStatus
                    )
                  }
                  required
                >

                  <option value="in-office">
                    In Office
                  </option>

                  <option value="wfh">
                    Work From Home
                  </option>

                  <option value="on-leave">
                    On Leave
                  </option>

                  <option value="absent">
                    Absent
                  </option>

                </select>

              </div>

            </div>

            {/* ==============================
                Check In & Check Out
            =============================== */}

            <div className="form-row">

              {/* Check In */}

              <div className="form-group">

                <label>
                  Check In
                </label>

                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) =>
                    setCheckIn(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* Check Out */}

              <div className="form-group">

                <label>
                  Check Out
                </label>

                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) =>
                    setCheckOut(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* ==============================
                Source
            =============================== */}

            <div className="form-group">

              <label>
                Source
              </label>

              <select
                value={source}
                onChange={(e) =>
                  setSource(
                    e.target.value
                  )
                }
              >

                <option value="manual">
                  Manual
                </option>

                <option value="biometric">
                  Biometric
                </option>

                <option value="system">
                  System
                </option>

              </select>

            </div>

          </div>

          {/* ================================
              Footer
          ================================= */}

          <div className="modal-footer">

            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={
                loading ||
                !selectedEmployee
              }
            >
              {loading
                ? "Saving..."
                : "Save"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AttendanceModal;