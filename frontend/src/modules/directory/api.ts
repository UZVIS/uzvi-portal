const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const EMPLOYEES_PATH = `${API_BASE}/api/v1/employees`;
const TEAMS_PATH = `${API_BASE}/api/v1/teams`;

async function handle<T>(res: Response, notFoundMessage: string): Promise<T> {
  if (res.status === 404) {
    throw new Error(notFoundMessage);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail ?? "Something went wrong. Try again.");
    throw new Error(message);
  }
  return res.json();
}

export interface Employee {
  employee_id: string;
  name: string;
  designation: string | null;
  team_id: string | null;
  manager_id: string | null;
  join_date: string | null;
  access_tier: string;
  contact_details: string | null;
  employment_status: string;
}

export interface Team {
  team_id: string;
  name: string;
}

export interface CreateEmployeeInput {
  employee_id?: string;
  name: string;
  designation?: string;
  team_id?: string;
  manager_id?: string;
  join_date?: string;
  access_tier?: string;
  contact_details?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  designation?: string;
  team_id?: string;
  manager_id?: string;
  access_tier?: string;
  contact_details?: string;
  join_date?: string;
  employment_status?: string;
}

/** GET /api/v1/employees/ - excludes exited employees */
export function listActiveEmployees(): Promise<Employee[]> {
  return fetch(`${EMPLOYEES_PATH}/`).then((r) =>
    handle(r, "Could not load the directory.")
  );
}

/** GET /api/v1/employees/exited?requester_id=... - Admin/HR-Restricted only */
export function listExitedEmployees(requesterId: string): Promise<Employee[]> {
  return fetch(`${EMPLOYEES_PATH}/exited?requester_id=${encodeURIComponent(requesterId)}`).then(
    (r) => handle(r, "Could not load exited employees.")
  );
}

/** GET /api/v1/employees/{id} */
export function getEmployee(employeeId: string): Promise<Employee> {
  return fetch(`${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}`).then(
    (r) => handle(r, "That employee wasn't found.")
  );
}

/** POST /api/v1/employees/?requester_id=... - Admin/HR-Restricted only */
export function createEmployee(
  input: CreateEmployeeInput,
  requesterId: string
): Promise<Employee> {
  return fetch(
    `${EMPLOYEES_PATH}/?requester_id=${encodeURIComponent(requesterId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  ).then((r) => handle(r, "Could not register the employee."));
}

/** PATCH /api/v1/employees/{id}?requester_id=... - Admin/HR-Restricted only */
export function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
  requesterId: string
): Promise<Employee> {
  return fetch(
    `${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}?requester_id=${encodeURIComponent(requesterId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  ).then((r) => handle(r, "That employee wasn't found."));
}

/** POST /api/v1/employees/{id}/exit?requester_id=... -soft-delete only, Admin/HR-Restricted only */
export function exitEmployee(employeeId: string, requesterId: string): Promise<Employee> {
  return fetch(
    `${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}/exit?requester_id=${encodeURIComponent(requesterId)}`,
    {
      method: "POST",
    }
  ).then((r) => handle(r, "That employee wasn't found."));
}

/** GET /api/v1/teams/ */
export function listTeams(): Promise<Team[]> {
  return fetch(`${TEAMS_PATH}/`).then((r) => handle(r, "Could not load teams."));
}

/** POST /api/v1/teams/ */
export function createTeam(name: string): Promise<Team> {
  return fetch(`${TEAMS_PATH}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((r) => handle(r, "Could not create the team."));
}