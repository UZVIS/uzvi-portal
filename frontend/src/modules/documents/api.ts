const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BASE_PATH = `${API_BASE}/api/v1/documents`;

async function handle<T>(res: Response, notFoundMessage: string): Promise<T> {
  if (res.status === 404) {
    throw new Error(notFoundMessage);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? "Something went wrong. Try again.");
  }
  return res.json();
}

export interface DocumentRecord {
  document_id: string;
  employee_id: string;
  uploaded_by: string;
  doc_type: string;
  retention_expiry: string | null;
}

export interface DocumentAccessLog {
  log_id: number;
  document_id: string;
  accessed_by: string;
  action: string;
  timestamp: string;
}

/** POST /api/v1/documents/ — HR-Restricted uploads on an employee's behalf */
export function registerDocument(input: {
  document_id: string;
  employee_id: string;
  uploaded_by: string;
  doc_type: string;
  retention_expiry?: string;
}): Promise<DocumentRecord> {
  return fetch(`${BASE_PATH}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r, "Could not register the document."));
}

/** GET /api/v1/documents/{id}?requester_id=... — logs every view (NFR-AUD-02) */
export function viewDocument(documentId: string, requesterId: string): Promise<DocumentRecord> {
  return fetch(
    `${BASE_PATH}/${encodeURIComponent(documentId)}?requester_id=${encodeURIComponent(requesterId)}`
  ).then((r) => handle(r, "That document wasn't found, or you don't have access to it."));
}

/** GET /api/v1/documents/{id}/logs — the audit trail */
export function getAccessLogs(documentId: string): Promise<DocumentAccessLog[]> {
  return fetch(`${BASE_PATH}/${encodeURIComponent(documentId)}/logs`).then((r) =>
    handle(r, "That document wasn't found.")
  );
}

/** GET /api/v1/documents/expired/list?requester_id=... — HR-Restricted only */
export function getExpiredDocuments(requesterId: string): Promise<DocumentRecord[]> {
  return fetch(`${BASE_PATH}/expired/list?requester_id=${encodeURIComponent(requesterId)}`).then(
    (r) => handle(r, "Could not load expired documents.")
  );
}

/** GET /api/v1/documents/?requester_id=... - HR sees all, an employee sees only their own */
export function getVisibleDocuments(requesterId: string): Promise<DocumentRecord[]> {
  return fetch(`${BASE_PATH}/?requester_id=${encodeURIComponent(requesterId)}`).then(
    (r) => handle(r, "Could not load documents.")
  );
}
