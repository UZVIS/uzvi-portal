import React, { useEffect, useMemo, useState } from "react";
import "./EmployeeAttendance.css";

import {
  Briefcase,
  CalendarDays,
  Download,
  Home,
  Search,
  UserX,
} from "lucide-react";

import { getEmployeeAttendance } from "../api";
import type { Attendance } from "../types";
import EmployeeAttendanceTable from "./EmployeeAttendanceTable";

interface EmployeeAttendanceProps {
  employeeId: string;
}

const EmployeeAttendance: React.FC<EmployeeAttendanceProps> = ({
  employeeId,
}) => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "dashboard" |
    "attendance" |
    "summary" |
    "history" |
    "export"
  >("dashboard");

  const [search, setSearch] = useState("");

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getEmployeeAttendance(employeeId);

      setRecords(data);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to fetch employee attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [employeeId]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const value = search.toLowerCase();

      return (
        record.status
          .toLowerCase()
          .includes(value) ||
        record.attendance_date
          .toLowerCase()
          .includes(value)
      );
    });
  }, [records, search]);

  const presentDays =
    records.filter(
      r => r.status === "in-office"
    ).length;

  const wfhDays =
    records.filter(
      r => r.status === "wfh"
    ).length;

  const leaveDays =
    records.filter(
      r => r.status === "on-leave"
    ).length;

  const absentDays =
    records.filter(
      r => r.status === "absent"
    ).length;

  const attendancePercentage =
    records.length === 0
      ? 0
      : Math.round(
          (
            (presentDays + wfhDays) /
            records.length
          ) * 100
        );

  const latestRecord =
    records.length > 0
      ? records[0]
      : null;

  return (
    <div className="employee-attendance">


            {/* ===========================
          Header
      =========================== */}

      <div className="employee-header">

        <div>

          <h1>Attendance</h1>

          <p>
            View your attendance and monthly summary
          </p>

        </div>

      </div>

      {/* ===========================
          Tabs
      =========================== */}

      <div className="attendance-tabs">

        <button
          className={
            activeTab === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          className={
            activeTab === "attendance"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("attendance")
          }
        >
          My Attendance
        </button>

        <button
          className={
            activeTab === "summary"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("summary")
          }
        >
          Monthly Summary
        </button>

        <button
          className={
            activeTab === "history"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("history")
          }
        >
          Attendance History
        </button>

        <button
          className={
            activeTab === "export"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("export")
          }
        >
          Export Attendance
        </button>

      </div>

      {error && (

        <div className="error-message">

          {error}

        </div>

      )}

      {/* ===========================
          Dashboard
      =========================== */}

      {activeTab === "dashboard" && (

        <>

          <div className="summary-grid">

            <div className="summary-card office">

              <div className="summary-icon">

                <Briefcase size={30} />

              </div>

              <div>

                <h3>Present Days</h3>

                <h2>{presentDays}</h2>

              </div>

            </div>

            <div className="summary-card wfh">

              <div className="summary-icon">

                <Home size={30} />

              </div>

              <div>

                <h3>WFH Days</h3>

                <h2>{wfhDays}</h2>

              </div>

            </div>

            <div className="summary-card leave">

              <div className="summary-icon">

                <CalendarDays size={30} />

              </div>

              <div>

                <h3>Leave Days</h3>

                <h2>{leaveDays}</h2>

              </div>

            </div>

            <div className="summary-card absent">

              <div className="summary-icon">

                <UserX size={30} />

              </div>

              <div>

                <h3>Absent Days</h3>

                <h2>{absentDays}</h2>

              </div>

            </div>

          </div>

          <div className="dashboard-row">

            <div className="overview-card">

              <div className="card-header">

                <h3>Attendance Overview</h3>

                <span>This Month</span>

              </div>

              <div className="overview-content">

                <div className="attendance-circle">

                  <div className="attendance-circle-inner">

                    <h2>

                      {attendancePercentage}%

                    </h2>

                    <p>Attendance</p>

                  </div>

                </div>

                <div className="overview-legend">

                  <div className="legend-item">

                    <span className="legend-dot present"></span>

                    Present ({presentDays})

                  </div>

                  <div className="legend-item">

                    <span className="legend-dot wfh"></span>

                    WFH ({wfhDays})

                  </div>

                  <div className="legend-item">

                    <span className="legend-dot leave"></span>

                    Leave ({leaveDays})

                  </div>

                  <div className="legend-item">

                    <span className="legend-dot absent"></span>

                    Absent ({absentDays})

                  </div>

                </div>

              </div>

            </div>

                        {/* Today's Status */}

            <div className="status-card">

              <div className="card-header">

                <h3>Today's Status</h3>

              </div>

              <div className="status-box">

                <h2>

                  {!latestRecord
                    ? "--"
                    : latestRecord.status === "in-office"
                    ? "Present"
                    : latestRecord.status === "wfh"
                    ? "WFH"
                    : latestRecord.status === "on-leave"
                    ? "On Leave"
                    : "Absent"}

                </h2>

                <p>Checked In</p>

                <h3>

                  {latestRecord?.check_in ?? "--"}

                </h3>

              </div>

              <div className="status-footer">

                <div>

                  <small>Expected Out</small>

                  <strong>

                    {latestRecord?.check_out ?? "--"}

                  </strong>

                </div>

                <div>

                  <small>Working Hours</small>

                  <strong>

                    {latestRecord?.check_in &&
                    latestRecord?.check_out
                      ? `${Math.floor(
                          (
                            (
                              Number(
                                latestRecord.check_out.split(":")[0]
                              ) *
                                60 +
                              Number(
                                latestRecord.check_out.split(":")[1]
                              )
                            ) -
                            (
                              Number(
                                latestRecord.check_in.split(":")[0]
                              ) *
                                60 +
                              Number(
                                latestRecord.check_in.split(":")[1]
                              )
                            )
                          ) / 60
                        )}h ${
                          (
                            (
                              Number(
                                latestRecord.check_out.split(":")[0]
                              ) *
                                60 +
                              Number(
                                latestRecord.check_out.split(":")[1]
                              )
                            ) -
                            (
                              Number(
                                latestRecord.check_in.split(":")[0]
                              ) *
                                60 +
                              Number(
                                latestRecord.check_in.split(":")[1]
                              )
                            )
                          ) % 60
                        }m`
                      : "--"}

                  </strong>

                </div>

              </div>

            </div>

          </div>

          {/* Recent Attendance */}

          <div className="recent-card">

            <div className="card-header">

              <h3>Recent Attendance</h3>

              <span>

                Last 5 Records

              </span>

            </div>

            <EmployeeAttendanceTable
              records={records.slice(0, 5)}
              loading={loading}
            />

          </div>

        </>

      )}

      {/* ===========================
    My Attendance
=========================== */}

{activeTab === "attendance" && (

<div>

  <div className="attendance-toolbar">

    <div className="search-box">

      <Search
        size={18}
        className="search-icon"
      />

      <input
        type="text"
        placeholder="Search by Date / Status"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

    </div>

  </div>

  <EmployeeAttendanceTable
    records={filteredRecords}
    loading={loading}
  />

</div>

)}

{/* ===========================
    Monthly Summary
=========================== */}

{activeTab === "summary" && (

<div>

  <div className="summary-grid">

    <div className="summary-card office">

      <div className="summary-icon">

        <Briefcase size={30} />

      </div>

      <div>

        <h3>Present Days</h3>

        <h2>{presentDays}</h2>

      </div>

    </div>

    <div className="summary-card wfh">

      <div className="summary-icon">

        <Home size={30} />

      </div>

      <div>

        <h3>WFH Days</h3>

        <h2>{wfhDays}</h2>

      </div>

    </div>

    <div className="summary-card leave">

      <div className="summary-icon">

        <CalendarDays size={30} />

      </div>

      <div>

        <h3>Leave Days</h3>

        <h2>{leaveDays}</h2>

      </div>

    </div>

    <div className="summary-card absent">

      <div className="summary-icon">

        <UserX size={30} />

      </div>

      <div>

        <h3>Absent Days</h3>

        <h2>{absentDays}</h2>

      </div>

    </div>

  </div>

  <div className="attendance-percent-card">

    <h3>

      Attendance Percentage

    </h3>

    <h1>

      {attendancePercentage}%

    </h1>

  </div>

</div>

)}

{/* ===========================
    Attendance History
=========================== */}

{activeTab === "history" && (

<div>

  <div className="card-header">

    <div>

      <h3>

        Attendance History

      </h3>

      <span>

        Complete attendance history

      </span>

    </div>

  </div>

  <EmployeeAttendanceTable
    records={records}
    loading={loading}
  />

</div>

)}

{/* ===========================
    Export Attendance
=========================== */}

{activeTab === "export" && (

<div className="export-container">

  <div className="export-card">

    <h2>

      Export Attendance

    </h2>

    <p>

      Download your attendance report in your preferred format.

    </p>

    <div className="export-buttons">

      <button
        className="export-btn"
        onClick={() =>
          console.log("Export Excel")
        }
      >

        <Download size={18} />

        Export Excel

      </button>

      <button
        className="export-btn"
        onClick={() =>
          console.log("Export PDF")
        }
      >

        <Download size={18} />

        Export PDF

      </button>

    </div>

  </div>

</div>

)}

    </div>

  );

};

export default EmployeeAttendance;
    