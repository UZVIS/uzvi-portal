/**
 * M12 - Recruiting / Candidate Pipeline
 * frontend/src/modules/recruiting/api.ts
 *
 * Talks to the backend routers mounted at /api/v1/candidates and
 * /api/v1/interview-stages (see backend/app/modules/recruiting/router.py).
 * Goes through the existing "/api" proxy rule in vite.config.ts.
 */

const API_BASE = "/api/v1";

export type CandidateStage =
  | "Applied"
  | "Screened"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Rejected";

export const PIPELINE_STAGES: CandidateStage[] = [
  "Applied",
  "Screened",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

export interface Candidate {
  candidate_id: string;
  name: string;
  resume_details?: string | null;
  applied_role: string;
  source?: string | null;
  stage: CandidateStage;
  converted_emp_id?: string | null;
  created_at: string;
}

export interface Scorecard {
  scorecard_id: string;
  stage_id: string;
  questions?: string | null;
  score?: number | null;
}

export interface InterviewStage {
  stage_id: string;
  candidate_id: string;
  stage_name: string;
  interviewer_id?: string | null;
  notes?: string | null;
  timestamp: string;
  scorecards: Scorecard[];
}

export interface CandidateDetail extends Candidate {
  interview_stages: InterviewStage[];
}

export interface FunnelStageCount {
  stage: string;
  count: number;
}

export interface TimeInStageEntry {
  stage: string;
  avg_days_in_stage: number;
  candidate_count: number;
}

export interface FunnelStats {
  by_stage: FunnelStageCount[];
  by_role: Record<string, number>;
  by_source: Record<string, number>;
  time_in_stage: TimeInStageEntry[];
}

export interface DuplicateFlag {
  candidate_id: string;
  other_candidate_id: string;
  similarity: number;
}

export interface CandidateInput {
  candidate_id: string;
  name: string;
  resume_details?: string;
  applied_role: string;
  source?: string;
}

export interface CandidateUpdateInput {
  name?: string;
  resume_details?: string;
  applied_role?: string;
  source?: string;
  stage?: CandidateStage;
}

export interface InterviewStageInput {
  stage_id: string;
  stage_name: string;
  interviewer_id?: string;
  notes?: string;
}

export interface ScorecardInput {
  scorecard_id: string;
  questions?: string;
  score?: number;
}

export interface HireConversionInput {
  employee_id: string;
  requester_id: string;
  designation?: string;
  team_id?: string;
  manager_id?: string;
  join_date?: string;
}

// Must match AuthContext.tsx's STORAGE_KEY — the recruiting module reads
// the logged-in employee id directly so every request can identify the
// caller for the Admin/Leadership + HR-Restricted access check enforced
// by the backend (see recruiting/dependencies.py).
const AUTH_STORAGE_KEY = "uzvi_portal_employee_id";

// FastAPI's `detail` field isn't always a plain string: on 422 validation
// errors it's an array of {loc, msg, type} objects, and some handlers raise
// dict details. Stringifying those directly (e.g. `new Error(obj)`) collapses
// to the useless "[object Object]" — this pulls out a readable message instead.
function normalizeErrorDetail(detail: unknown): string {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const loc = Array.isArray((item as any).loc)
            ? (item as any).loc.filter((p: unknown) => p !== "body").join(".")
            : "";
          return loc ? `${loc}: ${(item as any).msg}` : String((item as any).msg);
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (typeof detail === "object") {
    if ("msg" in (detail as any)) return String((detail as any).msg);
    return JSON.stringify(detail);
  }
  return String(detail);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const employeeId = localStorage.getItem(AUTH_STORAGE_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(employeeId ? { "X-Employee-Id": employeeId } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = normalizeErrorDetail(body?.detail);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(detail || `Request to ${path} failed (${res.status}).`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const recruitingApi = {
  listCandidates: (filters?: { stage?: string; appliedRole?: string }) => {
    const params = new URLSearchParams();
    if (filters?.stage) params.set("stage", filters.stage);
    if (filters?.appliedRole) params.set("applied_role", filters.appliedRole);
    const qs = params.toString();
    return request<Candidate[]>(`/candidates/${qs ? `?${qs}` : ""}`);
  },

  getFunnelStats: () => request<FunnelStats>("/candidates/funnel-stats"),

  getDuplicates: (threshold = 0.8) =>
    request<DuplicateFlag[]>(`/candidates/duplicates?threshold=${threshold}`),

  getCandidate: (candidateId: string) =>
    request<CandidateDetail>(`/candidates/${encodeURIComponent(candidateId)}`),

  createCandidate: (data: CandidateInput) =>
    request<Candidate>("/candidates/", { method: "POST", body: JSON.stringify(data) }),

  updateStage: (candidateId: string, stage: CandidateStage) =>
    request<Candidate>(`/candidates/${encodeURIComponent(candidateId)}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    }),

  updateCandidate: (candidateId: string, data: CandidateUpdateInput) =>
    request<Candidate>(`/candidates/${encodeURIComponent(candidateId)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCandidate: (candidateId: string) =>
    request<void>(`/candidates/${encodeURIComponent(candidateId)}`, {
      method: "DELETE",
    }),

  addInterviewStage: (candidateId: string, data: InterviewStageInput) =>
    request<InterviewStage>(
      `/candidates/${encodeURIComponent(candidateId)}/interview-stages`,
      { method: "POST", body: JSON.stringify(data) }
    ),

  listInterviewStages: (candidateId: string) =>
    request<InterviewStage[]>(
      `/candidates/${encodeURIComponent(candidateId)}/interview-stages`
    ),

  convertToEmployee: (candidateId: string, data: HireConversionInput) =>
    request<Candidate>(
      `/candidates/${encodeURIComponent(candidateId)}/convert-to-employee`,
      { method: "POST", body: JSON.stringify(data) }
    ),

  addScorecard: (stageId: string, data: ScorecardInput) =>
    request<Scorecard>(`/interview-stages/${encodeURIComponent(stageId)}/scorecards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}