const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BASE_PATH = `${API_BASE}/api/v1/helpdesk`;

/** Cosmetic-only display formatting matching the app's EMP001/T001 convention.
 * The real identifier used for API calls and routing is always the plain
 * numeric id - this only changes how it's shown to the user. */
export function formatTicketId(ticketId: number): string {
  return `TKT${String(ticketId).padStart(3, "0")}`;
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
  return res.json();
}

function authHeaders(employeeId: string): HeadersInit {
  return { "X-Employee-Id": employeeId };
}

function jsonHeaders(employeeId: string): HeadersInit {
  return { "Content-Type": "application/json", "X-Employee-Id": employeeId };
}

export type TicketCategory = "HR" | "IT" | "Facilities" | "Other";
export type TicketPriority = "High" | "Medium" | "Low";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface TicketComment {
  comment_id: number;
  ticket_id: number;
  author_id: string;
  comment: string;
  created_at: string;
}

export interface Ticket {
  ticket_id: number;
  raised_by: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  description: string;
  created_at: string;
  updated_at: string;
  sla_breached: boolean;
  comments: TicketComment[];
}

export interface QueueFilterParams {
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  minAgeHours?: number;
}

/** POST /api/v1/helpdesk/tickets - any active employee, category/priority/description validated server-side */
export function createTicket(
  category: TicketCategory,
  priority: TicketPriority,
  description: string,
  employeeId: string
): Promise<Ticket> {
  return fetch(`${BASE_PATH}/tickets`, {
    method: "POST",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ category, priority, description }),
  }).then((r) => handle(r, "Could not raise the ticket."));
}

/** GET /api/v1/helpdesk/tickets/me */
export function listMyTickets(employeeId: string): Promise<Ticket[]> {
  return fetch(`${BASE_PATH}/tickets/me`, { headers: authHeaders(employeeId) }).then((r) =>
    handle(r, "Could not load your tickets.")
  );
}

/** GET /api/v1/helpdesk/tickets/queue - Manager/Admin/HR-Restricted only */
export function listQueue(filters: QueueFilterParams, employeeId: string): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.status) params.set("status", filters.status);
  if (filters.minAgeHours !== undefined) params.set("min_age_hours", String(filters.minAgeHours));
  const qs = params.toString();
  return fetch(`${BASE_PATH}/tickets/queue${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(employeeId),
  }).then((r) => handle(r, "Could not load the queue."));
}

/** GET /api/v1/helpdesk/tickets/{id} - raiser or privileged tier */
export function getTicket(ticketId: number, employeeId: string): Promise<Ticket> {
  return fetch(`${BASE_PATH}/tickets/${ticketId}`, { headers: authHeaders(employeeId) }).then((r) =>
    handle(r, "That ticket wasn't found.")
  );
}

/** PATCH /api/v1/helpdesk/tickets/{id}/status - privileged only, state machine enforced server-side */
export function updateTicketStatus(
  ticketId: number,
  status: TicketStatus,
  employeeId: string
): Promise<Ticket> {
  return fetch(`${BASE_PATH}/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ status }),
  }).then((r) => handle(r, "That ticket wasn't found."));
}

/** PATCH /api/v1/helpdesk/tickets/{id}/assign - privileged only, target must be an active privileged-tier employee */
export function reassignTicket(
  ticketId: number,
  assignedTo: string,
  employeeId: string
): Promise<Ticket> {
  return fetch(`${BASE_PATH}/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ assigned_to: assignedTo }),
  }).then((r) => handle(r, "That ticket wasn't found."));
}

/** POST /api/v1/helpdesk/tickets/{id}/comments - raiser, assignee, or privileged tier */
export function addComment(ticketId: number, comment: string, employeeId: string): Promise<TicketComment> {
  return fetch(`${BASE_PATH}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: jsonHeaders(employeeId),
    body: JSON.stringify({ comment }),
  }).then((r) => handle(r, "That ticket wasn't found."));
}
