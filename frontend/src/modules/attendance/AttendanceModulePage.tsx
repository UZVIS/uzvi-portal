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
          <h2>{summary?.present_days ?? 0}</h2>
        </div>
      </div>

      <div className="summary-card wfh">
        <div className="summary-icon">
          <Home size={26} />
        </div>

        <div>
          <h3>WFH</h3>
          <h2>{summary?.wfh_days ?? 0}</h2>
        </div>
      </div>

      <div className="summary-card leave">
        <div className="summary-icon">
          <CalendarDays size={26} />
        </div>

        <div>
          <h3>On Leave</h3>
          <h2>{summary?.leave_days ?? 0}</h2>
        </div>
      </div>

      <div className="summary-card absent">
        <div className="summary-icon">
          <UserX size={26} />
        </div>

        <div>
          <h3>Absent</h3>
          <h2>{summary?.absent_days ?? 0}</h2>
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
        <h2>{summary?.present_days ?? 0}</h2>
      </div>

      <div className="summary-card wfh">
        <h3>WFH Days</h3>
        <h2>{summary?.wfh_days ?? 0}</h2>
      </div>

      <div className="summary-card leave">
        <h3>Leave Days</h3>
        <h2>{summary?.leave_days ?? 0}</h2>
      </div>

      <div className="summary-card absent">
        <h3>Absent Days</h3>
        <h2>{summary?.absent_days ?? 0}</h2>
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
              <h2>{summary.present_days}</h2>
            </div>

          </div>

          <div className="summary-card wfh">

            <div className="summary-icon">
              <Home size={26} />
            </div>

            <div>
              <h3>WFH</h3>
              <h2>{summary.wfh_days}</h2>
            </div>

          </div>

          <div className="summary-card leave">

            <div className="summary-icon">
              <CalendarDays size={26} />
            </div>

            <div>
              <h3>On Leave</h3>
              <h2>{summary.leave_days}</h2>
            </div>

          </div>

          <div className="summary-card absent">

            <div className="summary-icon">
              <UserX size={26} />
            </div>

            <div>
              <h3>Absent</h3>
              <h2>{summary.absent_days}</h2>
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
      <h2>{summary?.present_days ?? 0}</h2>
    </div>

    <div className="summary-card wfh">
      <h3>WFH Days</h3>
      <h2>{summary?.wfh_days ?? 0}</h2>
    </div>

    <div className="summary-card leave">
      <h3>Leave Days</h3>
      <h2>{summary?.leave_days ?? 0}</h2>
    </div>

    <div className="summary-card absent">
      <h3>Absent Days</h3>
      <h2>{summary?.absent_days ?? 0}</h2>
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

  <EmployeeAttendance
    employeeId={employeeId}
  />

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