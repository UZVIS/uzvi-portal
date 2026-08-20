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
  const employee: Employee = await res.json();
  if (employee.employment_status !== "active") {
    throw new Error("This account is no longer active. Contact your admin if this seems wrong.");
  }
  return employee;
}