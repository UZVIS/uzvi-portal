// src/modules/attendance/components/AttendanceForm.tsx

import React, { useState } from "react";

import type { AttendanceFormData } from "../types";

interface AttendanceFormProps {
  initialData?: AttendanceFormData;
  onSave: (data: AttendanceFormData) => void;
  onCancel: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {

  const [formData, setFormData] =
    useState<AttendanceFormData>(
      initialData ?? {
        employee_id: "",
        attendance_date: "",
        status: "in-office",
        check_in: "",
        check_out: "",
        source: "manual",
      }
    );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    onSave(formData);

  };

  return (

    <form
      className="attendance-form"
      onSubmit={handleSubmit}
    >

      <h2>
        Attendance Form
      </h2>

      {/* Employee ID */}

      <div className="form-group">

        <label>
          Employee ID
        </label>

        <input
          type="text"
          name="employee_id"
          value={formData.employee_id}
          onChange={handleChange}
          required
        />

      </div>

      {/* Attendance Date */}

      <div className="form-group">

        <label>
          Attendance Date
        </label>

        <input
          type="date"
          name="attendance_date"
          value={formData.attendance_date}
          onChange={handleChange}
          required
        />

      </div>

      {/* Status */}

      <div className="form-group">

        <label>
          Status
        </label>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
        >

          <option value="in-office">
            In Office
          </option>

          <option value="wfh">
            WFH
          </option>

          <option value="on-leave">
            On Leave
          </option>

          <option value="absent">
            Absent
          </option>

        </select>

      </div>

      {/* Check In */}

      <div className="form-group">

        <label>
          Check In
        </label>

        <input
          type="time"
          name="check_in"
          value={formData.check_in ?? ""}
          onChange={handleChange}
        />

      </div>

      {/* Check Out */}

      <div className="form-group">

        <label>
          Check Out
        </label>

        <input
          type="time"
          name="check_out"
          value={formData.check_out ?? ""}
          onChange={handleChange}
        />

      </div>

      {/* Source */}

      <div className="form-group">

        <label>
          Source
        </label>

        <input
          type="text"
          name="source"
          value={formData.source}
          readOnly
        />

      </div>

      <div className="form-actions">

        <button
          type="submit"
          className="save-btn"
        >
          Save
        </button>

        <button
          type="button"
          className="cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </button>

      </div>

    </form>

  );

};

export default AttendanceForm;