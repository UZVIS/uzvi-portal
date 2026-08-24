// src/modules/attendance/components/AttendanceForm.tsx

import React, { useEffect, useState } from "react";

import type { AttendanceFormData } from "../types";

interface AttendanceFormProps {
  initialData?: AttendanceFormData;
  onSave: (data: AttendanceFormData) => void;
  onCancel: () => void;
}

// ==========================================
// Time Options
// ==========================================

const HOURS = Array.from(
  { length: 12 },
  (_, index) =>
    String(index + 1).padStart(2, "0")
);

const MINUTES = Array.from(
  { length: 60 },
  (_, index) =>
    String(index).padStart(2, "0")
);

const PERIODS = ["AM", "PM"] as const;

type Period = (typeof PERIODS)[number];

// ==========================================
// Convert backend time to 12-hour format
// Example: 19:00 -> 07:00 PM
// ==========================================

const parseTime = (
  time?: string | null
): {
  hour: string;
  minute: string;
  period: Period;
} => {
  if (!time) {
    return {
      hour: "09",
      minute: "00",
      period: "AM",
    };
  }

  const parts = time.split(":");

  const hour24 = Number(parts[0]);
  const minute = parts[1] ?? "00";

  if (
    Number.isNaN(hour24) ||
    hour24 < 0 ||
    hour24 > 23
  ) {
    return {
      hour: "09",
      minute: "00",
      period: "AM",
    };
  }

  const period: Period =
    hour24 >= 12 ? "PM" : "AM";

  let hour12 = hour24 % 12;

  if (hour12 === 0) {
    hour12 = 12;
  }

  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(
      Number(minute)
    ).padStart(2, "0"),
    period,
  };
};

// ==========================================
// Convert 12-hour time to backend format
// Example: 07:00 PM -> 19:00
// ==========================================

const convertTo24Hour = (
  hour: string,
  minute: string,
  period: Period
): string => {
  let hour24 = Number(hour);

  if (period === "AM") {
    if (hour24 === 12) {
      hour24 = 0;
    }
  } else {
    if (hour24 !== 12) {
      hour24 += 12;
    }
  }

  return `${String(hour24).padStart(
    2,
    "0"
  )}:${minute}`;
};

// ==========================================
// Component
// ==========================================

const AttendanceForm: React.FC<
  AttendanceFormProps
> = ({
  initialData,
  onSave,
  onCancel,
}) => {

  // ========================================
  // Form Data
  // ========================================

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

  // ========================================
  // Check In Time State
  // ========================================

  const initialCheckIn =
    parseTime(initialData?.check_in);

  const [checkInHour, setCheckInHour] =
    useState(initialCheckIn.hour);

  const [checkInMinute, setCheckInMinute] =
    useState(initialCheckIn.minute);

  const [checkInPeriod, setCheckInPeriod] =
    useState<Period>(
      initialCheckIn.period
    );

  // ========================================
  // Check Out Time State
  // ========================================

  const initialCheckOut =
    parseTime(initialData?.check_out);

  const [checkOutHour, setCheckOutHour] =
    useState(initialCheckOut.hour);

  const [checkOutMinute, setCheckOutMinute] =
    useState(initialCheckOut.minute);

  const [checkOutPeriod, setCheckOutPeriod] =
    useState<Period>(
      initialCheckOut.period
    );

  // ========================================
  // Update time when initialData changes
  // ========================================

  useEffect(() => {

    if (!initialData) {
      return;
    }

    setFormData(initialData);

    // Check In

    const checkIn =
      parseTime(initialData.check_in);

    setCheckInHour(checkIn.hour);

    setCheckInMinute(checkIn.minute);

    setCheckInPeriod(checkIn.period);

    // Check Out

    const checkOut =
      parseTime(initialData.check_out);

    setCheckOutHour(checkOut.hour);

    setCheckOutMinute(checkOut.minute);

    setCheckOutPeriod(checkOut.period);

  }, [initialData]);

  // ========================================
  // Normal Input Change
  // ========================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  // ========================================
  // Submit
  // ========================================

  const handleSubmit = (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    // Convert Check In to 24-hour format

    const checkIn =
      formData.check_in
        ? convertTo24Hour(
            checkInHour,
            checkInMinute,
            checkInPeriod
          )
        : "";

    // Convert Check Out to 24-hour format

    const checkOut =
      formData.check_out
        ? convertTo24Hour(
            checkOutHour,
            checkOutMinute,
            checkOutPeriod
          )
        : "";

    const dataToSave: AttendanceFormData = {
      ...formData,

      check_in: checkIn,

      check_out: checkOut,
    };

    onSave(dataToSave);
  };

  // ========================================
  // UI
  // ========================================

  return (

    <form
      className="attendance-form"
      onSubmit={handleSubmit}
    >

      <h2>
        Attendance Form
      </h2>

      {/* ==================================
          Employee ID
          ================================== */}

      <div className="form-group">

        <label>
          Employee ID
        </label>

        <input
          type="text"
          name="employee_id"
          value={
            formData.employee_id
          }
          onChange={handleChange}
          required
        />

      </div>

      {/* ==================================
          Attendance Date
          ================================== */}

      <div className="form-group">

        <label>
          Attendance Date
        </label>

        <input
          type="date"
          name="attendance_date"
          value={
            formData.attendance_date
          }
          onChange={handleChange}
          required
        />

      </div>

      {/* ==================================
          Status
          ================================== */}

      <div className="form-group">

        <label>
          Status
        </label>

        <select
          name="status"
          value={
            formData.status
          }
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

      {/* ==================================
          Check In
          ================================== */}

      <div className="form-group">

        <label>
          Check In
        </label>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >

          {/* Hour */}

          <select
            value={checkInHour}
            onChange={(e) => {

              setCheckInHour(
                e.target.value
              );

              setFormData((prev) => ({
                ...prev,
                check_in: "selected",
              }));

            }}
          >

            {HOURS.map((hour) => (

              <option
                key={hour}
                value={hour}
              >
                {hour}
              </option>

            ))}

          </select>

          <span>
            :
          </span>

          {/* Minute */}

          <select
            value={checkInMinute}
            onChange={(e) => {

              setCheckInMinute(
                e.target.value
              );

              setFormData((prev) => ({
                ...prev,
                check_in: "selected",
              }));

            }}
          >

            {MINUTES.map((minute) => (

              <option
                key={minute}
                value={minute}
              >
                {minute}
              </option>

            ))}

          </select>

          {/* AM / PM */}

          <select
            value={checkInPeriod}
            onChange={(e) => {

              setCheckInPeriod(
                e.target.value as Period
              );

              setFormData((prev) => ({
                ...prev,
                check_in: "selected",
              }));

            }}
          >

            {PERIODS.map((period) => (

              <option
                key={period}
                value={period}
              >
                {period}
              </option>

            ))}

          </select>

        </div>

      </div>

      {/* ==================================
          Check Out
          ================================== */}

      <div className="form-group">

        <label>
          Check Out
        </label>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >

          {/* Hour */}

          <select
            value={checkOutHour}
            onChange={(e) => {

              setCheckOutHour(
                e.target.value
              );

              setFormData((prev) => ({
                ...prev,
                check_out: "selected",
              }));

            }}
          >

            {HOURS.map((hour) => (

              <option
                key={hour}
                value={hour}
              >
                {hour}
              </option>

            ))}

          </select>

          <span>
            :
          </span>

          {/* Minute */}

          <select
            value={checkOutMinute}
            onChange={(e) => {

              setCheckOutMinute(
                e.target.value
              );

              setFormData((prev) => ({
                ...prev,
                check_out: "selected",
              }));

            }}
          >

            {MINUTES.map((minute) => (

              <option
                key={minute}
                value={minute}
              >
                {minute}
              </option>

            ))}

          </select>

          {/* AM / PM */}

          <select
            value={checkOutPeriod}
            onChange={(e) => {

              setCheckOutPeriod(
                e.target.value as Period
              );

              setFormData((prev) => ({
                ...prev,
                check_out: "selected",
              }));

            }}
          >

            {PERIODS.map((period) => (

              <option
                key={period}
                value={period}
              >
                {period}
              </option>

            ))}

          </select>

        </div>

      </div>

      {/* ==================================
          Source
          ================================== */}

      <div className="form-group">

        <label>
          Source
        </label>

        <input
          type="text"
          name="source"
          value={
            formData.source
          }
          readOnly
        />

      </div>

      {/* ==================================
          Buttons
          ================================== */}

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