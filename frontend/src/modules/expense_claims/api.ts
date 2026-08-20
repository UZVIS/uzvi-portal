

// const API_BASE = "/expenses";
// const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

// function authHeaders(): HeadersInit {
//   const employeeId = localStorage.getItem(EMPLOYEE_ID_STORAGE_KEY);
//   return employeeId ? { "X-Employee-Id": employeeId } : {};
// }

// export interface ExpenseCategory {
//   category_id: string;
//   name: string;
//   cap_amount?: number | null;
// }

// export type ClaimStatus = "Submitted" | "Approved" | "Rejected" | "Reimbursed";

// export interface ExpenseClaim {
//   claim_id: string;
//   employee_id: string;
//   category_id: string;
//   project_id?: string | null;
//   amount: number;
//   date: string; // YYYY-MM-DD
//   status: ClaimStatus;
//   description?: string | null;
//   receipt_file_path?: string | null;
//   decided_by_role?: string | null;
//   decided_at?: string | null;
// }

// export interface ExpenseClaimInput {
//   claim_id: string;
//   employee_id: string;
//   category_id: string;
//   project_id?: string | null;
//   amount: number;
//   date: string;
//   description?: string;
// }

// export interface ExpenseCategoryInput {
//   category_id: string;
//   name: string;
//   cap_amount?: number | null;
// }

// export interface PendingTotal {
//   employee_id: string;
//   pending_reimbursement_total: number;
//   claim_count: number;
// }

// export interface ProjectExpenseRollup {
//   project_id: string;
//   total_amount: number;
//   claim_count: number;
//   by_status: Record<string, number>;
// }

// function extractErrorMessage(rawBody: string, status: number, path: string): string {
//   try {
//     const parsed = JSON.parse(rawBody);
//     const detail = parsed?.detail;

//     if (Array.isArray(detail) && detail.length > 0) {
//       const rawMsg: string = detail[0].msg || "";
//       return rawMsg.replace(/^Value error,\s*/, "") || "Request to " + path + " failed (" + status + ")";
//     }
//     if (typeof detail === "string") {
//       return detail;
//     }
//   } catch {
//     // body wasn't valid JSON - fall through to generic message
//   }
//   return "Request to " + path + " failed (" + status + ")";
// }

// async function request<T>(path: string, options?: RequestInit): Promise<T> {
//   const res = await fetch(`${API_BASE}${path}`, {
//     headers: { "Content-Type": "application/json", ...authHeaders() },
//     ...options,
//   });
//   if (!res.ok) {
//     const body = await res.text().catch(() => "");
//     throw new Error(extractErrorMessage(body, res.status, path));
//   }
//   return res.json() as Promise<T>;
// }

// // Separate from request() because file uploads must NOT set
// // "Content-Type: application/json" - the browser sets the correct
// // multipart boundary header automatically when we pass FormData.
// async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
//   const res = await fetch(`${API_BASE}${path}`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: formData,
//   });
//   if (!res.ok) {
//     const body = await res.text().catch(() => "");
//     throw new Error(extractErrorMessage(body, res.status, path));
//   }
//   return res.json() as Promise<T>;
// }

// export const expenseClaimsApi = {
//   listCategories: () => request<ExpenseCategory[]>("/categories"),

//   createCategory: (data: ExpenseCategoryInput) =>
//     request<ExpenseCategory>("/categories", { method: "POST", body: JSON.stringify(data) }),

//   listClaims: (employeeId?: string) =>
//     request<ExpenseClaim[]>(employeeId ? `/claims?employee_id=${employeeId}` : "/claims"),

//   createClaim: (data: ExpenseClaimInput) =>
//     request<ExpenseClaim>("/claims", { method: "POST", body: JSON.stringify(data) }),

//   // FR-EXP-01: attach a receipt file to an existing claim.
//   uploadReceipt: (claimId: string, file: File) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     return requestFormData<ExpenseClaim>(`/claims/${claimId}/receipt`, formData);
//   },

//   getPendingTotal: (employeeId: string) =>
//     request<PendingTotal>(`/employees/${employeeId}/pending-total`),

//   // FR-EXP-03 / NFR-SEC-01: the approval chain and role check now happen
//   // server-side, resolved from the real logged-in employee (X-Employee-Id
//   // header, sent automatically by request()) against the M0 Directory -
//   // not from anything the client claims here.
//   approveClaim: (claimId: string) =>
//     request<ExpenseClaim>(`/claims/${claimId}/approve`, { method: "POST" }),

//   rejectClaim: (claimId: string) =>
//     request<ExpenseClaim>(`/claims/${claimId}/reject`, { method: "POST" }),

//   reimburseClaim: (claimId: string) =>
//     request<ExpenseClaim>(`/claims/${claimId}/reimburse`, { method: "POST" }),

//   // FR-EXP-06: per-project expense rollup.
//   getProjectRollup: (projectId: string) =>
//     request<ProjectExpenseRollup>(`/projects/${projectId}/rollup`),
// };


const API_BASE = "/expenses";
const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

function authHeaders(): HeadersInit {
  const employeeId = localStorage.getItem(EMPLOYEE_ID_STORAGE_KEY);
  return employeeId ? { "X-Employee-Id": employeeId } : {};
}

export interface ExpenseCategory {
  category_id: string;
  name: string;
  cap_amount?: number | null;
}

export type ClaimStatus = "Submitted" | "Approved" | "Rejected" | "Reimbursed";

export interface ExpenseClaim {
  claim_id: string;
  employee_id: string;
  employee_name?: string | null;
  category_id: string;
  project_id?: string | null;
  amount: number;
  date: string; // YYYY-MM-DD
  status: ClaimStatus;
  description?: string | null;
  receipt_file_path?: string | null;
  decided_by_role?: string | null;
  decided_at?: string | null;
}

export interface ExpenseClaimInput {
  claim_id: string;
  employee_id: string;
  category_id: string;
  project_id?: string | null;
  amount: number;
  date: string;
  description?: string;
}

export interface ExpenseCategoryInput {
  category_id: string;
  name: string;
  cap_amount?: number | null;
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

function extractErrorMessage(rawBody: string, status: number, path: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    const detail = parsed?.detail;

    if (Array.isArray(detail) && detail.length > 0) {
      const rawMsg: string = detail[0].msg || "";
      return rawMsg.replace(/^Value error,\s*/, "") || "Request to " + path + " failed (" + status + ")";
    }
    if (typeof detail === "string") {
      return detail;
    }
  } catch {
    // body wasn't valid JSON - fall through to generic message
  }
  return "Request to " + path + " failed (" + status + ")";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(body, res.status, path));
  }
  return res.json() as Promise<T>;
}

// Separate from request() because file uploads must NOT set
// "Content-Type: application/json" - the browser sets the correct
// multipart boundary header automatically when we pass FormData.
async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(body, res.status, path));
  }
  return res.json() as Promise<T>;
}

export const expenseClaimsApi = {
  listCategories: () => request<ExpenseCategory[]>("/categories"),

  createCategory: (data: ExpenseCategoryInput) =>
    request<ExpenseCategory>("/categories", { method: "POST", body: JSON.stringify(data) }),

  listClaims: (employeeId?: string) =>
    request<ExpenseClaim[]>(employeeId ? `/claims?employee_id=${employeeId}` : "/claims"),

  createClaim: (data: ExpenseClaimInput) =>
    request<ExpenseClaim>("/claims", { method: "POST", body: JSON.stringify(data) }),

  // FR-EXP-01: attach a receipt file to an existing claim.
  uploadReceipt: (claimId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData<ExpenseClaim>(`/claims/${claimId}/receipt`, formData);
  },

  getPendingTotal: (employeeId: string) =>
    request<PendingTotal>(`/employees/${employeeId}/pending-total`),

  // FR-EXP-03 / NFR-SEC-01: the approval chain and role check now happen
  // server-side, resolved from the real logged-in employee (X-Employee-Id
  // header, sent automatically by request()) against the M0 Directory -
  // not from anything the client claims here.
  approveClaim: (claimId: string) =>
    request<ExpenseClaim>(`/claims/${claimId}/approve`, { method: "POST" }),

  rejectClaim: (claimId: string) =>
    request<ExpenseClaim>(`/claims/${claimId}/reject`, { method: "POST" }),

  reimburseClaim: (claimId: string) =>
    request<ExpenseClaim>(`/claims/${claimId}/reimburse`, { method: "POST" }),

  // FR-EXP-06: per-project expense rollup.
  getProjectRollup: (projectId: string) =>
    request<ProjectExpenseRollup>(`/projects/${projectId}/rollup`),
};