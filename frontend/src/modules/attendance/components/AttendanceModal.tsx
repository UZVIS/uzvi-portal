import React, { useEffect, useState } from "react";
import "./AttendanceModal.css";

import type {
  Attendance,
  AttendanceFormData,
  AttendanceStatus,
} from "../types";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AttendanceFormData) => void;
  record?: Attendance | null;
  loading?: boolean;
  employeeId?: string;
  employeeName?: string;
  attendanceDate?: string;
}

const employeeList = [
  { id: "EMP001", name: "Arjun Kumar" },
  { id: "EMP002", name: "Rahul Sharma" },
  { id: "EMP003", name: "Sneha Reddy" },
  { id: "EMP004", name: "Priya Nair" },
  { id: "EMP005", name: "Kiran Verma" },
];

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  record,
  loading = false,
  employeeId = "EMP001",
  attendanceDate = new Date().toISOString().split("T")[0],
}) => {
  const [selectedEmployee, setSelectedEmployee] =
    useState(employeeId);

  const [employeeName, setEmployeeName] =
    useState("Arjun Kumar");

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

  useEffect(() => {
    if (record) {
      setSelectedEmployee(record.employee_id);

      const emp = employeeList.find(
        (e) => e.id === record.employee_id
      );

      setEmployeeName(emp?.name ?? "");

      setDate(record.attendance_date);

      setStatus(record.status);

      setCheckIn(record.check_in ?? "");

      setCheckOut(record.check_out ?? "");

      setSource(record.source ?? "manual");
    } else {
      setSelectedEmployee(employeeId);

      const emp = employeeList.find(
        (e) => e.id === employeeId
      );

      setEmployeeName(emp?.name ?? "");

      setDate(attendanceDate);

      setStatus("in-office");

      setCheckIn("");

      setCheckOut("");

      setSource("manual");
    }
  }, [record, employeeId, attendanceDate]);

  const handleEmployeeChange = (
    value: string
  ) => {
    setSelectedEmployee(value);

    const emp = employeeList.find(
      (e) => e.id === value
    );

    setEmployeeName(emp?.name ?? "");
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

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

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            {record
              ? "Edit Attendance"
              : "Add Attendance"}
          </h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Employee */}

            <div className="form-row">

              <div className="form-group">

                <label>
                  Employee ID
                  <span className="required">*</span>
                </label>

                <select
                  value={selectedEmployee}
                  onChange={(e) =>
                    handleEmployeeChange(
                      e.target.value
                    )
                  }
                >
                  {employeeList.map((emp) => (
                    <option
                      key={emp.id}
                      value={emp.id}
                    >
                      {emp.id}
                    </option>
                  ))}
                </select>

              </div>

              <div className="form-group">

                <label>
                  Employee Name
                  <span className="required">*</span>
                </label>

                <input
                  type="text"
                  value={employeeName}
                  readOnly
                />

              </div>

            </div>

                        {/* Date & Status */}

            <div className="form-row">

              <div className="form-group">

                <label>
                  Date
                  <span className="required">*</span>
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Status
                  <span className="required">*</span>
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as AttendanceStatus
                    )
                  }
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

            {/* Check In & Check Out */}

            <div className="form-row">

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

            {/* Source */}

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

                    {/* Footer */}

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
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

};

export default AttendanceModal;