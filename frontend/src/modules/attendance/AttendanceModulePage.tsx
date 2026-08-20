// src/modules/attendance/AttendanceModulePage.tsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AttendanceModulePage.css";

import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Briefcase,
  Home,
  CalendarDays,
  UserX,
} from "lucide-react";

import {
  useAttendance,
  useTeamAttendance,
} from "./hooks/useAttendance";

import AttendanceModal from "./components/AttendanceModal";
import TeamAttendance from "./components/TeamAttendance";
import UnexplainedAbsences from "./components/UnexplainedAbsences";
import EmployeeAttendance from "./components/EmployeeAttendance";
import { listActiveEmployees } from "../directory/api";


import type {
  Attendance,
  AttendanceFormData,
} from "./types";

interface AttendanceModulePageProps {
  role: string;
}


const AttendanceModulePage: React.FC<
  AttendanceModulePageProps
> = ({ role }) => {

  const employeeId = "EMP001";

  const teamId = "TEAM001";

  const [directoryEmployees, setDirectoryEmployees] =
  useState<Awaited<ReturnType<typeof listActiveEmployees>>>([]);

    /* ======================================
     Attendance Hook
  ====================================== */

  const {
    records,
    summary,
    loading,
    error,
    fetchAttendance,
    fetchSummary,
    markAttendance,
    editAttendance,
    removeAttendance,
  } = useAttendance();

  /* ======================================
     Team Hook
  ====================================== */

  const {
    fetchTeamAttendance,
    fetchUnexplainedAbsences,
  } = useTeamAttendance();

  /* ======================================
     States
  ====================================== */

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState<Attendance | null>(
    null
  );


  const [managerTab, setManagerTab] = useState<
  "dashboard" | "team" | "summary" | "absence" | "export"
>("dashboard");


const [adminTab, setAdminTab] = useState<
  "dashboard" |
  "records" |
  "summary" |
  "absence" |
  "export"
>("dashboard");

  /* ======================================
     Employee - Today's Attendance
  ====================================== */

  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getLocalDate();

  const [employeeStatus, setEmployeeStatus] = useState<
    "in-office" | "wfh" | "on-leave" | "absent" | ""
  >("");

  const [employeeCheckIn, setEmployeeCheckIn] = useState("");
  const [employeeCheckOut, setEmployeeCheckOut] = useState("");
  const [employeeSaving, setEmployeeSaving] = useState(false);

  const todayEmployeeRecord = useMemo(() => {
    return (
      records.find(
        (record) =>
          record.employee_id === employeeId &&
          record.attendance_date === today
      ) ?? null
    );
  }, [records, employeeId, today]);

  useEffect(() => {
    if (role !== "Employee") {
      return;
    }

    if (todayEmployeeRecord) {
      setEmployeeStatus(todayEmployeeRecord.status);
      setEmployeeCheckIn(todayEmployeeRecord.check_in ?? "");
      setEmployeeCheckOut(todayEmployeeRecord.check_out ?? "");
    } else {
      setEmployeeStatus("");
      setEmployeeCheckIn("");
      setEmployeeCheckOut("");
    }
  }, [role, todayEmployeeRecord]);

  const handleEmployeeAttendance = async () => {
    if (!employeeStatus) {
      alert("Please select today's attendance status.");
      return;
    }

    try {
      setEmployeeSaving(true);

      const data: AttendanceFormData = {
        employee_id: employeeId,
        attendance_date: today,
        status: employeeStatus,
        check_in:
          employeeStatus === "in-office" || employeeStatus === "wfh"
            ? employeeCheckIn || undefined
            : undefined,
        check_out:
          employeeStatus === "in-office" || employeeStatus === "wfh"
            ? employeeCheckOut || undefined
            : undefined,
        source: "manual",
      };

      if (todayEmployeeRecord) {
        await editAttendance(todayEmployeeRecord.id, data);
      } else {
        await markAttendance(data);
      }

      await fetchAttendance();

      await fetchSummary(
        employeeId,
        new Date().getFullYear(),
        new Date().getMonth() + 1
      );

      alert(
        todayEmployeeRecord
          ? "Today's attendance updated successfully."
          : "Today's attendance marked successfully."
      );
    } catch (err) {
      console.error("Failed to save today's attendance:", err);
      alert("Unable to save today's attendance. Please try again.");
    } finally {
      setEmployeeSaving(false);
    }
  };

  /* ======================================
     Initial Load
  ====================================== */
useEffect(() => {
  fetchAttendance();

  fetchSummary(
    employeeId,
    new Date().getFullYear(),
    new Date().getMonth() + 1
  );

  fetchTeamAttendance(teamId);

  fetchUnexplainedAbsences();

  listActiveEmployees()
    .then((employees) => {
      setDirectoryEmployees(employees);
    })
    .catch((err) => {
      console.error("Could not load directory employees:", err);
    });
}, []);

const employeeNames = useMemo(() => {
  return directoryEmployees.reduce<Record<string, string>>(
    (acc, employee) => {
      acc[employee.employee_id] = employee.name;
      return acc;
    },
    {}
  );
}, [directoryEmployees]);


/* ======================================
   Admin - Monthly Summary From Records
====================================== */

const adminMonthlySummary = useMemo(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthlyRecords = records.filter((record) => {
    if (!record.attendance_date) {
      return false;
    }

    const parts = record.attendance_date.split("-");

    if (parts.length !== 3) {
      return false;
    }

    const recordYear = Number(parts[0]);
    const recordMonth = Number(parts[1]);

    return (
      recordYear === currentYear &&
      recordMonth === currentMonth
    );
  });

  return {
    present_days: monthlyRecords.filter(
      (record) => record.status === "in-office"
    ).length,

    wfh_days: monthlyRecords.filter(
      (record) => record.status === "wfh"
    ).length,

    leave_days: monthlyRecords.filter(
      (record) => record.status === "on-leave"
    ).length,

    absent_days: monthlyRecords.filter(
      (record) => record.status === "absent"
    ).length,
  };
}, [records]);


const attendanceEmployees = useMemo(() => {
  return directoryEmployees.filter(
    (employee) =>
      employee.access_tier === "Employee" ||
      employee.access_tier === "Manager"
  );
}, [directoryEmployees]);

  /* ======================================
     Search Filter
  ====================================== */

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const employeeName =
        employeeNames[item.employee_id] ??
        "";

      return (
        item.employee_id
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        employeeName
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        item.status
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        item.attendance_date.includes(
          search
        )
      );
    });
 }, [records, search, employeeNames]);

  /* ======================================
     Add Attendance
  ====================================== */

  const handleAddAttendance = () => {
    setSelectedRecord(null);
    setModalOpen(true);
  };

  /* ======================================
     Edit Attendance
  ====================================== */

  const handleEditAttendance = (
    record: Attendance
  ) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  /* ======================================
     Delete Attendance
  ====================================== */

  const handleDeleteAttendance =
    async (id: number) => {
      const ok = window.confirm(
        "Delete attendance record?"
      );

      if (!ok) return;

      await removeAttendance(id);

      fetchAttendance();
    };

  /* ======================================
     Save Attendance
  ====================================== */

  const handleSaveAttendance =
    async (
      data: AttendanceFormData
    ) => {
      if (selectedRecord) {
        await editAttendance(
          selectedRecord.id,
          data
        );
      } else {
        await markAttendance(data);
      }

      setModalOpen(false);
      setSelectedRecord(null);

      fetchAttendance();
    };


      /* ======================================
     Export Attendance CSV
  ====================================== */

  const handleExportAttendance = () => {

    if (records.length === 0) {
      alert("No attendance records available to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee Name",
      "Date",
      "Status",
      "Check In",
      "Check Out",
      "Source",
    ];

    const rows = records.map((record) => [
      record.employee_id,
      employeeNames[record.employee_id] ?? "Unknown",
      record.attendance_date,
      record.status,
      record.check_in ?? "-",
      record.check_out ?? "-",
      record.source ?? "Manual",
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `attendance-${new Date()
        .toISOString()
        .split("T")[0]}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ======================================
     UI Starts
  ====================================== */

  return (
    <div className="attendance-page">

            {/* ======================================
          Header
      ====================================== */}
      {role !== "Employee" && (
      <div className="attendance-header">

        <div>

          <h1>Attendance</h1>

          <p>
            Manage employee attendance,
            reports and monthly summary
          </p>

        </div>

      </div>
      )}

      {/* ======================================
          Error
      ====================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


    {role === "Manager" && (
  <>
    <div className="attendance-tabs">

      <button
        className={managerTab === "dashboard" ? "active" : ""}
        onClick={() => setManagerTab("dashboard")}
      >
        Dashboard
      </button>

      <button
        className={managerTab === "team" ? "active" : ""}
        onClick={() => setManagerTab("team")}
      >
        Team Attendance
      </button>

      <button
        className={managerTab === "summary" ? "active" : ""}
        onClick={() => setManagerTab("summary")}
      >
        Monthly Summary
      </button>


      <button
  className={managerTab === "absence" ? "active" : ""}
  onClick={() => setManagerTab("absence")}
>
  Unexplained Absences
</button>

   

      <button
        className={managerTab === "export" ? "active" : ""}
        onClick={() => setManagerTab("export")}
      >
        Export
      </button>

    </div>

    {managerTab === "dashboard" && (
      <div className="manager-dashboard">
        
        <h2>Summary Cards</h2>

      </div>
    )}

   

   {managerTab === "dashboard" && (

  <div className="manager-dashboard">


    <div className="summary-grid">

      <div className="summary-card office">
        <div className="summary-icon">
          <Briefcase size={26} />
        </div>

        <div>
          <h3>In Office</h3>
          <h2>{adminMonthlySummary.present_days}</h2>
        </div>
      </div>

      <div className="summary-card wfh">
        <div className="summary-icon">
          <Home size={26} />
        </div>

        <div>
          <h3>WFH</h3>
          <h2>{adminMonthlySummary.wfh_days}</h2>
        </div>
      </div>

      <div className="summary-card leave">
        <div className="summary-icon">
          <CalendarDays size={26} />
        </div>

        <div>
          <h3>On Leave</h3>
          <h2>{adminMonthlySummary.leave_days}</h2>
        </div>
      </div>

      <div className="summary-card absent">
        <div className="summary-icon">
          <UserX size={26} />
        </div>

        <div>
          <h3>Absent</h3>
          <h2>{adminMonthlySummary.absent_days}</h2>
        </div>
      </div>

    </div>

  </div>

)}
    
    {managerTab === "team" && (
      <TeamAttendance teamId={teamId} />
    )}

    {managerTab === "summary" && (
  <div className="manager-summary">

    <h2>Monthly Summary</h2>

    <div className="summary-grid">

      <div className="summary-card office">
        <h3>Present Days</h3>
        <h2>{adminMonthlySummary.present_days}</h2>
      </div>

      <div className="summary-card wfh">
        <h3>WFH Days</h3>
        <h2>{adminMonthlySummary.wfh_days}</h2>
      </div>

      <div className="summary-card leave">
        <h3>Leave Days</h3>
        <h2>{adminMonthlySummary.leave_days}</h2>
      </div>

      <div className="summary-card absent">
        <h3>Absent Days</h3>
        <h2>{adminMonthlySummary.absent_days}</h2>
      </div>

    </div>

  </div>
)}

  </>
)}
    

{role === "Admin" && (

<div className="attendance-tabs">

  <button
    className={adminTab === "dashboard" ? "active" : ""}
    onClick={() => setAdminTab("dashboard")}
  >
    Dashboard
  </button>

  <button
    className={adminTab === "records" ? "active" : ""}
    onClick={() => setAdminTab("records")}
  >
    Attendance Records
  </button>

  <button
    className={adminTab === "summary" ? "active" : ""}
    onClick={() => setAdminTab("summary")}
  >
    Monthly Summary
  </button>

  <button
    className={adminTab === "absence" ? "active" : ""}
    onClick={() => setAdminTab("absence")}
  >
    Unexplained Absences
  </button>

  <button
    className={adminTab === "export" ? "active" : ""}
    onClick={() => setAdminTab("export")}
  >
    Export
  </button>

</div>

)}
      {/* ======================================
          Summary Cards
      ====================================== */}
 

       
       {role === "Admin" &&
 adminTab === "dashboard" &&
 summary && (

        <div className="summary-grid">

          <div className="summary-card office">

            <div className="summary-icon">
              <Briefcase size={26} />
            </div>

            <div>
              <h3>In Office</h3>
              <h2>{adminMonthlySummary.present_days}</h2>
            </div>

          </div>

          <div className="summary-card wfh">

            <div className="summary-icon">
              <Home size={26} />
            </div>

            <div>
              <h3>WFH</h3>
              <h2>{adminMonthlySummary.wfh_days}</h2>
            </div>

          </div>

          <div className="summary-card leave">

            <div className="summary-icon">
              <CalendarDays size={26} />
            </div>

            <div>
              <h3>On Leave</h3>
              <h2>{adminMonthlySummary.leave_days}</h2>
            </div>

          </div>

          <div className="summary-card absent">

            <div className="summary-icon">
              <UserX size={26} />
            </div>

            <div>
              <h3>Absent</h3>
              <h2>{adminMonthlySummary.absent_days}</h2>
            </div>

          </div>

        </div>

      )}

      {/* ======================================
          Toolbar
      ====================================== */}

       
        {role === "Admin" &&
adminTab === "records" && (
      <div className="attendance-toolbar">

        <div className="search-box">

          <Search
            size={18}
            className="search-icon"
          />

          <input
            type="text"
            className="search-input"
            placeholder="Search Employee ID / Name / Date / Status"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
          
        </div>
        

        <div className="toolbar-buttons">

          <button className="export-btn">

            <Download size={18} />

            Export Attendance

          </button>

          {role === "Admin" && (

            <button
              className="add-btn"
              onClick={handleAddAttendance}
            >

              <Plus size={18} />

              Add Attendance

            </button>

          )}

        </div>

      </div>
      )}
      
            {/* ======================================
          ADMIN - Attendance Records
      ====================================== */}

      {role === "Admin" && 
 adminTab === "records" && (

        <div className="attendance-table">

          <div className="table-header">

            <div>

              <h2>Attendance Records</h2>

              <p>Employee attendance history</p>

            </div>

            <div className="record-count">

              {filteredRecords.length} Records

            </div>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>Employee ID</th>

                  <th>Employee Name</th>

                  <th>Date</th>

                  <th>Status</th>

                  <th>Check In</th>

                  <th>Check Out</th>

                  <th>Source</th>

                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {filteredRecords.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="empty-state"
                    >

                      No attendance records found.

                    </td>

                  </tr>

                ) : (

                  filteredRecords.map((record) => (

                    <tr key={record.id}>

                      <td className="employee-id">

                        {record.employee_id}

                      </td>

                      <td className="employee-name">

                        {employeeNames[
                        record.employee_id
                      ] ?? "Unknown Employee"}

                      </td>

                      <td className="attendance-date">

                        {new Date(
                          record.attendance_date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}

                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            record.status ===
                            "in-office"
                              ? "office"
                              : record.status ===
                                "wfh"
                              ? "wfh"
                              : record.status ===
                                "on-leave"
                              ? "leave"
                              : "absent"
                          }`}
                        >

                          {record.status}

                        </span>

                      </td>

                      <td>

                        {record.check_in ?? "-"}

                      </td>

                      <td>

                        {record.check_out ?? "-"}

                      </td>

                      <td>

                        <span className="source-badge">

                          {record.source ??
                            "Manual"}

                        </span>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="view-btn"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEditAttendance(
                                record
                              )
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDeleteAttendance(
                                record.id
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      
     
{role === "Admin" &&
 adminTab === "summary" && (

<div className="attendance-table">

  <div className="table-header">
    <h2>Monthly Summary</h2>
  </div>

  <div className="summary-grid">

    <div className="summary-card office">
      <h3>Present Days</h3>
      <h2>{adminMonthlySummary.present_days}</h2>
    </div>

    <div className="summary-card wfh">
      <h3>WFH Days</h3>
      <h2>{adminMonthlySummary.wfh_days}</h2>
    </div>

    <div className="summary-card leave">
      <h3>Leave Days</h3>
      <h2>{adminMonthlySummary.leave_days}</h2>
    </div>

    <div className="summary-card absent">
      <h3>Absent Days</h3>
      <h2>{adminMonthlySummary.absent_days}</h2>
    </div>

  </div>

</div>

)}


{role === "Admin" &&
 adminTab === "absence" && (

  <div className="mt-30">

    <UnexplainedAbsences />

  </div>

)}

    <button
  className="export-btn"
  onClick={handleExportAttendance}
>
  <Download size={18} />

  Export Attendance

</button>


      {/* ======================================
    EMPLOYEE - Attendance
====================================== */}

{role === "Employee" && (
  <>
    {/* ======================================
        EMPLOYEE - TODAY'S ATTENDANCE
    ====================================== */}

    <div
      className="attendance-table"
      style={{
        marginBottom: "24px",
        padding: "24px",
      }}
    >
      <div className="table-header">
        <div>
          <h2>Today's Attendance</h2>
          <p>
            Mark your attendance for today by selecting your work status.
          </p>
        </div>

        <div className="record-count">
          {todayEmployeeRecord ? "Attendance Marked" : "Not Marked"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* Date */}
        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "15px",
            }}
          >
            Date
          </strong>

          <div
            style={{
              padding: "12px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              width: "fit-content",
              minWidth: "160px",
            }}
          >
            {new Date(`${today}T00:00:00`).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "15px",
            }}
          >
            Attendance Status
          </strong>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {[
              {
                value: "in-office" as const,
                label: "In-Office",
                icon: <Briefcase size={17} />,
              },
              {
                value: "wfh" as const,
                label: "WFH",
                icon: <Home size={17} />,
              },
              {
                value: "on-leave" as const,
                label: "On-Leave",
                icon: <CalendarDays size={17} />,
              },
              {
                value: "absent" as const,
                label: "Absent",
                icon: <UserX size={17} />,
              },
            ].map((option) => {
              const selected = employeeStatus === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEmployeeStatus(option.value)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: selected
                      ? "2px solid #ff6b00"
                      : "1px solid #d9e2ec",
                    background: selected ? "#fff4eb" : "#ffffff",
                    color: selected ? "#ff6b00" : "#475569",
                    fontWeight: selected ? 700 : 600,
                    cursor: "pointer",
                  }}
                >
                  {option.icon}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Check In / Check Out */}
        {(employeeStatus === "in-office" ||
          employeeStatus === "wfh") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label
                htmlFor="employee-check-in"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Check In
              </label>

              <input
                id="employee-check-in"
                type="time"
                value={employeeCheckIn}
                onChange={(e) => setEmployeeCheckIn(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  border: "1px solid #d9e2ec",
                  borderRadius: "10px",
                  fontSize: "14px",
                  background: "#ffffff",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="employee-check-out"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Check Out
              </label>

              <input
                id="employee-check-out"
                type="time"
                value={employeeCheckOut}
                onChange={(e) => setEmployeeCheckOut(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  border: "1px solid #d9e2ec",
                  borderRadius: "10px",
                  fontSize: "14px",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>
        )}

        {/* On Leave information */}
        {employeeStatus === "on-leave" && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fff8e1",
              border: "1px solid #f6d365",
              color: "#7c5a00",
              fontSize: "14px",
            }}
          >
            On-Leave can be populated from approved Leave Management
            records where M2 integration is available.
          </div>
        )}

        {/* Absent information */}
        {employeeStatus === "absent" && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fff1f1",
              border: "1px solid #f3b4b4",
              color: "#9f1d1d",
              fontSize: "14px",
            }}
          >
            Select Absent when you need to record Absent for today.
          </div>
        )}

        {/* Save */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "4px",
          }}
        >
          <button
            type="button"
            className="add-btn"
            onClick={handleEmployeeAttendance}
            disabled={!employeeStatus || employeeSaving}
            style={{
              opacity:
                !employeeStatus || employeeSaving ? 0.6 : 1,
              cursor:
                !employeeStatus || employeeSaving
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {employeeSaving
              ? "Saving..."
              : todayEmployeeRecord
              ? "Update Today's Attendance"
              : "Mark Attendance"}
          </button>
        </div>
      </div>
    </div>

    {/* ======================================
        EMPLOYEE - ATTENDANCE HISTORY
    ====================================== */}

    <EmployeeAttendance employeeId={employeeId} />
  </>
)}

            {/* ======================================
          Unexplained Absences
      ====================================== */}
{(
  
  (role === "Manager" &&
   managerTab === "absence")

) && (

  <div className="mt-30">

    <UnexplainedAbsences />

  </div>

)}

      {/* ======================================
          Attendance Modal
          (Admin Only)
      ====================================== */}

      {role === "Admin" && (

        <AttendanceModal

          isOpen={modalOpen}

          onClose={() => {

            setModalOpen(false);

            setSelectedRecord(null);

          }}

          onSave={handleSaveAttendance}

          record={selectedRecord}

          loading={loading}

          employeeId={employeeId}

          employees={attendanceEmployees}

          
        />

      )}

    </div>

  );

};

export default AttendanceModulePage;