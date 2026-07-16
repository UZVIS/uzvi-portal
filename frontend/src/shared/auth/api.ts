const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface Employee {
  employee_id: string;
  name: string;
  designation: string | null;
  team_id: string | null;
  access_tier: string;
  employment_status: string;
  contact_details: string | null;
}

/**
 * V1 auth is intentionally lightweight (NFR-SEC-05): signing in means
 * identifying yourself by employee_id, which we confirm against the
 * Employee Directory (M0). No password yet — that can be layered on
 * later without changing this contract.
 */
export async function fetchEmployee(employeeId: string): Promise<Employee> {
  const res = await fetch(
    `${API_BASE}/api/v1/employees/${encodeURIComponent(employeeId)}`
  );
  if (res.status === 404) {
    throw new Error("That employee ID wasn't found. Check with your admin.");
  }
  if (!res.ok) {
    throw new Error("Couldn't reach the portal. Try again in a moment.");
  }
  return res.json();
}