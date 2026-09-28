import type { Ticket } from "../api";
import { formatTicketId } from "../api";

interface TicketTableProps {
  tickets: Ticket[];
  showAssignee?: boolean;
  emptyMessage: string;
  onSelect: (ticketId: number) => void;
}

const PRIORITY_BADGE: Record<string, string> = {
  High: "status-badge--danger",
  Medium: "status-badge--warning",
  Low: "status-badge--muted",
};

const STATUS_BADGE: Record<string, string> = {
  Open: "status-badge--info",
  "In Progress": "status-badge--warning",
  Resolved: "status-badge--success",
  Closed: "status-badge--muted",
};

export function TicketTable({ tickets, showAssignee, emptyMessage, onSelect }: TicketTableProps) {
  if (tickets.length === 0) {
    return <p className="directory-row__muted">{emptyMessage}</p>;
  }

  return (
    <div className="directory-table__scroll table-scroll-bounded">
      <table className="directory-table directory-table--compact ticket-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            {showAssignee && <th>Assigned to</th>}
            <th>Raised</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr className="directory-row ticket-row" key={ticket.ticket_id} onClick={() => onSelect(ticket.ticket_id)}>
              <td className="directory-row__id">{formatTicketId(ticket.ticket_id)}</td>
              <td>{ticket.category}</td>
              <td>
                <span className={`status-badge ${PRIORITY_BADGE[ticket.priority] ?? ""}`}>{ticket.priority}</span>
              </td>
              <td>
                <span className={`status-badge ${STATUS_BADGE[ticket.status] ?? ""}`}>{ticket.status}</span>
                {ticket.sla_breached && (
                  <span className="sla-dot" title="SLA breached" aria-label="SLA breached" />
                )}
              </td>
              {showAssignee && <td>{ticket.assigned_to ?? "Unassigned"}</td>}
              <td className="directory-row__muted">{new Date(ticket.created_at).toLocaleDateString()}</td>
              <td className="ticket-row__chevron">&rsaquo;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
