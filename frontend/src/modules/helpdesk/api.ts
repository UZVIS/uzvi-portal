import type{
  Ticket,
  TicketCreate,
  TicketUpdate,
  TicketComment,
  TicketCommentCreate,
} from "./types";

const API_BASE = "/api/helpdesk";
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

export const helpdeskApi = {
  listTickets: () =>
    request<Ticket[]>("/tickets"),

  getTicket: (ticketId: number) =>
    request<Ticket>(`/tickets/${ticketId}`),

  createTicket: (data: TicketCreate) =>
    request<Ticket>("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTicket: (
    ticketId: number,
    data: TicketUpdate
  ) =>
    request<Ticket>(`/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  addComment: (
    ticketId: number,
    data: TicketCommentCreate
  ) =>
    request<TicketComment>(
      `/tickets/${ticketId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
};