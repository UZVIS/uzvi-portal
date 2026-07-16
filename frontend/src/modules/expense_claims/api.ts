/**
 * M4 - Expense Claims
 * frontend/src/modules/expense_claims/api.ts
 *
 * Talks to the backend router mounted at /expenses (see router.py).
 */

const API_BASE = "/expenses";

export interface ExpenseCategory {
  category_id: string;
  name: string;
  cap_amount?: number | null;
}

export type ClaimStatus = "Submitted" | "Approved" | "Rejected" | "Reimbursed";

export interface ExpenseClaim {
  claim_id: string;
  employee_id: string;
  category_id: string;
  project_id?: string | null;
  amount: number;
  date: string; // YYYY-MM-DD
  status: ClaimStatus;
}

export interface ExpenseClaimInput {
  claim_id: string;
  employee_id: string;
  category_id: string;
  project_id?: string | null;
  amount: number;
  date: string;
  // Accepted by the API but NOT persisted yet - the ER diagram's
  // ExpenseClaim table has no description/receipt columns (flagged
  // schema gap). Kept here so the form can still collect them and the
  // gap stays visible end-to-end rather than silently dropped in the UI.
  description?: string;
  receipt_attached?: boolean;
}

export interface PendingTotal {
  employee_id: string;
  pending_reimbursement_total: number;
  claim_count: number;
}

export interface ProjectExpenseRollup {
  project_id: string;
  total_amount: number;
  claim_count: number;
  by_status: Record<string, number>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Request to ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

export const expenseClaimsApi = {
  listCategories: () => request<ExpenseCategory[]>("/categories"),

  listClaims: (employeeId?: string) =>
    request<ExpenseClaim[]>(employeeId ? `/claims?employee_id=${employeeId}` : "/claims"),

  createClaim: (data: ExpenseClaimInput) =>
    request<ExpenseClaim>("/claims", { method: "POST", body: JSON.stringify(data) }),

  getPendingTotal: (employeeId: string) =>
    request<PendingTotal>(`/employees/${employeeId}/pending-total`),

  // FR-EXP-03: approval chain. decidedByRole should come from the real
  // logged-in user's role once auth exists (NFR-SEC-05) - passed manually
  // for now since there's no auth.
  approveClaim: (claimId: string, decidedByRole: string) =>
    request<ExpenseClaim>(`/claims/${claimId}/approve`, {
      method: "POST",
      body: JSON.stringify({ decided_by_role: decidedByRole }),
    }),

  rejectClaim: (claimId: string) => request<ExpenseClaim>(`/claims/${claimId}/reject`, { method: "POST" }),

  reimburseClaim: (claimId: string) =>
    request<ExpenseClaim>(`/claims/${claimId}/reimburse`, { method: "POST" }),

  // FR-EXP-06: per-project expense rollup.
  getProjectRollup: (projectId: string) =>
    request<ProjectExpenseRollup>(`/projects/${projectId}/rollup`),
};
