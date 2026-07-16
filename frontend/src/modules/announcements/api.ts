import type {Announcement, AcknowledgmentStatusRow, TargetType} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BASE_PATH = `${API_BASE}/api/v1/announcements`;

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

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  target_type: TargetType;
  target_value?: string;
  requires_ack: boolean;
  expiry_date?: string;
  posted_by: string;
}

/** POST /api/v1/announcements/ — FR-ANN-01 */
export function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<Announcement> {
  return fetch(`${BASE_PATH}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r, "Could not post the announcement."));
}

/** GET /api/v1/announcements/ — Admin org-wide view (all statuses) */
export function listAllAnnouncements(): Promise<Announcement[]> {
  return fetch(`${BASE_PATH}/`).then((r) =>
    handle(r, "Could not load announcements.")
  );
}

/** GET /api/v1/announcements/feed/{employee_id} — FR-ANN-02 */
export function listFeedForEmployee(employeeId: string): Promise<Announcement[]> {
  return fetch(`${BASE_PATH}/feed/${encodeURIComponent(employeeId)}`).then((r) =>
    handle(r, "Employee not found.")
  );
}

/** GET /api/v1/announcements/{announcement_id} */
export function getAnnouncement(announcementId: string): Promise<Announcement> {
  return fetch(`${BASE_PATH}/${encodeURIComponent(announcementId)}`).then((r) =>
    handle(r, "Announcement not found.")
  );
}

/** POST /api/v1/announcements/{announcement_id}/acknowledge — FR-ANN-03 (write) */
export function acknowledgeAnnouncement(
  announcementId: string,
  employeeId: string
) {
  return fetch(`${BASE_PATH}/${encodeURIComponent(announcementId)}/acknowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id: employeeId }),
  }).then((r) => handle(r, "Announcement not found."));
}

/** GET /api/v1/announcements/{announcement_id}/acknowledgment-status — FR-ANN-03 (read) */
export function getAcknowledgmentStatus(
  announcementId: string
): Promise<AcknowledgmentStatusRow[]> {
  return fetch(
    `${BASE_PATH}/${encodeURIComponent(announcementId)}/acknowledgment-status`
  ).then((r) => handle(r, "Announcement not found."));
}