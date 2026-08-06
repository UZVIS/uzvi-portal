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

import type {
  Attendance,
  AttendanceFormData,
  AttendanceStatus,
} from "./types";

interface AttendanceModulePageProps {
  role: string;
}

const employeeNames: Record<string, string> = {
  EMP001: "Arjun Kumar",
  EMP002: "Rahul Sharma",
  EMP003: "Sneha Reddy",
  EMP004: "Priya Nair",
  EMP005: "Kiran Verma",
};

const AttendanceModulePage: React.FC<
  AttendanceModulePageProps
> = ({ role }) => {

  const employeeId = "EMP001";

  const teamId = "TEAM001";

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
  }, []);

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
  }, [records, search]);

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
     UI Starts
  ====================================== */

  return (
    <div className="attendance-page">

            {/* ======================================
          Header
      ====================================== */}

      <div className="attendance-header">

        <div>

          <h1>Attendance</h1>

          <p>
            Manage employee attendance,
            reports and monthly summary
          </p>

        </div>

      </div>

      {/* ======================================
          Error
      ====================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ======================================
          Summary Cards
      ====================================== */}

      {summary && (

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

            {/* ======================================
          ADMIN - Attendance Records
      ====================================== */}

      {role === "Admin" && (

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
                        ] ?? "Arjun Kumar"}

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

      {/* ======================================
          MANAGER - Team Attendance
      ====================================== */}

      {role === "Manager" && (

        <TeamAttendance
          teamId={teamId}
        />

      )}

            {/* ======================================
          Unexplained Absences
      ====================================== */}

      {(role === "Admin" ||
        role === "Manager") && (

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

          employeeName={
            employeeNames[
              employeeId
            ]
          }

        />

      )}

    </div>

  );

};

export default AttendanceModulePage;
  