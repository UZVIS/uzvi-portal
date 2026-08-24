

// const API_BASE = "/utilization";
// const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

// function authHeaders(): HeadersInit {
//   const employeeId = localStorage.getItem(
//     EMPLOYEE_ID_STORAGE_KEY
//   );

//   return employeeId
//     ? { "X-Employee-Id": employeeId }
//     : {};
// }

// /* =========================================================
//    EMPLOYEE
// ========================================================= */

// export interface TimeEntryEmployee {
//   employee_id: string;
//   name: string;
//   designation: string | null;
//   manager_id: string | null;
//   access_tier: string;
// }

// /* =========================================================
//    PROJECT
// ========================================================= */

// export interface Project {
//   project_id: string;
//   name: string;
//   project_type: string;
//   billing_rate?: number | null;
//   cost_rate?: number | null;
// }

// export interface ProjectInput {
//   project_id: string;
//   name: string;
//   project_type: string;
//   billing_rate?: number | null;
//   cost_rate?: number | null;
// }

// /* =========================================================
//    TIME ENTRY
// ========================================================= */

// export interface TimeEntryInput {
//   entry_id: string;
//   employee_id: string;
//   project_id: string;
//   date: string;
//   hours: number;
//   billable_flag: boolean;
//   source?: string;
//   notes?: string;
// }

// export type OTStatus =
//   | "Pending"
//   | "Approved"
//   | "Rejected"
//   | null;

// export interface TimeEntry {
//   entry_id: string;
//   employee_id: string;
//   project_id: string;
//   date: string;
//   hours: number;
//   billable_flag: boolean;
//   source: string;
//   notes?: string | null;

//   normal_hours: number;
//   overtime_hours: number;

//   ot_status: OTStatus;
//   ot_decided_by_role?: string | null;
//   ot_decided_at?: string | null;
// }

// /* =========================================================
//    UTILIZATION
// ========================================================= */

// export interface UtilizationSummary {
//   employee_id: string;
//   period_start: string;
//   period_end: string;
//   billable_hours: number;
//   available_hours: number;
//   utilization_pct: number;
//   flag:
//     | "under_utilized"
//     | "over_allocated"
//     | null;
// }

// export interface PersonalDashboard {
//   summary: UtilizationSummary;
//   hours_by_project: Record<string, number>;
//   weekly_trend: Record<string, number>;
// }

// export interface ProjectMargin {
//   project_id: string;
//   project_name: string;
//   revenue: number;
//   cost: number;
//   margin: number;
//   margin_pct: number | null;
// }

// export interface OrgUtilizationDashboard {
//   period_start: string;
//   period_end: string;
//   utilization_by_employee: UtilizationSummary[];
//   bench_risk: string[];
//   over_allocated: string[];
//   project_margins: ProjectMargin[];
// }

// /* =========================================================
//    ERROR HANDLING
// ========================================================= */

// function extractErrorMessage(
//   rawBody: string,
//   status: number,
//   path: string
// ): string {
//   try {
//     const parsed = JSON.parse(rawBody);
//     const detail = parsed?.detail;

//     if (
//       Array.isArray(detail) &&
//       detail.length > 0
//     ) {
//       const rawMsg: string =
//         detail[0].msg || "";

//       return (
//         rawMsg.replace(
//           /^Value error,\s*/,
//           ""
//         ) ||
//         `Request to ${path} failed (${status})`
//       );
//     }

//     if (typeof detail === "string") {
//       return detail;
//     }
//   } catch {
//     // Response body was not valid JSON.
//   }

//   return `Request to ${path} failed (${status})`;
// }

// /* =========================================================
//    GENERIC REQUEST
// ========================================================= */

// async function request<T>(
//   path: string,
//   options?: RequestInit
// ): Promise<T> {
//   const res = await fetch(
//     `${API_BASE}${path}`,
//     {
//       headers: {
//         "Content-Type": "application/json",
//         ...authHeaders(),
//       },
//       ...options,
//     }
//   );

//   if (!res.ok) {
//     const body = await res
//       .text()
//       .catch(() => "");

//     throw new Error(
//       extractErrorMessage(
//         body,
//         res.status,
//         path
//       )
//     );
//   }

//   return res.json() as Promise<T>;
// }

// /* =========================================================
//    UTILIZATION API
// ========================================================= */

// export const utilizationApi = {

//   /* -------------------------------------------------------
//      PROJECTS
//   ------------------------------------------------------- */

//   listProjects: () =>
//     request<Project[]>("/projects"),

//   createProject: (
//     data: ProjectInput
//   ) =>
//     request<Project>(
//       "/projects",
//       {
//         method: "POST",
//         body: JSON.stringify(data),
//       }
//     ),

//   /* -------------------------------------------------------
//      EMPLOYEES WHO CAN LOG HOURS FOR
     
//      Example:
     
//      Admin1
//        └── E4

//      E4
//        └── E8

//      Admin1 sees: Admin1 + E4
//      E4 sees:     E4 + E8
//      E8 sees:     E8
//   ------------------------------------------------------- */

//   listTimeEntryEmployees: () =>
//     request<TimeEntryEmployee[]>(
//       "/time-entry-employees"
//     ),

//   /* -------------------------------------------------------
//      CREATE TIME ENTRY
//   ------------------------------------------------------- */

//   createTimeEntry: (
//     data: TimeEntryInput
//   ) =>
//     request<TimeEntry>(
//       "/time-entries",
//       {
//         method: "POST",
//         body: JSON.stringify({
//           source: "manual",
//           ...data,
//         }),
//       }
//     ),

//   /* -------------------------------------------------------
//      LIST TIME ENTRIES
//   ------------------------------------------------------- */

//   listTimeEntries: (
//     employeeId: string,
//     startDate?: string,
//     endDate?: string
//   ) => {

//     const params =
//       new URLSearchParams({
//         employee_id: employeeId,
//       });

//     if (startDate) {
//       params.set(
//         "start_date",
//         startDate
//       );
//     }

//     if (endDate) {
//       params.set(
//         "end_date",
//         endDate
//       );
//     }

//     return request<TimeEntry[]>(
//       `/time-entries?${params.toString()}`
//     );
//   },

//   /* -------------------------------------------------------
//      OT APPROVALS
//   ------------------------------------------------------- */

//   listPendingOT: () =>
//     request<TimeEntry[]>(
//       "/time-entries/pending-ot"
//     ),

//   approveOT: (
//     entryId: string
//   ) =>
//     request<TimeEntry>(
//       `/time-entries/${encodeURIComponent(
//         entryId
//       )}/approve-ot`,
//       {
//         method: "POST",
//       }
//     ),

//   rejectOT: (
//     entryId: string
//   ) =>
//     request<TimeEntry>(
//       `/time-entries/${encodeURIComponent(
//         entryId
//       )}/reject-ot`,
//       {
//         method: "POST",
//       }
//     ),

//   /* -------------------------------------------------------
//      PERSONAL DASHBOARD
//   ------------------------------------------------------- */

//   getPersonalDashboard: (
//     employeeId: string,
//     startDate: string,
//     endDate: string
//   ) =>
//     request<PersonalDashboard>(
//       `/dashboard/employee/${encodeURIComponent(
//         employeeId
//       )}?start_date=${startDate}&end_date=${endDate}`
//     ),

//   /* -------------------------------------------------------
//      PROJECT MARGIN
//   ------------------------------------------------------- */

//   getProjectMargin: (
//     projectId: string
//   ) =>
//     request<ProjectMargin>(
//       `/projects/${encodeURIComponent(
//         projectId
//       )}/margin`
//     ),

//   /* -------------------------------------------------------
//      ORG DASHBOARD
//   ------------------------------------------------------- */

//   getOrgDashboard: (
//     startDate: string,
//     endDate: string,
//     capacityHoursPerWeek?: number
//   ) =>
//     request<OrgUtilizationDashboard>(
//       `/dashboard/org?start_date=${startDate}&end_date=${endDate}` +
//         (
//           capacityHoursPerWeek
//             ? `&capacity_hours_per_week=${capacityHoursPerWeek}`
//             : ""
//         )
//     ),
// };


const API_BASE = "/utilization";

const EMPLOYEE_ID_STORAGE_KEY =
  "uzvi_portal_employee_id";


// =========================================================
// AUTH HEADERS
// =========================================================

function authHeaders(): HeadersInit {
  const employeeId =
    localStorage.getItem(
      EMPLOYEE_ID_STORAGE_KEY
    );

  return employeeId
    ? {
        "X-Employee-Id": employeeId,
      }
    : {};
}


// =========================================================
// EMPLOYEE
// =========================================================

export interface TimeEntryEmployee {
  employee_id: string;
  name: string;
  designation: string | null;
  manager_id: string | null;
  access_tier: string;
}


// =========================================================
// PROJECT
// =========================================================

export interface Project {
  project_id: string;
  name: string;
  project_type: string;
  billing_rate?: number | null;
  cost_rate?: number | null;
}

export interface ProjectInput {
  project_id: string;
  name: string;
  project_type: string;
  billing_rate?: number | null;
  cost_rate?: number | null;
}


// =========================================================
// TIME ENTRY INPUT
// =========================================================

export interface TimeEntryInput {
  entry_id: string;

  employee_id: string;

  project_id: string;

  date: string;

  hours: number;

  billable_flag: boolean;

  source?: string;

  notes?: string;
}


// =========================================================
// OT STATUS
// =========================================================

export type OTStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | null;


// =========================================================
// TIME ENTRY
// =========================================================

export interface TimeEntry {
  entry_id: string;

  employee_id: string;

  project_id: string;

  date: string;

  hours: number;

  billable_flag: boolean;

  source: string;

  notes?: string | null;

  normal_hours: number;

  overtime_hours: number;

  ot_status: OTStatus;

  // Role of the person who approved/rejected OT
  ot_decided_by_role?: string | null;

  // Name of the person who approved/rejected OT
  ot_decided_by_name?: string | null;

  // Date/time when OT was approved/rejected
  ot_decided_at?: string | null;
}


// =========================================================
// UTILIZATION
// =========================================================

export interface UtilizationSummary {
  employee_id: string;

  period_start: string;

  period_end: string;

  billable_hours: number;

  available_hours: number;

  utilization_pct: number;

  flag:
    | "under_utilized"
    | "over_allocated"
    | null;
}


export interface PersonalDashboard {
  summary: UtilizationSummary;

  hours_by_project: Record<
    string,
    number
  >;

  weekly_trend: Record<
    string,
    number
  >;
}


// =========================================================
// PROJECT MARGIN
// =========================================================

export interface ProjectMargin {
  project_id: string;

  project_name: string;

  revenue: number;

  cost: number;

  margin: number;

  margin_pct: number | null;
}


// =========================================================
// ORG UTILIZATION
// =========================================================

export interface OrgUtilizationDashboard {
  period_start: string;

  period_end: string;

  utilization_by_employee:
    UtilizationSummary[];

  bench_risk: string[];

  over_allocated: string[];

  project_margins: ProjectMargin[];
}


// =========================================================
// ERROR HANDLING
// =========================================================

function extractErrorMessage(
  rawBody: string,
  status: number,
  path: string
): string {
  try {
    const parsed = JSON.parse(
      rawBody
    );

    const detail = parsed?.detail;

    if (
      Array.isArray(detail) &&
      detail.length > 0
    ) {
      const rawMsg: string =
        detail[0].msg || "";

      return (
        rawMsg.replace(
          /^Value error,\s*/,
          ""
        ) ||
        `Request to ${path} failed (${status})`
      );
    }

    if (
      typeof detail === "string"
    ) {
      return detail;
    }
  } catch {
    // Response body was not valid JSON.
  }

  return `Request to ${path} failed (${status})`;
}


// =========================================================
// GENERIC REQUEST
// =========================================================

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {

  const res = await fetch(
    `${API_BASE}${path}`,
    {
      headers: {
        "Content-Type":
          "application/json",

        ...authHeaders(),
      },

      ...options,
    }
  );


  if (!res.ok) {

    const body =
      await res
        .text()
        .catch(() => "");

    throw new Error(
      extractErrorMessage(
        body,
        res.status,
        path
      )
    );
  }


  // IMPORTANT:
  // Keep "as Promise<T>" on the same line.
  return res.json() as Promise<T>;
}


// =========================================================
// UTILIZATION API
// =========================================================

export const utilizationApi = {

  // =======================================================
  // PROJECTS
  // =======================================================

  listProjects: () =>
    request<Project[]>(
      "/projects"
    ),


  createProject: (
    data: ProjectInput
  ) =>
    request<Project>(
      "/projects",
      {
        method: "POST",

        body: JSON.stringify(
          data
        ),
      }
    ),


  // =======================================================
  // EMPLOYEES WHO CAN LOG HOURS
  // =======================================================

  listTimeEntryEmployees: () =>
    request<TimeEntryEmployee[]>(
      "/time-entry-employees"
    ),


  // =======================================================
  // CREATE TIME ENTRY
  // =======================================================

  createTimeEntry: (
    data: TimeEntryInput
  ) =>
    request<TimeEntry>(
      "/time-entries",
      {
        method: "POST",

        body: JSON.stringify({
          source: "manual",
          ...data,
        }),
      }
    ),


  // =======================================================
  // LIST TIME ENTRIES
  // =======================================================

  listTimeEntries: (
    employeeId: string,
    startDate?: string,
    endDate?: string
  ) => {

    const params =
      new URLSearchParams({
        employee_id:
          employeeId,
      });


    if (startDate) {

      params.set(
        "start_date",
        startDate
      );
    }


    if (endDate) {

      params.set(
        "end_date",
        endDate
      );
    }


    return request<TimeEntry[]>(
      `/time-entries?${params.toString()}`
    );
  },


  // =======================================================
  // OT APPROVALS
  // =======================================================

  listPendingOT: () =>
    request<TimeEntry[]>(
      "/time-entries/pending-ot"
    ),


  approveOT: (
    entryId: string
  ) =>
    request<TimeEntry>(
      `/time-entries/${encodeURIComponent(
        entryId
      )}/approve-ot`,
      {
        method: "POST",
      }
    ),


  rejectOT: (
    entryId: string
  ) =>
    request<TimeEntry>(
      `/time-entries/${encodeURIComponent(
        entryId
      )}/reject-ot`,
      {
        method: "POST",
      }
    ),


  // =======================================================
  // PERSONAL DASHBOARD
  // =======================================================

  getPersonalDashboard: (
    employeeId: string,
    startDate: string,
    endDate: string
  ) =>
    request<PersonalDashboard>(
      `/dashboard/employee/${encodeURIComponent(
        employeeId
      )}?start_date=${startDate}&end_date=${endDate}`
    ),


  // =======================================================
  // PROJECT MARGIN
  // =======================================================

  getProjectMargin: (
    projectId: string
  ) =>
    request<ProjectMargin>(
      `/projects/${encodeURIComponent(
        projectId
      )}/margin`
    ),


  // =======================================================
  // ORG DASHBOARD
  // =======================================================

  getOrgDashboard: (
    startDate: string,
    endDate: string,
    capacityHoursPerWeek?: number
  ) =>
    request<OrgUtilizationDashboard>(
      `/dashboard/org?start_date=${startDate}&end_date=${endDate}` +
        (
          capacityHoursPerWeek
            ? `&capacity_hours_per_week=${capacityHoursPerWeek}`
            : ""
        )
    ),
};