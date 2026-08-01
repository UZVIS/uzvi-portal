// src/modules/attendance/AttendanceModulePage.tsx

import React, { useEffect, useState } from "react";
import { useAttendance } from "./hooks/useAttendance";
import type { AttendanceStatus, AttendanceFormData } from "./types";
import "./AttendanceModulePage.css";

const AttendanceModulePage: React.FC = () => {
  const {
    records,
    summary,
    markAttendance,
    fetchMyAttendance,
  } = useAttendance();

  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const currentDate = new Date();

  useEffect(() => {
    fetchMyAttendance("EMP001");
  }, []);

  const handleStatusSelect = async (status: AttendanceStatus) => {
    setSelectedStatus(status);

    const payload: AttendanceFormData = {
      employee_id: "EMP001",
      attendance_date: new Date().toISOString().split("T")[0],
      status: status,
      source: "manual"
    };

    try {
      await markAttendance(payload);
      await fetchMyAttendance("EMP001"); // Refresh after marking
    } catch (error) {
      console.error("Failed to mark attendance", error);
    }
  };

  const todayStr = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  const todayRecord = records.find(
    record =>
      record.attendance_date === new Date().toISOString().split("T")[0]
  );

  const getStatusEmoji = (status: AttendanceStatus) => {
    const map = {
      "in-office": "🏢",
      "wfh": "🏠",
      "on-leave": "🌴",
      "absent": "❌"
    };
    return map[status] || "⭕";
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    const map = {
      "in-office": "Office",
      "wfh": "WFH",
      "on-leave": "Leave",
      "absent": "Absent"
    };
    return map[status] || status;
  };

  const filteredRecords = records.filter(
    record =>
      record.attendance_date.includes(searchTerm) ||
      record.status.includes(searchTerm)
  );

  const stats = {
    present: summary?.present_days ?? 0,
    wfh: summary?.wfh_days ?? 0,
    leave: summary?.leave_days ?? 0,
    total: summary?.total_days ?? 0
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getDayStatus = (day: number) => {
    const dateStr =
      `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = records.find(item => item.attendance_date === dateStr);
    return record?.status ?? null;
  };

  const calendarDays = generateCalendar();
  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="attendance-page">
      {/* HEADER */}
      <div className="attendance-header">
        <h1>Attendance</h1>
        <p className="subtitle">
          Mark your day and track your monthly summary — {monthName}
        </p>
      </div>

      {/* TOTALS */}
      <div className="totals-section">
        <div className="totals-grid">
          <div className="total-card">
            <div className="total-value">{stats.total}</div>
            <div className="total-label">Total days worked</div>
          </div>
          <div className="total-card">
            <div className="total-value">{stats.present}</div>
            <div className="total-label">Days in office</div>
          </div>
          <div className="total-card">
            <div className="total-value">{stats.wfh}</div>
            <div className="total-label">WFH days</div>
          </div>
          <div className="total-card">
            <div className="total-value">{stats.leave}</div>
            <div className="total-label">Leave days</div>
          </div>
          <div className="total-card">
            <div className="total-value">{records.length}</div>
            <div className="total-label">Total records</div>
          </div>
        </div>
      </div>

      {/* TODAY STATUS */}
      <div className="today-section">
        <div className="today-label">
          <span className="today-date">Today - {todayStr}</span>
          <span className="today-question">How are you working today?</span>
        </div>

        <div className="status-cards">
          <button
            className={`status-card ${selectedStatus === "in-office" ? "active" : ""} ${todayRecord?.status === "in-office" ? "marked" : ""}`}
            onClick={() => handleStatusSelect("in-office")}
          >
            <span className="status-icon">🏢</span>
            <span className="status-name">Office</span>
            {todayRecord?.status === "in-office" && <span className="check-mark">✓</span>}
          </button>

          <button
            className={`status-card ${selectedStatus === "wfh" ? "active" : ""} ${todayRecord?.status === "wfh" ? "marked" : ""}`}
            onClick={() => handleStatusSelect("wfh")}
          >
            <span className="status-icon">🏠</span>
            <span className="status-name">WFH</span>
            {todayRecord?.status === "wfh" && <span className="check-mark">✓</span>}
          </button>

          <button
            className={`status-card ${selectedStatus === "on-leave" ? "active" : ""} ${todayRecord?.status === "on-leave" ? "marked" : ""}`}
            onClick={() => handleStatusSelect("on-leave")}
          >
            <span className="status-icon">🌴</span>
            <span className="status-name">Leave</span>
            {todayRecord?.status === "on-leave" && <span className="check-mark">✓</span>}
          </button>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="calendar-section">
        <div className="calendar-header">
          <h3>{monthName}</h3>
        </div>

        <div className="calendar-grid">
          {weekDays.map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            const status = day ? getDayStatus(day) : null;
            const isToday = day === new Date().getDate() && 
                           currentDate.getMonth() === new Date().getMonth() &&
                           currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={index}
                className={`calendar-day ${!day ? "empty" : ""} ${isToday ? "today" : ""}`}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    {status && (
                      <span className="day-status">{getStatusEmoji(status)}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search attendance by date or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">Search</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title">
            <h3>Attendance Records</h3>
            <span className="record-count">{filteredRecords.length} records</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>STATUS</th>
                <th>CHECK-IN</th>
                <th>CHECK-OUT</th>
                <th>SOURCE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {new Date(record.attendance_date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        }
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${record.status}`}>
                        {getStatusEmoji(record.status)} {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>{record.check_in || "-"}</td>
                    <td>{record.check_out || "-"}</td>
                    <td>
                      <span className="source-badge">{record.source || "manual"}</span>
                    </td>
                    <td className="actions-cell">
                      <button className="action-btn edit-btn" title="Edit">
                        ✏️
                      </button>
                      <button className="action-btn delete-btn" title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModulePage;