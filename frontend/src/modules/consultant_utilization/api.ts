
// const API_BASE = "/utilization";

// export interface Project {
//   project_id: string;
//   name: string;
//   project_type: string; // real project | Bench | Training | Internal | BD/Presales | Leave
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

// export interface TimeEntryInput {
//   entry_id: string;
//   employee_id: string;
//   project_id: string;
//   date: string; // YYYY-MM-DD
//   hours: number;
//   billable_flag: boolean;
//   source?: string; // manual | import
//   notes?: string;
// }

// export interface TimeEntry {
//   entry_id: string;
//   employee_id: string;
//   project_id: string;
//   date: string;
//   hours: number;
//   billable_flag: boolean;
//   source: string;
//   notes?: string | null;
// }

// export interface UtilizationSummary {
//   employee_id: string;
//   period_start: string;
//   period_end: string;
//   billable_hours: number;
//   available_hours: number;
//   utilization_pct: number;
//   flag: "under_utilized" | "over_allocated" | null;
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

// function extractErrorMessage(rawBody: string, status: number, path: string): string {
//   try {
//     const parsed = JSON.parse(rawBody);
//     const detail = parsed?.detail;

//     if (Array.isArray(detail) && detail.length > 0) {
//       const rawMsg: string = detail[0].msg || "";
//       return rawMsg.replace(/^Value error,\s*/, "") || `Request to ${path} failed (${status})`;
//     }
//     if (typeof detail === "string") {
//       return detail;
//     }
//   } catch {
//     // body wasn't valid JSON - fall through to generic message
//   }
//   return `Request to ${path} failed (${status})`;
// }

// async function request<T>(path: string, options?: RequestInit): Promise<T> {
//   const res = await fetch(`${API_BASE}${path}`, {
//     headers: { "Content-Type": "application/json" },
//     ...options,
//   });
//   if (!res.ok) {
//     const body = await res.text().catch(() => "");
//     throw new Error(extractErrorMessage(body, res.status, path));
//   }
//   return res.json() as Promise<T>;
// }

// export const utilizationApi = {
//   listProjects: () => request<Project[]>("/projects"),

//   createProject: (data: ProjectInput) =>
//     request<Project>("/projects", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),

//   createTimeEntry: (data: TimeEntryInput) =>
//     request<TimeEntryInput>("/time-entries", {
//       method: "POST",
//       body: JSON.stringify({ source: "manual", ...data }),
//     }),

//   listTimeEntries: (employeeId: string, startDate?: string, endDate?: string) => {
//     const params = new URLSearchParams({ employee_id: employeeId });
//     if (startDate) params.set("start_date", startDate);
//     if (endDate) params.set("end_date", endDate);
//     return request<TimeEntry[]>(`/time-entries?${params.toString()}`);
//   },

//   getPersonalDashboard: (employeeId: string, startDate: string, endDate: string) =>
//     request<PersonalDashboard>(
//       `/dashboard/employee/${employeeId}?start_date=${startDate}&end_date=${endDate}`
//     ),

//   getProjectMargin: (projectId: string) => request<ProjectMargin>(`/projects/${projectId}/margin`),

//   getOrgDashboard: (startDate: string, endDate: string, capacityHoursPerWeek?: number) =>
//     request<OrgUtilizationDashboard>(
//       `/dashboard/org?start_date=${startDate}&end_date=${endDate}` +
//         (capacityHoursPerWeek ? `&capacity_hours_per_week=${capacityHoursPerWeek}` : "")
//     ),
// };

const API_BASE = "/utilization";
const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

function authHeaders(): HeadersInit {
  const employeeId = localStorage.getItem(EMPLOYEE_ID_STORAGE_KEY);
  return employeeId ? { "X-Employee-Id": employeeId } : {};
}

export interface Project {
  project_id: string;
  name: string;
  project_type: string; // real project | Bench | Training | Internal | BD/Presales | Leave
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

export interface TimeEntryInput {
  entry_id: string;
  employee_id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  billable_flag: boolean;
  source?: string; // manual | import
  notes?: string;
  confirm_overtime?: boolean;
}

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
}

export class OvertimeConfirmationError extends Error {
  remainingNormalHours: number;
  requestedHours: number;

  constructor(message: string, remainingNormalHours: number, requestedHours: number) {
    super(message);
    this.name = "OvertimeConfirmationError";
    this.remainingNormalHours = remainingNormalHours;
    this.requestedHours = requestedHours;
  }
}

export interface UtilizationSummary {
  employee_id: string;
  period_start: string;
  period_end: string;
  billable_hours: number;
  available_hours: number;
  utilization_pct: number;
  flag: "under_utilized" | "over_allocated" | null;
}

export interface PersonalDashboard {
  summary: UtilizationSummary;
  hours_by_project: Record<string, number>;
  weekly_trend: Record<string, number>;
}

export interface ProjectMargin {
  project_id: string;
  project_name: string;
  revenue: number;
  cost: number;
  margin: number;
  margin_pct: number | null;
}

export interface OrgUtilizationDashboard {
  period_start: string;
  period_end: string;
  utilization_by_employee: UtilizationSummary[];
  bench_risk: string[];
  over_allocated: string[];
  project_margins: ProjectMargin[];
}

function extractErrorMessage(rawBody: string, status: number, path: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    const detail = parsed?.detail;

    if (Array.isArray(detail) && detail.length > 0) {
      const rawMsg: string = detail[0].msg || "";
      return rawMsg.replace(/^Value error,\s*/, "") || `Request to ${path} failed (${status})`;
    }
    if (typeof detail === "string") {
      return detail;
    }
  } catch {
    // body wasn't valid JSON - fall through to generic message
  }
  return `Request to ${path} failed (${status})`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 409) {
      try {
        const parsed = JSON.parse(body);
        const detail = parsed?.detail;
        if (detail && typeof detail === "object" && "remaining_normal_hours" in detail) {
          throw new OvertimeConfirmationError(
            detail.message ?? "This would include overtime.",
            detail.remaining_normal_hours,
            detail.requested_hours
          );
        }
      } catch (err) {
        if (err instanceof OvertimeConfirmationError) throw err;
      }
    }
    throw new Error(extractErrorMessage(body, res.status, path));
  }
  return res.json() as Promise<T>;
}

export const utilizationApi = {
  listProjects: () => request<Project[]>("/projects"),

  createProject: (data: ProjectInput) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createTimeEntry: (data: TimeEntryInput) =>
    request<TimeEntry>("/time-entries", {
      method: "POST",
      body: JSON.stringify({ source: "manual", ...data }),
    }),

  listTimeEntries: (employeeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ employee_id: employeeId });
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return request<TimeEntry[]>(`/time-entries?${params.toString()}`);
  },

  getPersonalDashboard: (employeeId: string, startDate: string, endDate: string) =>
    request<PersonalDashboard>(
      `/dashboard/employee/${employeeId}?start_date=${startDate}&end_date=${endDate}`
    ),

  getProjectMargin: (projectId: string) => request<ProjectMargin>(`/projects/${projectId}/margin`),

  getOrgDashboard: (startDate: string, endDate: string, capacityHoursPerWeek?: number) =>
    request<OrgUtilizationDashboard>(
      `/dashboard/org?start_date=${startDate}&end_date=${endDate}` +
        (capacityHoursPerWeek ? `&capacity_hours_per_week=${capacityHoursPerWeek}` : "")
    ),
};