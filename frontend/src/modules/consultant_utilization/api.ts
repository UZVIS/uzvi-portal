/**
 * M1 - Consultant Utilization Tracker
 * frontend/src/modules/consultant_utilization/api.ts
 *
 * Talks to the backend router mounted at /utilization (see router.py).
 */

const API_BASE = "/utilization";

export interface Project {
  project_id: string;
  name: string;
  project_type: string; // real project | Bench | Training | Internal | BD/Presales | Leave
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
      // Pydantic prefixes custom validator errors with "Value error, "
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
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(body, res.status, path));
  }
  return res.json() as Promise<T>;
}

export const utilizationApi = {
  listProjects: () => request<Project[]>("/projects"),

  createTimeEntry: (data: TimeEntryInput) =>
    request<TimeEntryInput>("/time-entries", {
      method: "POST",
      body: JSON.stringify({ source: "manual", ...data }),
    }),

  getPersonalDashboard: (employeeId: string, startDate: string, endDate: string) =>
    request<PersonalDashboard>(
      `/dashboard/employee/${employeeId}?start_date=${startDate}&end_date=${endDate}`
    ),

  // FR-UTL-04: per-project revenue/cost/margin
  getProjectMargin: (projectId: string) => request<ProjectMargin>(`/projects/${projectId}/margin`),

  // FR-UTL-05: org-wide utilization, bench-risk, over-allocation, project margins.
  // NOTE: not role-restricted yet (NFR-SEC-01) - anyone can currently load this.
  getOrgDashboard: (startDate: string, endDate: string, capacityHoursPerWeek?: number) =>
    request<OrgUtilizationDashboard>(
      `/dashboard/org?start_date=${startDate}&end_date=${endDate}` +
        (capacityHoursPerWeek ? `&capacity_hours_per_week=${capacityHoursPerWeek}` : "")
    ),
}