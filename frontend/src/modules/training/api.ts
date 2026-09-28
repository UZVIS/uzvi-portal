const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BASE_PATH = `${API_BASE}/api/v1/training`;

/** Cosmetic-only display formatting matching the app's EMP001/T001 convention.
 * The real identifier used for API calls and routing is always the plain
 * numeric id - this only changes how it's shown to the user. */
export function formatProgramId(programId: number): string {
  return `PRG${String(programId).padStart(3, "0")}`;
}

async function handle<T>(res: Response, notFoundMessage: string): Promise<T> {
  if (res.status === 404) {
    throw new Error(notFoundMessage);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : JSON.stringify(detail ?? "Something went wrong. Try again.");
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

function authHeaders(employeeId: string): HeadersInit {
  return { "X-Employee-Id": employeeId };
}

function jsonHeaders(employeeId: string): HeadersInit {
  return { "Content-Type": "application/json", "X-Employee-Id": employeeId };
}

export interface TrainingUnit {
  unit_id: number;
  program_id: number;
  name: string;
  sequence: number;
}

export interface TrainingProgram {
  program_id: number;
  name: string;
  units: TrainingUnit[];
}

export interface UnitCompletion {
  completion_id: number;
  enrollment_id: number;
  unit_id: number;
  completed_at: string;
  score: number | null;
}

export interface Enrollment {
  enrollment_id: number;
  employee_id: string;
  employee_name: string | null;
  program_id: number;
  enrolled_at: string;
  total_units: number;
  completed_units: number;
  completion_pct: number;
  completions: UnitCompletion[];
}

export interface CohortEmployeeProgress {
  employee_id: string;
  employee_name: string | null;
  total_units: number;
  completed_units: number;
  completion_pct: number;
  flagged_behind: boolean;
}

export interface CohortProgress {
  program_id: number;
  program_name: string;
  total_units: number;
  median_completion_pct: number;
  employees: CohortEmployeeProgress[];
}

/** GET /api/v1/training/programs - list all programs, any authenticated employee */
export function listPrograms(employeeId: string): Promise<TrainingProgram[]> {
  return fetch(`${BASE_PATH}/programs`, { headers: authHeaders(employeeId) }).then((r) =>
    handle(r, "Could not load training programs.")
  );
}

/** GET /api/v1/training/programs/{id} */
export function getProgram(programId: number, employeeId: string): Promise<TrainingProgram> {
  return fetch(`${BASE_PATH}/programs/${programId}`, { headers: authHeaders(employeeId) }).then(
    (r) => handle(r, "That training program wasn't found.")
  );
}

/** POST /api/v1/training/programs - Admin/Leadership only */
export function createProgram(name: string, employeeId: string): Promise<TrainingProgram> {
  return fetch(`${BASE_PATH}/programs`, {
    method: "POST",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ name }),
  }).then((r) => handle(r, "Could not create the program."));
}

/** DELETE /api/v1/training/programs/{id} - Admin/Leadership only, blocked if it has enrollments */
export function deleteProgram(programId: number, employeeId: string): Promise<void> {
  return fetch(`${BASE_PATH}/programs/${programId}`, {
    method: "DELETE",
    headers: authHeaders(employeeId),
  }).then((r) => handle(r, "That training program wasn't found."));
}

/** POST /api/v1/training/programs/{id}/units - Admin/Leadership only */
export function createUnit(
  programId: number,
  name: string,
  sequence: number,
  employeeId: string
): Promise<TrainingUnit> {
  return fetch(`${BASE_PATH}/programs/${programId}/units`, {
    method: "POST",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ name, sequence }),
  }).then((r) => handle(r, "That training program wasn't found."));
}

/** DELETE /api/v1/training/units/{id} - Admin/Leadership only, blocked if it has completions */
export function deleteUnit(unitId: number, employeeId: string): Promise<void> {
  return fetch(`${BASE_PATH}/units/${unitId}`, {
    method: "DELETE",
    headers: authHeaders(employeeId),
  }).then((r) => handle(r, "That training unit wasn't found."));
}

/** PATCH /api/v1/training/units/{id} - Admin/Leadership only, name and/or sequence */
export function updateUnit(
  unitId: number,
  input: { name?: string; sequence?: number },
  employeeId: string
): Promise<TrainingUnit> {
  return fetch(`${BASE_PATH}/units/${unitId}`, {
    method: "PATCH",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify(input),
  }).then((r) => handle(r, "That training unit wasn't found."));
}

/** POST /api/v1/training/enrollments - self-enroll, or Admin/Leadership enrolling someone else */
export function createEnrollment(
  programId: number,
  employeeId: string,
  targetEmployeeId?: string
): Promise<Enrollment> {
  return fetch(`${BASE_PATH}/enrollments`, {
    method: "POST",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({
      program_id: programId,
      ...(targetEmployeeId ? { employee_id: targetEmployeeId } : {}),
    }),
  }).then((r) => handle(r, "That training program wasn't found."));
}

/** GET /api/v1/training/enrollments/me */
export function listMyEnrollments(employeeId: string): Promise<Enrollment[]> {
  return fetch(`${BASE_PATH}/enrollments/me`, { headers: authHeaders(employeeId) }).then((r) =>
    handle(r, "Could not load your enrollments.")
  );
}

/** GET /api/v1/training/enrollments/by-employee/{id} - self, or Manager/Admin/HR-Restricted for anyone */
export function listEnrollmentsByEmployee(
  targetEmployeeId: string,
  viewerEmployeeId: string
): Promise<Enrollment[]> {
  return fetch(`${BASE_PATH}/enrollments/by-employee/${encodeURIComponent(targetEmployeeId)}`, {
    headers: authHeaders(viewerEmployeeId),
  }).then((r) => handle(r, "Could not load enrollments for that employee."));
}

/** GET /api/v1/training/enrollments/{id} */
export function getEnrollment(enrollmentId: number, employeeId: string): Promise<Enrollment> {
  return fetch(`${BASE_PATH}/enrollments/${enrollmentId}`, {
    headers: authHeaders(employeeId),
  }).then((r) => handle(r, "That enrollment wasn't found."));
}

/** POST /api/v1/training/enrollments/{id}/units/{unitId}/complete - self-attested only, score 0-100 optional */
export function completeUnit(
  enrollmentId: number,
  unitId: number,
  employeeId: string,
  score?: number
): Promise<UnitCompletion> {
  return fetch(`${BASE_PATH}/enrollments/${enrollmentId}/units/${unitId}/complete`, {
    method: "POST",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ score: score ?? null }),
  }).then((r) => handle(r, "That enrollment or unit wasn't found."));
}

/** DELETE /api/v1/training/completions/{id} - undo, self-only */
export function deleteCompletion(completionId: number, employeeId: string): Promise<void> {
  return fetch(`${BASE_PATH}/completions/${completionId}`, {
    method: "DELETE",
    headers: authHeaders(employeeId),
  }).then((r) => handle(r, "That completion wasn't found."));
}

/** GET /api/v1/training/programs/{id}/cohort-progress - Manager/Admin/HR-Restricted only */
export function getCohortProgress(
  programId: number,
  employeeId: string
): Promise<CohortProgress> {
  return fetch(`${BASE_PATH}/programs/${programId}/cohort-progress`, {
    headers: authHeaders(employeeId),
  }).then((r) => handle(r, "That training program wasn't found."));
}
