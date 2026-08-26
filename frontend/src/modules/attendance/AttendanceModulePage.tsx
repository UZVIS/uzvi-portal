// src/modules/attendance/AttendanceModulePage.tsx

import React, { useEffect, useMemo, useState } from "react";
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
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
} from "lucide-react";

import {
  useAttendance,
  useTeamAttendance,
} from "./hooks/useAttendance";

import AttendanceModal from "./components/AttendanceModal";
import TeamAttendance from "./components/TeamAttendance";
import UnexplainedAbsences from "./components/UnexplainedAbsences";

import { listActiveEmployees } from "../directory/api";

import {
  createAttendance,
  updateAttendance,
  getEmployeeAttendance,
} from "./api";

import type {
  Attendance,
  AttendanceFormData,
  AttendanceStatus,
} from "./types";

interface AttendanceModulePageProps {
  role: string;
}

type StoredIdentity = {
  employeeId: string;
  name: string;
  email: string;
};

// Use the exact Employee type returned by the Directory API.
// This keeps AttendanceModulePage compatible with AttendanceModal.
type DirectoryEmployee =
  Awaited<ReturnType<typeof listActiveEmployees>>[number];

const normalizeEmployeeId = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return /^EMP\d+$/i.test(text) ? text.toUpperCase() : "";
};

const getLocalDate = (): string => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

const formatTimeForDisplay = (time?: string | null): string => {
  if (!time) return "--:--";

  const parts = time.split(":");
  if (parts.length < 2) return "--:--";

  const hour = Number(parts[0]);
  const minute = parts[1];

  if (Number.isNaN(hour)) return "--:--";

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
};

const formatAttendanceSource = (source?: string | null): string => {
  if (!source) return "Manual";
  if (source === "manual") return "Manual";
  if (source === "system") return "Auto";
  if (source === "m2-leave") return "Leave Approved";
  return source;
};

const decodeJwtPayload = (
  token: string
): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      base64 +
      "=".repeat((4 - (base64.length % 4)) % 4);

    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map(
          (char) =>
            `%${char.charCodeAt(0)
              .toString(16)
              .padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const readIdentityFromObject = (
  value: unknown
): StoredIdentity => {
  if (!value || typeof value !== "object") {
    return {
      employeeId: "",
      name: "",
      email: "",
    };
  }

  const obj = value as Record<string, unknown>;

  const nestedValues = [
    obj.user,
    obj.employee,
    obj.profile,
    obj.data,
  ]
    .filter(Boolean)
    .map((item) =>
      readIdentityFromObject(item)
    );

  const employeeId =
    normalizeEmployeeId(obj.employee_id) ||
    normalizeEmployeeId(obj.employeeId) ||
    normalizeEmployeeId(obj.currentEmployeeId) ||
    normalizeEmployeeId(obj.current_employee_id) ||
    normalizeEmployeeId(obj.loggedInEmployeeId) ||
    normalizeEmployeeId(obj.logged_in_employee_id) ||
    normalizeEmployeeId(obj.userEmployeeId) ||
    nestedValues
      .map((item) => item.employeeId)
      .find(Boolean) ||
    "";

  const name = String(
    obj.name ??
      obj.full_name ??
      obj.fullName ??
      obj.employee_name ??
      obj.employeeName ??
      obj.username ??
      nestedValues
        .map((item) => item.name)
        .find(Boolean) ??
      ""
  ).trim();

  const email = String(
    obj.email ??
      obj.employee_email ??
      nestedValues
        .map((item) => item.email)
        .find(Boolean) ??
      ""
  ).trim();

  return {
    employeeId,
    name,
    email,
  };
};

const getStoredIdentity = (): StoredIdentity => {
  const identity: StoredIdentity = {
    employeeId: "",
    name: "",
    email: "",
  };

  if (typeof window === "undefined") {
    return identity;
  }

  const directKeys = [
    "employee_id",
    "employeeId",
    "currentEmployeeId",
    "current_employee_id",
    "loggedInEmployeeId",
    "logged_in_employee_id",
    "userEmployeeId",
  ];

  const nameKeys = [
    "employee_name",
    "employeeName",
    "currentEmployeeName",
    "loggedInEmployeeName",
    "userName",
    "username",
  ];

  const emailKeys = [
    "employee_email",
    "employeeEmail",
    "email",
    "userEmail",
  ];

  const storages: Storage[] = [
    window.localStorage,
    window.sessionStorage,
  ];

  for (const storage of storages) {
    for (const key of directKeys) {
      const value = normalizeEmployeeId(
        storage.getItem(key)
      );

      if (value && !identity.employeeId) {
        identity.employeeId = value;
      }
    }

    for (const key of nameKeys) {
      const value =
        storage.getItem(key)?.trim() ?? "";

      if (value && !identity.name) {
        identity.name = value;
      }
    }

    for (const key of emailKeys) {
      const value =
        storage.getItem(key)?.trim() ?? "";

      if (value && !identity.email) {
        identity.email = value;
      }
    }

    for (
      let index = 0;
      index < storage.length;
      index += 1
    ) {
      const key = storage.key(index);
      if (!key) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as unknown;
        const parsedIdentity =
          readIdentityFromObject(parsed);

        if (
          !identity.employeeId &&
          parsedIdentity.employeeId
        ) {
          identity.employeeId =
            parsedIdentity.employeeId;
        }

        if (
          !identity.name &&
          parsedIdentity.name
        ) {
          identity.name =
            parsedIdentity.name;
        }

        if (
          !identity.email &&
          parsedIdentity.email
        ) {
          identity.email =
            parsedIdentity.email;
        }
      } catch {
        // Not JSON.
      }

      if (
        !identity.employeeId ||
        !identity.name ||
        !identity.email
      ) {
        const payload =
          decodeJwtPayload(raw);

        if (payload) {
          const tokenIdentity =
            readIdentityFromObject(payload);

          if (
            !identity.employeeId &&
            tokenIdentity.employeeId
          ) {
            identity.employeeId =
              tokenIdentity.employeeId;
          }

          if (
            !identity.name &&
            tokenIdentity.name
          ) {
            identity.name =
              tokenIdentity.name;
          }

          if (
            !identity.email &&
            tokenIdentity.email
          ) {
            identity.email =
              tokenIdentity.email;
          }
        }
      }
    }
  }

  return identity;
};

/*
 * The portal header is the current-login source of truth.
 * We intentionally inspect only the top/header area.
 *
 * This is important because the attendance table may contain
 * names of other employees. Searching document.body blindly
 * can therefore select Sravani when Hari Priya is logged in.
 */
const findCurrentHeaderEmployee = (
  employees: DirectoryEmployee[]
): DirectoryEmployee | undefined => {
  if (
    typeof document === "undefined" ||
    employees.length === 0
  ) {
    return undefined;
  }

  const candidates = employees
    .map((employee) => ({
      employee,
      name: String(employee.name ?? "")
        .trim()
        .toLowerCase(),
    }))
    .filter((item) => item.name.length > 1);

  let best:
    | {
        employee: DirectoryEmployee;
        top: number;
      }
    | undefined;

  const elements =
    document.querySelectorAll<HTMLElement>(
      "header, nav, [role='banner'], body *"
    );

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();

    // Portal header is near the top of the viewport.
    if (rect.top < 0 || rect.top > 190) {
      return;
    }

    const text =
      element.textContent
        ?.replace(/\s+/g, " ")
        .trim()
        .toLowerCase() ?? "";

    if (!text || text.length > 250) {
      return;
    }

    for (const candidate of candidates) {
      if (!text.includes(candidate.name)) {
        continue;
      }

      if (
        !best ||
        rect.top < best.top
      ) {
        best = {
          employee: candidate.employee,
          top: rect.top,
        };
      }
    }
  });

  return best?.employee;
};

const AttendanceModulePage: React.FC<
  AttendanceModulePageProps
> = ({ role }) => {
  const normalizedRole =
    role.trim().toLowerCase();

  const isEmployee =
    normalizedRole === "employee";

  const isAdmin =
    normalizedRole === "admin";

  const isManager =
    normalizedRole === "manager";

  /*
   * IMPORTANT:
   * Do not initialise employeeId from localStorage.
   *
   * localStorage can contain the previous logged-in
   * employee's ID. We resolve the current login first.
   */
  const [employeeId, setEmployeeId] =
    useState("");

  const [employeeName, setEmployeeName] =
    useState("");

  const [directoryEmployees, setDirectoryEmployees] =
    useState<DirectoryEmployee[]>([]);

  const {
    records,
    loading,
    error,
    fetchAttendance,
    fetchMyAttendance,
    markAttendance,
    editAttendance,
    removeAttendance,
  } = useAttendance();

  const {
    fetchTeamAttendance,
    fetchUnexplainedAbsences,
  } = useTeamAttendance();

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectedRecord, setSelectedRecord] =
    useState<Attendance | null>(null);

  // Record selected from the Admin View button.
  // This is separate from selectedRecord so the existing
  // Add/Edit Attendance modal keeps working exactly as before.
  const [viewRecord, setViewRecord] =
    useState<Attendance | null>(null);

  const [managerTab, setManagerTab] =
    useState<
      | "dashboard"
      | "team"
      | "summary"
      | "absence"
      | "export"
    >("dashboard");

  const [adminTab, setAdminTab] =
    useState<
      | "dashboard"
      | "records"
      | "summary"
      | "absence"
      | "export"
    >("dashboard");

  const [employeeTab, setEmployeeTab] =
    useState<
      | "dashboard"
      | "attendance"
      | "summary"
      | "export"
    >("dashboard");

  const [employeeStatus, setEmployeeStatus] =
    useState<AttendanceStatus | "">("");

  const [employeeCheckIn, setEmployeeCheckIn] =
    useState("");

  const [employeeCheckOut, setEmployeeCheckOut] =
    useState("");

  const [employeeSaving, setEmployeeSaving] =
    useState(false);

  // M2 Leave Management integration state.
  // The backend is the source of truth and returns source="m2-leave"
  // when an approved M2 leave covers today's attendance date.
  const [m2LeaveMatched, setM2LeaveMatched] =
    useState(false);

  const teamId = "TEAM001";
  const today = getLocalDate();

  /*
   * Automatic attendance-window handling.
   *
   * During today:
   *   no record = Not Marked
   *
   * After today's attendance window closes:
   *   no record = Absent
   *
   * On-Leave is controlled by approved M2 Leave Management.
   */
  useEffect(() => {
    let cancelled = false;

    const loadDirectory =
      async () => {
        try {
          const employees =
            await listActiveEmployees();

          if (!cancelled) {
            setDirectoryEmployees(
              employees as DirectoryEmployee[]
            );
          }
        } catch (err) {
          console.error(
            "Could not load directory employees:",
            err
          );
        }
      };

    void loadDirectory();

    if (!isEmployee) {
      void fetchAttendance();
    }

    if (isAdmin || isManager) {
      void fetchTeamAttendance(teamId);
      void fetchUnexplainedAbsences();
    }

    return () => {
      cancelled = true;
    };
  }, [
    isEmployee,
    isAdmin,
    isManager,
    fetchAttendance,
    fetchTeamAttendance,
    fetchUnexplainedAbsences,
  ]);

  /*
   * Resolve the CURRENT logged-in employee.
   *
   * Priority:
   * 1. Current portal header name
   * 2. Authentication name
   * 3. Authentication employee ID
   *
   * We do NOT blindly trust old localStorage employee_id.
   */
  useEffect(() => {
    if (
      !isEmployee ||
      directoryEmployees.length === 0
    ) {
      return;
    }

    const currentHeaderEmployee =
      findCurrentHeaderEmployee(
        directoryEmployees
      );

    const identity =
      getStoredIdentity();

    let matchedEmployee:
      | DirectoryEmployee
      | undefined;

    /*
     * 1. CURRENT HEADER
     *
     * This must win over stale storage.
     */
    if (currentHeaderEmployee) {
      matchedEmployee =
        currentHeaderEmployee;
    }

    /*
     * 2. AUTH NAME
     */
    if (
      !matchedEmployee &&
      identity.name
    ) {
      const authName =
        identity.name
          .trim()
          .toLowerCase();

      matchedEmployee =
        directoryEmployees.find(
          (employee) =>
            String(
              employee.name ?? ""
            )
              .trim()
              .toLowerCase() ===
            authName
        );
    }

    /*
     * 3. AUTH EMPLOYEE ID
     */
    if (
      !matchedEmployee &&
      identity.employeeId
    ) {
      matchedEmployee =
        directoryEmployees.find(
          (employee) =>
            normalizeEmployeeId(
              employee.employee_id
            ) ===
            normalizeEmployeeId(
              identity.employeeId
            )
        );
    }

    if (!matchedEmployee) {
      console.warn(
        "Attendance: current logged-in employee could not be resolved."
      );
      return;
    }

    const resolvedId =
      normalizeEmployeeId(
        matchedEmployee.employee_id
      );

    if (!resolvedId) {
      console.warn(
        "Attendance: invalid employee ID:",
        matchedEmployee.employee_id
      );
      return;
    }

    const resolvedName =
      String(
        matchedEmployee.name ??
          resolvedId
      ).trim();

    /*
     * Do not allow a previous employee's state to remain.
     */
    if (
      normalizeEmployeeId(employeeId) !==
      resolvedId
    ) {
      setEmployeeId(resolvedId);
    }

    if (
      employeeName !==
      resolvedName
    ) {
      setEmployeeName(
        resolvedName
      );
    }

    /*
     * Keep storage synchronized with the CURRENT user.
     */
    localStorage.setItem(
      "employee_id",
      resolvedId
    );

    sessionStorage.setItem(
      "employee_id",
      resolvedId
    );

    localStorage.setItem(
      "employee_name",
      resolvedName
    );

    sessionStorage.setItem(
      "employee_name",
      resolvedName
    );
  }, [
    isEmployee,
    directoryEmployees,
    employeeId,
    employeeName,
  ]);

  /*
   * Load only current employee's attendance.
   */
  useEffect(() => {
    if (
      !isEmployee ||
      !employeeId
    ) {
      return;
    }

    void fetchMyAttendance(
      employeeId
    );
  }, [
    isEmployee,
    employeeId,
    fetchMyAttendance,
  ]);

  /*
   * Employee records are filtered again on the client.
   * This is a second safety layer.
   */
  const employeeRecords =
    useMemo(() => {
      if (
        !isEmployee ||
        !employeeId
      ) {
        return [];
      }

      return records
        .filter(
          (record) =>
            normalizeEmployeeId(
              record.employee_id
            ) ===
            normalizeEmployeeId(
              employeeId
            )
        )
        .sort((a, b) =>
          String(
            b.attendance_date
          ).localeCompare(
            String(
              a.attendance_date
            )
          )
        );
    }, [
      records,
      employeeId,
      isEmployee,
    ]);

  const todayEmployeeRecord =
    useMemo(() => {
      return (
        employeeRecords.find(
          (record) =>
            String(
              record.attendance_date
            ).slice(0, 10) ===
            today
        ) ?? null
      );
    }, [
      employeeRecords,
      today,
    ]);

  const [attendanceDayClosed, setAttendanceDayClosed] =
    useState(false);

  useEffect(() => {
    const updateAttendanceWindow = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      setAttendanceDayClosed(
        now >= endOfDay
      );
    };

    updateAttendanceWindow();

    const timer = window.setInterval(
      updateAttendanceWindow,
      30 * 1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
   * Effective status shown in the employee UI.
   *
   * Existing backend record always wins.
   * If there is no record and today's attendance window
   * has closed, the employee is automatically treated as Absent.
   */
  const effectiveEmployeeStatus:
    AttendanceStatus | "" =
    todayEmployeeRecord?.status ??
    (attendanceDayClosed
      ? "absent"
      : "");

  // The currently selected form status must be used immediately in the UI.
  // This is important because an employee can select In-Office/WFH before
  // the record is saved; there is no backend record at that moment yet.
  const displayEmployeeStatus:
    AttendanceStatus | "" =
    employeeStatus || effectiveEmployeeStatus;

  /*
   * Sync today's form with backend.
   */
  useEffect(() => {
    if (!isEmployee) {
      return;
    }

    if (todayEmployeeRecord) {
      setEmployeeStatus(
        todayEmployeeRecord.status
      );

      setEmployeeCheckIn(
        todayEmployeeRecord.check_in ??
          ""
      );

      setEmployeeCheckOut(
        todayEmployeeRecord.check_out ??
          ""
      );

      // M2 integration: an attendance record created/updated from
      // an approved Leave Management record has source="m2-leave".
      setM2LeaveMatched(
        todayEmployeeRecord.status ===
          "on-leave" &&
        todayEmployeeRecord.source ===
          "m2-leave"
      );
    } else {
      setEmployeeStatus(
        attendanceDayClosed
          ? "absent"
          : ""
      );
      setEmployeeCheckIn("");
      setEmployeeCheckOut("");
      setM2LeaveMatched(false);
    }
  }, [
    isEmployee,
    todayEmployeeRecord,
    attendanceDayClosed,
  ]);

  const employeeMonthlySummary =
    useMemo(() => {
      const now = new Date();

      const year =
        now.getFullYear();

      const month =
        now.getMonth() + 1;

      const monthlyRecords =
        employeeRecords.filter(
          (record) => {
            const date =
              String(
                record.attendance_date
              ).slice(0, 10);

            const [recordYear, recordMonth] =
              date.split("-");

            return (
              Number(recordYear) ===
                year &&
              Number(recordMonth) ===
                month
            );
          }
        );

      return {
        present_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "in-office"
          ).length,

        wfh_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "wfh"
          ).length,

        leave_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "on-leave"
          ).length,

        absent_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "absent"
          ).length,
      };
    }, [employeeRecords]);

  const adminMonthlySummary =
    useMemo(() => {
      const now = new Date();

      const year =
        now.getFullYear();

      const month =
        now.getMonth() + 1;

      const monthlyRecords =
        records.filter(
          (record) => {
            const date =
              String(
                record.attendance_date
              ).slice(0, 10);

            const [recordYear, recordMonth] =
              date.split("-");

            return (
              Number(recordYear) ===
                year &&
              Number(recordMonth) ===
                month
            );
          }
        );

      return {
        present_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "in-office"
          ).length,

        wfh_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "wfh"
          ).length,

        leave_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "on-leave"
          ).length,

        absent_days:
          monthlyRecords.filter(
            (record) =>
              record.status ===
              "absent"
          ).length,
      };
    }, [records]);

  const employeeNames =
    useMemo(() => {
      return directoryEmployees.reduce<
        Record<string, string>
      >((acc, employee) => {
        const id =
          normalizeEmployeeId(
            employee.employee_id
          );

        if (id) {
          acc[id] =
            String(
              employee.name ??
                id
            );
        }

        return acc;
      }, {});
    }, [directoryEmployees]);

  const attendanceEmployees =
    useMemo(() => {
      return directoryEmployees.filter(
        (employee) => {
          const tier =
            String(
              employee.access_tier ??
                ""
            ).toLowerCase();

          return (
            tier === "employee" ||
            tier === "manager"
          );
        }
      );
    }, [directoryEmployees]);

  const filteredRecords =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return records;
      }

      return records.filter(
        (record) => {
          const employeeName =
            employeeNames[
              normalizeEmployeeId(
                record.employee_id
              )
            ] ?? "";

          return (
            String(
              record.employee_id
            )
              .toLowerCase()
              .includes(query) ||
            employeeName
              .toLowerCase()
              .includes(query) ||
            String(
              record.status
            )
              .toLowerCase()
              .includes(query) ||
            String(
              record.attendance_date
            )
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      records,
      search,
      employeeNames,
    ]);

  const handleEmployeeCheckIn =
    () => {
      if (
        employeeStatus !==
          "in-office" &&
        employeeStatus !== "wfh"
      ) {
        alert(
          "Please select In-Office or WFH before checking in."
        );
        return;
      }

      if (employeeCheckIn) {
        return;
      }

      setEmployeeCheckIn(
        getCurrentTime()
      );
    };

  const handleEmployeeCheckOut =
    () => {
      if (
        employeeStatus !==
          "in-office" &&
        employeeStatus !== "wfh"
      ) {
        alert(
          "Please select In-Office or WFH before checking out."
        );
        return;
      }

      if (!employeeCheckIn) {
        alert(
          "Please check in first."
        );
        return;
      }

      if (employeeCheckOut) {
        return;
      }

      setEmployeeCheckOut(
        getCurrentTime()
      );
    };

  const handleEmployeeAttendance =
    async () => {
      if (!employeeId) {
        alert(
          "Current logged-in employee could not be identified. Please log out and log in again."
        );
        return;
      }

      if (
        employeeStatus !== "in-office" &&
        employeeStatus !== "wfh"
      ) {
        return;
      }

      try {
        setEmployeeSaving(true);

        const latestRecords =
          await getEmployeeAttendance(
            employeeId
          );

        const latestTodayRecord =
          latestRecords.find(
            (record) =>
              normalizeEmployeeId(
                record.employee_id
              ) ===
                normalizeEmployeeId(
                  employeeId
                ) &&
              String(
                record.attendance_date
              ).slice(0, 10) ===
                today
          );

        const needsTime =
          employeeStatus ===
            "in-office" ||
          employeeStatus === "wfh";

        const data: AttendanceFormData =
          {
            employee_id:
              employeeId,

            attendance_date:
              today,

            status:
              employeeStatus,

            check_in: needsTime
              ? employeeCheckIn ||
                undefined
              : undefined,

            check_out: needsTime
              ? employeeCheckOut ||
                undefined
              : undefined,

            source: "manual",
          };

        let savedRecord:
          Attendance;

        if (
          latestTodayRecord
        ) {
          savedRecord =
            await updateAttendance(
              latestTodayRecord.id,
              data
            );
        } else {
          savedRecord =
            await createAttendance(
              data
            );
        }

        await fetchMyAttendance(
          employeeId
        );

        setEmployeeStatus(
          savedRecord.status
        );

        // M2 is the source of truth for On-Leave.
        // The M3 backend automatically changes the record to
        // on-leave and source="m2-leave" when approved leave exists.
        setM2LeaveMatched(
          savedRecord.status ===
            "on-leave" &&
          savedRecord.source ===
            "m2-leave"
        );

        setEmployeeCheckIn(
          savedRecord.check_in ??
            ""
        );

        setEmployeeCheckOut(
          savedRecord.check_out ??
            ""
        );

        alert(
          latestTodayRecord
            ? "Today's attendance updated successfully."
            : "Today's attendance saved successfully."
        );
      } catch (err: unknown) {
        console.error(
          "Failed to save today's attendance:",
          err
        );

        const axiosError =
          err as {
            response?: {
              data?: {
                detail?: unknown;
              };
            };
            message?: string;
          };

        const detail =
          axiosError.response?.data
            ?.detail;

        const message =
          typeof detail === "string"
            ? detail
            : axiosError.message ??
              "Unable to save today's attendance.";

        alert(
          `Attendance save failed: ${message}`
        );
      } finally {
        setEmployeeSaving(
          false
        );
      }
    };

  const handleAddAttendance =
    () => {
      setSelectedRecord(null);
      setModalOpen(true);
    };

  const handleEditAttendance =
    (record: Attendance) => {
      setSelectedRecord(record);
      setModalOpen(true);
    };

  const handleViewAttendance =
    (record: Attendance) => {
      setViewRecord(record);
    };

  const handleDeleteAttendance =
    async (id: number) => {
      const ok =
        window.confirm(
          "Delete attendance record?"
        );

      if (!ok) return;

      try {
        await removeAttendance(id);
        await fetchAttendance();
      } catch {
        // Hook already exposes the error.
      }
    };

  const handleSaveAttendance =
    async (
      data: AttendanceFormData
    ) => {
      try {
        if (selectedRecord) {
          await editAttendance(
            selectedRecord.id,
            data
          );
        } else {
          await markAttendance(
            data
          );
        }

        setModalOpen(false);
        setSelectedRecord(null);

        await fetchAttendance();
      } catch {
        // Hook handles the error.
      }
    };

  const handleExportAttendance =
    (
      exportRecords: Attendance[] =
        isEmployee
          ? employeeRecords
          : records
    ) => {
      if (
        exportRecords.length === 0
      ) {
        alert(
          "No attendance records available to export."
        );
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

      const rows =
        exportRecords.map(
          (record) => {
            const id =
              normalizeEmployeeId(
                record.employee_id
              );

            return [
              id,
              employeeNames[id] ??
                employeeName ??
                "Unknown",
              record.attendance_date,
              record.status,
              record.check_in ??
                "-",
              record.check_out ??
                "-",
              formatAttendanceSource(record.source),
            ];
          }
        );

      const csvContent = [
        headers,
        ...rows,
      ]
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        )
        .join("\n");

      const blob =
        new Blob(
          [csvContent],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `attendance-${getLocalDate()}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );
    };

  /*
   * ===========================
   * EMPLOYEE UI
   * ===========================
   */
  if (isEmployee) {
    return (
      <div className="attendance-page">
        <div className="attendance-header">
          <div>
            <div
              style={{
                color: "#ff6b00",
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              M3 · ATTENDANCE TRACKER
            </div>

            <h1>Attendance</h1>

            <p>
              Track your daily attendance
              and working hours.
            </p>
          </div>

          <div
            className="record-count"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Users size={18} />
            Employee
          </div>
        </div>

        <div
          className="attendance-table"
          style={{
            marginBottom: "24px",
            padding: "20px 24px",
            border:
              "1px solid #ffd8bf",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "20px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    "#94a3b8",
                  fontSize:
                    "12px",
                  fontWeight: 800,
                  letterSpacing:
                    "1px",
                }}
              >
                LOGGED IN AS
              </div>

              <div
                style={{
                  fontSize:
                    "18px",
                  fontWeight: 800,
                  marginTop:
                    "5px",
                }}
              >
                {employeeName ||
                  "Loading..."}
              </div>
            </div>

            <div>
              <div
                style={{
                  color:
                    "#94a3b8",
                  fontSize:
                    "12px",
                  fontWeight: 800,
                  letterSpacing:
                    "1px",
                }}
              >
                EMPLOYEE ID
              </div>

              <div
                style={{
                  fontSize:
                    "18px",
                  fontWeight: 800,
                  marginTop:
                    "5px",
                }}
              >
                {employeeId ||
                  "Loading..."}
              </div>
            </div>
          </div>
        </div>

        <div className="attendance-tabs">
          <button
            className={
              employeeTab ===
              "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setEmployeeTab(
                "dashboard"
              )
            }
          >
            <LayoutDashboard
              size={17}
            />
            Dashboard
          </button>

          <button
            className={
              employeeTab ===
              "attendance"
                ? "active"
                : ""
            }
            onClick={() =>
              setEmployeeTab(
                "attendance"
              )
            }
          >
            <ClipboardList
              size={17}
            />
            My Attendance
          </button>

          <button
            className={
              employeeTab ===
              "summary"
                ? "active"
                : ""
            }
            onClick={() =>
              setEmployeeTab(
                "summary"
              )
            }
          >
            <BarChart3
              size={17}
            />
            Monthly Summary
          </button>

          <button
            className={
              employeeTab ===
              "export"
                ? "active"
                : ""
            }
            onClick={() =>
              setEmployeeTab(
                "export"
              )
            }
          >
            <Download
              size={17}
            />
            Export
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {employeeTab ===
          "dashboard" && (
          <>
            <div
              style={{
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#172033",
                }}
              >
                Summary Cards
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Attendance summary for the current month.
              </p>
            </div>

            <div className="summary-grid">
              <div className="summary-card office">
                <div className="summary-icon">
                  <Briefcase
                    size={26}
                  />
                </div>

                <div>
                  <h3>
                    In Office
                  </h3>
                  <h2>
                    {
                      employeeMonthlySummary.present_days
                    }
                  </h2>
                  <p>
                    This month
                  </p>
                </div>
              </div>

              <div className="summary-card wfh">
                <div className="summary-icon">
                  <Home
                    size={26}
                  />
                </div>

                <div>
                  <h3>WFH</h3>
                  <h2>
                    {
                      employeeMonthlySummary.wfh_days
                    }
                  </h2>
                  <p>
                    This month
                  </p>
                </div>
              </div>

              <div className="summary-card leave">
                <div className="summary-icon">
                  <CalendarDays
                    size={26}
                  />
                </div>

                <div>
                  <h3>
                    On Leave
                  </h3>
                  <h2>
                    {
                      employeeMonthlySummary.leave_days
                    }
                  </h2>
                  <p>
                    This month
                  </p>
                </div>
              </div>

              <div className="summary-card absent">
                <div className="summary-icon">
                  <UserX
                    size={26}
                  />
                </div>

                <div>
                  <h3>
                    Absent
                  </h3>
                  <h2>
                    {
                      employeeMonthlySummary.absent_days
                    }
                  </h2>
                  <p>
                    This month
                  </p>
                </div>
              </div>
            </div>

            <div
              className="attendance-table"
              style={{
                marginTop:
                  "24px",
                padding:
                  "24px",
              }}
            >
              <div className="table-header">
                <div>
                  <h2>
                    Today's
                    Attendance
                  </h2>
                  <p>
                    Mark your attendance
                    for today.
                  </p>
                </div>

                <div className="record-count">
                  {todayEmployeeRecord
                    ? "Attendance Marked"
                    : "Not Marked"}
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "20px",
                  marginTop:
                    "20px",
                }}
              >
                <div>
                  <strong>
                    Date
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "8px",
                      padding:
                        "12px 14px",
                      background:
                        "#f8fafc",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "10px",
                      width:
                        "fit-content",
                    }}
                  >
                    {new Date(
                      `${today}T00:00:00`
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month:
                          "short",
                        year:
                          "numeric",
                      }
                    )}
                  </div>
                </div>

                <div>
                  <strong>
                    Attendance
                    Status
                  </strong>

                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap:
                        "10px",
                      marginTop:
                        "10px",
                    }}
                  >
                    {[
                      {
                        value:
                          "in-office" as const,
                        label:
                          "In-Office",
                        icon:
                          <Briefcase
                            size={
                              17
                            }
                          />,
                      },
                      {
                        value:
                          "wfh" as const,
                        label:
                          "WFH",
                        icon:
                          <Home
                            size={
                              17
                            }
                          />,
                      },
                      {
                        value:
                          "on-leave" as const,
                        label:
                          "On-Leave",
                        icon:
                          <CalendarDays
                            size={
                              17
                            }
                          />,
                      },
                      {
                        value:
                          "absent" as const,
                        label:
                          "Absent",
                        icon:
                          <UserX
                            size={
                              17
                            }
                          />,
                      },
                    ].map(
                      (
                        option
                      ) => {
                        const selected =
                          displayEmployeeStatus ===
                          option.value;

                        return (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            onClick={() => {
                              // Employees can manually mark only
                              // In-Office or WFH.
                              if (
                                option.value !== "in-office" &&
                                option.value !== "wfh"
                              ) {
                                return;
                              }

                              setEmployeeStatus(
                                option.value
                              );
                              setM2LeaveMatched(false);

                              // Start a fresh manual attendance entry when
                              // the user changes between In-Office and WFH.
                              if (!todayEmployeeRecord) {
                                setEmployeeCheckIn("");
                                setEmployeeCheckOut("");
                              }
                            }}
                            disabled={
                              option.value === "on-leave" ||
                              option.value === "absent"
                            }
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap:
                                "8px",
                              padding:
                                "11px 16px",
                              borderRadius:
                                "10px",
                              border:
                                selected
                                  ? "2px solid #ff6b00"
                                  : "1px solid #d9e2ec",
                              background:
                                selected
                                  ? "#fff4eb"
                                  : "#fff",
                              color:
                                selected
                                  ? "#ff6b00"
                                  : "#475569",
                              fontWeight:
                                selected
                                  ? 700
                                  : 600,
                              cursor:
                                option.value === "on-leave" ||
                                option.value === "absent"
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                option.value === "on-leave" ||
                                option.value === "absent"
                                  ? 0.55
                                  : 1,
                            }}
                          >
                            {
                              option.icon
                            }
                            {
                              option.label
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* M2 Leave Management integration message */}
                {displayEmployeeStatus === "on-leave" && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#fff8e1",
                      border: "1px solid #f6d365",
                      color: "#7c5a00",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {m2LeaveMatched
                      ? "On-Leave is automatically populated from an approved Leave Management record for today."
                      : "On-Leave is controlled by approved Leave Management records (M2)."}
                  </div>
                )}

                {/* Automatic Absent guidance message */}
                {displayEmployeeStatus === "absent" && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      color: "#9f1239",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Absent:</strong> No attendance was marked and no
                    approved leave was recorded for today. After the attendance
                    window closes, the day is treated as Absent automatically.
                    You do not need to save Absent manually.
                  </div>
                )}

                {(displayEmployeeStatus ===
                  "in-office" ||
                  displayEmployeeStatus ===
                    "wfh") && (
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(240px,1fr))",
                      gap:
                        "16px",
                    }}
                  >
                    <div>
                      <label>
                        Check In
                      </label>

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "10px",
                          marginTop:
                            "8px",
                        }}
                      >
                        <div
                          style={{
                            flex:
                              1,
                            minHeight:
                              "46px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            padding:
                              "0 14px",
                            border:
                              "1px solid #d9e2ec",
                            borderRadius:
                              "10px",
                            background:
                              "#f8fafc",
                            fontWeight:
                              600,
                          }}
                        >
                          {formatTimeForDisplay(
                            employeeCheckIn
                          )}
                        </div>

                        <button
                          type="button"
                          className="add-btn"
                          onClick={
                            handleEmployeeCheckIn
                          }
                          disabled={
                            Boolean(
                              employeeCheckIn
                            ) ||
                            employeeSaving
                          }
                        >
                          {employeeCheckIn
                            ? "Checked In"
                            : "Check In"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label>
                        Check Out
                      </label>

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "10px",
                          marginTop:
                            "8px",
                        }}
                      >
                        <div
                          style={{
                            flex:
                              1,
                            minHeight:
                              "46px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            padding:
                              "0 14px",
                            border:
                              "1px solid #d9e2ec",
                            borderRadius:
                              "10px",
                            background:
                              "#f8fafc",
                            fontWeight:
                              600,
                          }}
                        >
                          {formatTimeForDisplay(
                            employeeCheckOut
                          )}
                        </div>

                        <button
                          type="button"
                          className="add-btn"
                          onClick={
                            handleEmployeeCheckOut
                          }
                          disabled={
                            !employeeCheckIn ||
                            Boolean(
                              employeeCheckOut
                            ) ||
                            employeeSaving
                          }
                        >
                          {employeeCheckOut
                            ? "Checked Out"
                            : "Check Out"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
                    className="add-btn"
                    onClick={
                      handleEmployeeAttendance
                    }
                    disabled={
                      !employeeId ||
                      employeeSaving ||
                      (
                        employeeStatus !== "in-office" &&
                        employeeStatus !== "wfh"
                      )
                    }
                  >
                    {employeeSaving
                      ? "Saving..."
                      : todayEmployeeRecord
                      ? "Save Today's Attendance"
                      : "Save Attendance"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {employeeTab ===
          "attendance" && (
          <div className="attendance-table">
            <div className="table-header">
              <div>
                <h2>
                  My Attendance
                </h2>
                <p>
                  Only {employeeName || "your"} attendance is shown here.
                </p>
              </div>

              <div className="record-count">
                {
                  employeeRecords.length
                } Records
              </div>
            </div>

            {employeeRecords.length ===
            0 ? (
              <div
                style={{
                  padding:
                    "30px",
                  textAlign:
                    "center",
                  color:
                    "#64748b",
                }}
              >
                No attendance
                records found.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Date
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Check In
                      </th>
                      <th>
                        Check Out
                      </th>
                      <th>
                        Source
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {employeeRecords.map(
                      (
                        record
                      ) => (
                        <tr
                          key={
                            record.id
                          }
                        >
                          <td>
                            {new Date(
                              `${record.attendance_date}T00:00:00`
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month:
                                  "short",
                                year:
                                  "numeric",
                              }
                            )}
                          </td>

                          <td>
                            {record.status ===
                            "in-office"
                              ? "Present"
                              : record.status ===
                                "wfh"
                              ? "WFH"
                              : record.status ===
                                "on-leave"
                              ? "On Leave"
                              : "Absent"}
                          </td>

                          <td>
                            {formatTimeForDisplay(
                              record.check_in
                            )}
                          </td>

                          <td>
                            {formatTimeForDisplay(
                              record.check_out
                            )}
                          </td>

                          <td>
                            {formatAttendanceSource(record.source)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {employeeTab ===
          "summary" && (
          <div className="attendance-table">
            <div className="table-header">
              <div>
                <h2>
                  Monthly
                  Summary
                </h2>
                <p>
                  Your current
                  month's attendance
                  summary.
                </p>
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-card office">
                <h3>
                  Present Days
                </h3>
                <h2>
                  {
                    employeeMonthlySummary.present_days
                  }
                </h2>
              </div>

              <div className="summary-card wfh">
                <h3>
                  WFH Days
                </h3>
                <h2>
                  {
                    employeeMonthlySummary.wfh_days
                  }
                </h2>
              </div>

              <div className="summary-card leave">
                <h3>
                  Leave Days
                </h3>
                <h2>
                  {
                    employeeMonthlySummary.leave_days
                  }
                </h2>
              </div>

              <div className="summary-card absent">
                <h3>
                  Absent Days
                </h3>
                <h2>
                  {
                    employeeMonthlySummary.absent_days
                  }
                </h2>
              </div>
            </div>
          </div>
        )}

        {employeeTab ===
          "export" && (
          <div className="attendance-table">
            <div className="table-header">
              <div>
                <h2>
                  Export Attendance
                </h2>
                <p>
                  Export only your attendance
                  records.
                </p>
              </div>

              <button
                className="export-btn"
                onClick={() =>
                  handleExportAttendance(
                    employeeRecords
                  )
                }
              >
                <Download
                  size={18}
                />
                Export My Attendance
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
   * ===========================
   * ADMIN / MANAGER UI
   * ===========================
   */

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1>Attendance</h1>
          <p>
            Manage employee attendance,
            reports and monthly summary
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isManager && (
        <>
          <div className="attendance-tabs">
            <button
              className={
                managerTab ===
                "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setManagerTab(
                  "dashboard"
                )
              }
            >
              Dashboard
            </button>

            <button
              className={
                managerTab ===
                "team"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setManagerTab(
                  "team"
                )
              }
            >
              Team Attendance
            </button>

            <button
              className={
                managerTab ===
                "summary"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setManagerTab(
                  "summary"
                )
              }
            >
              Monthly Summary
            </button>

            <button
              className={
                managerTab ===
                "absence"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setManagerTab(
                  "absence"
                )
              }
            >
              Unexplained Absences
            </button>

            <button
              className={
                managerTab ===
                "export"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setManagerTab(
                  "export"
                )
              }
            >
              Export
            </button>
          </div>

          {managerTab ===
            "dashboard" && (
            <>
              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#172033",
                  }}
                >
                  Summary Cards
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Attendance summary for the current month.
                </p>
              </div>
  
              <div className="summary-grid">

              <div className="summary-card office">
                <Briefcase
                  size={26}
                />
                <h3>
                  In Office
                </h3>
                <h2>
                  {
                    adminMonthlySummary.present_days
                  }
                </h2>
              </div>

              <div className="summary-card wfh">
                <Home size={26} />
                <h3>WFH</h3>
                <h2>
                  {
                    adminMonthlySummary.wfh_days
                  }
                </h2>
              </div>

              <div className="summary-card leave">
                <CalendarDays
                  size={26}
                />
                <h3>
                  On Leave
                </h3>
                <h2>
                  {
                    adminMonthlySummary.leave_days
                  }
                </h2>
              </div>

              <div className="summary-card absent">
                <UserX
                  size={26}
                />
                <h3>Absent</h3>
                <h2>
                  {
                    adminMonthlySummary.absent_days
                  }
                </h2>
              </div>
            </div>
            </>
          )}

          {managerTab ===
            "team" && (
            <TeamAttendance
              teamId={teamId}
            />
          )}

          {managerTab ===
            "summary" && (
            <div className="attendance-table">
              <div className="table-header">
                <h2>
                  Monthly Summary
                </h2>
              </div>

              <div className="summary-grid">
                <div className="summary-card office">
                  <h3>
                    Present Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.present_days
                    }
                  </h2>
                </div>

                <div className="summary-card wfh">
                  <h3>
                    WFH Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.wfh_days
                    }
                  </h2>
                </div>

                <div className="summary-card leave">
                  <h3>
                    Leave Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.leave_days
                    }
                  </h2>
                </div>

                <div className="summary-card absent">
                  <h3>
                    Absent Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.absent_days
                    }
                  </h2>
                </div>
              </div>
            </div>
          )}

          {managerTab ===
            "absence" && (
            <UnexplainedAbsences />
          )}

          {managerTab ===
            "export" && (
            <button
              className="export-btn"
              onClick={() =>
                handleExportAttendance()
              }
            >
              <Download
                size={18}
              />
              Export Attendance
            </button>
          )}
        </>
      )}

      {isAdmin && (
        <>
          <div className="attendance-tabs">
            <button
              className={
                adminTab ===
                "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAdminTab(
                  "dashboard"
                )
              }
            >
              Dashboard
            </button>

            <button
              className={
                adminTab ===
                "records"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAdminTab(
                  "records"
                )
              }
            >
              Attendance Records
            </button>

            <button
              className={
                adminTab ===
                "summary"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAdminTab(
                  "summary"
                )
              }
            >
              Monthly Summary
            </button>

            <button
              className={
                adminTab ===
                "absence"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAdminTab(
                  "absence"
                )
              }
            >
              Unexplained Absences
            </button>

            <button
              className={
                adminTab ===
                "export"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAdminTab(
                  "export"
                )
              }
            >
              Export
            </button>
          </div>

          {adminTab ===
            "dashboard" && (
            <>
              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#172033",
                  }}
                >
                  Summary Cards
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Attendance summary for the current month.
                </p>
              </div>
  
              <div className="summary-grid">

              <div className="summary-card office">
                <Briefcase
                  size={26}
                />
                <h3>
                  In Office
                </h3>
                <h2>
                  {
                    adminMonthlySummary.present_days
                  }
                </h2>
              </div>

              <div className="summary-card wfh">
                <Home size={26} />
                <h3>WFH</h3>
                <h2>
                  {
                    adminMonthlySummary.wfh_days
                  }
                </h2>
              </div>

              <div className="summary-card leave">
                <CalendarDays
                  size={26}
                />
                <h3>
                  On Leave
                </h3>
                <h2>
                  {
                    adminMonthlySummary.leave_days
                  }
                </h2>
              </div>

              <div className="summary-card absent">
                <UserX
                  size={26}
                />
                <h3>Absent</h3>
                <h2>
                  {
                    adminMonthlySummary.absent_days
                  }
                </h2>
              </div>
            </div>
            </>
          )}

          {adminTab ===
            "records" && (
            <>
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
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div className="toolbar-buttons">
                  <button
                    className="export-btn"
                    onClick={() =>
                      handleExportAttendance()
                    }
                  >
                    <Download
                      size={18}
                    />
                    Export Attendance
                  </button>

                  <button
                    className="add-btn"
                    onClick={
                      handleAddAttendance
                    }
                  >
                    <Plus
                      size={18}
                    />
                    Add Attendance
                  </button>
                </div>
              </div>

              <div className="attendance-table">
                <div className="table-header">
                  <div>
                    <h2>
                      Attendance
                      Records
                    </h2>
                    <p>
                      Employee attendance
                      history
                    </p>
                  </div>

                  <div className="record-count">
                    {
                      filteredRecords.length
                    } Records
                  </div>
                </div>

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
                          Status
                        </th>
                        <th>
                          Check In
                        </th>
                        <th>
                          Check Out
                        </th>
                        <th>
                          Source
                        </th>
                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={
                              8
                            }
                            className="empty-state"
                          >
                            No attendance
                            records found.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map(
                          (
                            record
                          ) => (
                            <tr
                              key={
                                record.id
                              }
                            >
                              <td>
                                {
                                  record.employee_id
                                }
                              </td>

                              <td>
                                {
                                  employeeNames[
                                    normalizeEmployeeId(
                                      record.employee_id
                                    )
                                  ] ??
                                  "Unknown Employee"
                                }
                              </td>

                              <td>
                                {new Date(
                                  `${record.attendance_date}T00:00:00`
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month:
                                      "short",
                                    year:
                                      "numeric",
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
                                  {
                                    record.status
                                  }
                                </span>
                              </td>

                              <td>
                                {formatTimeForDisplay(
                                  record.check_in
                                )}
                              </td>

                              <td>
                                {formatTimeForDisplay(
                                  record.check_out
                                )}
                              </td>

                              <td>
                                {formatAttendanceSource(record.source)}
                              </td>

                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="view-btn"
                                    title="View"
                                    onClick={() =>
                                      handleViewAttendance(
                                        record
                                      )
                                    }
                                  >
                                    <Eye
                                      size={
                                        16
                                      }
                                    />
                                  </button>

                                  <button
                                    className="edit-btn"
                                    title="Edit"
                                    onClick={() =>
                                      handleEditAttendance(
                                        record
                                      )
                                    }
                                  >
                                    <Pencil
                                      size={
                                        16
                                      }
                                    />
                                  </button>

                                  <button
                                    className="delete-btn"
                                    title="Delete"
                                    onClick={() =>
                                      handleDeleteAttendance(
                                        record.id
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={
                                        16
                                      }
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminTab ===
            "summary" && (
            <div className="attendance-table">
              <div className="table-header">
                <h2>
                  Monthly Summary
                </h2>
              </div>

              <div className="summary-grid">
                <div className="summary-card office">
                  <h3>
                    Present Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.present_days
                    }
                  </h2>
                </div>

                <div className="summary-card wfh">
                  <h3>
                    WFH Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.wfh_days
                    }
                  </h2>
                </div>

                <div className="summary-card leave">
                  <h3>
                    Leave Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.leave_days
                    }
                  </h2>
                </div>

                <div className="summary-card absent">
                  <h3>
                    Absent Days
                  </h3>
                  <h2>
                    {
                      adminMonthlySummary.absent_days
                    }
                  </h2>
                </div>
              </div>
            </div>
          )}

          {adminTab ===
            "absence" && (
            <UnexplainedAbsences />
          )}

          {adminTab ===
            "export" && (
            <div className="attendance-table">
              <div className="table-header">
                <div>
                  <h2>
                    Export Attendance
                  </h2>
                  <p>
                    Export all employee
                    attendance records.
                  </p>
                </div>

                <button
                  className="export-btn"
                  onClick={() =>
                    handleExportAttendance()
                  }
                >
                  <Download
                    size={18}
                  />
                  Export Attendance
                </button>
              </div>
            </div>
          )}

          {viewRecord && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="attendance-view-title"
              onClick={() => setViewRecord(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "rgba(15, 23, 42, 0.45)",
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(560px, 100%)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.25)",
                  padding: "28px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <h2
                      id="attendance-view-title"
                      style={{
                        margin: 0,
                        fontSize: "24px",
                        fontWeight: 800,
                        color: "#172033",
                      }}
                    >
                      Attendance Details
                    </h2>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: "14px",
                      }}
                    >
                      View attendance record details.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewRecord(null)}
                    aria-label="Close attendance details"
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "22px",
                      lineHeight: 1,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  {[
                    [
                      "Employee ID",
                      viewRecord.employee_id,
                    ],
                    [
                      "Employee Name",
                      employeeNames[
                        normalizeEmployeeId(
                          viewRecord.employee_id
                        )
                      ] ?? "Unknown Employee",
                    ],
                    [
                      "Date",
                      new Date(
                        `${viewRecord.attendance_date}T00:00:00`
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }),
                    ],
                    [
                      "Status",
                      viewRecord.status === "in-office"
                        ? "In-Office"
                        : viewRecord.status === "wfh"
                        ? "WFH"
                        : viewRecord.status === "on-leave"
                        ? "On Leave"
                        : "Absent",
                    ],
                    [
                      "Check In",
                      formatTimeForDisplay(
                        viewRecord.check_in
                      ),
                    ],
                    [
                      "Check Out",
                      formatTimeForDisplay(
                        viewRecord.check_out
                      ),
                    ],
                    [
                      "Source",
                      formatAttendanceSource(
                        viewRecord.source
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: "14px 16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        background: "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          marginBottom: "6px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          color: "#172033",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => setViewRecord(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <AttendanceModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedRecord(
                null
              );
            }}
            onSave={
              handleSaveAttendance
            }
            record={
              selectedRecord
            }
            loading={loading}
            employeeId=""
            employees={
              attendanceEmployees
            }
          />
        </>
      )}
    </div>
  );
};

export default AttendanceModulePage;