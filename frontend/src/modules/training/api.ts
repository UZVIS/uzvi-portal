import type {
  TrainingProgram,
  TrainingProgramCreate,
  TrainingUnit,
  TrainingUnitCreate,
  Enrollment,
  EnrollmentCreate,
  UnitCompletion,
  UnitCompletionCreate,
  Progress,
  CohortProgress,
} from "./types";

const API_BASE = "/api/training";
const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

function authHeaders(): HeadersInit {
  const employeeId = localStorage.getItem(EMPLOYEE_ID_STORAGE_KEY);
  return employeeId ? { "X-Employee-Id": employeeId } : {};
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    let message = "Request failed.";

    try {
      const data = JSON.parse(body);
      message = data.detail ?? message;
    } catch {
      // Ignore if the response isn't JSON
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const trainingApi = {
  // Programs
  listPrograms: () =>
    request<TrainingProgram[]>("/programs"),

  createProgram: (data: TrainingProgramCreate) =>
    request<TrainingProgram>("/programs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Units
  listUnits: (programId: number) =>
    request<TrainingUnit[]>(
      `/programs/${programId}/units`
    ),

  createUnit: (
    programId: number,
    data: TrainingUnitCreate
  ) =>
    request<TrainingUnit>(
      `/programs/${programId}/units`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  // Enrollments
  listEnrollments: () =>
    request<Enrollment[]>("/enrollments"),

  createEnrollment: (data: EnrollmentCreate) =>
    request<Enrollment>("/enrollments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Unit Completions
  listCompletions: () =>
    request<UnitCompletion[]>("/completions"),

  completeUnit: (
    data: UnitCompletionCreate
  ) =>
    request<UnitCompletion>("/completions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Progress
  getEmployeeProgress: (
    employeeId: string
  ) =>
    request<Progress>(
      `/progress/${employeeId}`
    ),

  getCohortProgress: (
    programId: number
  ) =>
    request<CohortProgress>(
      `/cohort-progress/${programId}`
    ),
};