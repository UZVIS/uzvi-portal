import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { useAuth } from "../../shared/auth/AuthContext";
import { Toast } from "../../shared/components/Toast";
import { getTicket, updateTicketStatus, reassignTicket, addComment, formatTicketId, type Ticket, type TicketStatus } from "./api";
import { CommentThread } from "./components/CommentThread";
import { StatusControls } from "./components/StatusControls";
import { ReassignControl } from "./components/ReassignControl";
import "../shared-theme.css";
import "./TicketDetailsPage.css";

const PRIVILEGED_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);

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

export default function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { employee } = useAuth();
  const navigate = useNavigate();
  const ticketIdNum = Number(ticketId);
  const employeeId = employee?.employee_id;

  const isPrivileged = employee ? PRIVILEGED_TIERS.has(employee.access_tier) : false;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRaiser = !!(employee && ticket && employee.employee_id === ticket.raised_by);
  const isAssignee = !!(employee && ticket && employee.employee_id === ticket.assigned_to);
  const canComment = isRaiser || isAssignee || isPrivileged;

  const loadTicket = useCallback(async () => {
    if (!employeeId || !Number.isFinite(ticketIdNum)) return;
    setIsLoading(true);
    setError(null);
    try {
      setTicket(await getTicket(ticketIdNum, employeeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That ticket wasn't found.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, ticketIdNum]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  async function handleStatusChange(status: TicketStatus) {
    if (!employee) return;
    try {
      await updateTicketStatus(ticketIdNum, status, employee.employee_id);
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the status.");
    }
  }

  async function handleReassign(assignedTo: string) {
    if (!employee) return;
    try {
      await reassignTicket(ticketIdNum, assignedTo, employee.employee_id);
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reassign the ticket.");
    }
  }

  async function handleAddComment(comment: string) {
    if (!employee) return;
    try {
      await addComment(ticketIdNum, comment, employee.employee_id);
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the comment.");
    }
  }

  if (isLoading) {
    return (
      <div className="directory-page uzvi-portal-theme">
        <p className="directory-row__muted">Loading...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="directory-page uzvi-portal-theme">
        {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
        <p className="directory-row__muted">That ticket wasn't found.</p>
      </div>
    );
  }

  return (
    <div className="directory-page uzvi-portal-theme">
      <button type="button" className="button-secondary back-button" onClick={() => navigate("/helpdesk")}>
        <ArrowLeft size={14} /> Back to Helpdesk
      </button>

      <header className="directory-page__header">
        <div>
          <h1>Ticket {formatTicketId(ticket.ticket_id)}</h1>
          <div className="ticket-details__badges">
            <span className="status-badge status-badge--info">{ticket.category}</span>
            <span className={`status-badge ${PRIORITY_BADGE[ticket.priority]}`}>{ticket.priority}</span>
            <span className={`status-badge ${STATUS_BADGE[ticket.status]}`}>{ticket.status}</span>
          </div>
        </div>
      </header>

      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}

      {ticket.sla_breached && (
        <div className="ticket-details__sla-banner">
          <AlertTriangle size={16} />
          This ticket has breached its SLA response window.
        </div>
      )}

      <section className="directory-page__list">
        <h2 className="directory-form__title">Description</h2>
        <p className="ticket-details__description">{ticket.description}</p>
        <dl className="ticket-details__meta">
          <dt>Raised by</dt>
          <dd>{ticket.raised_by}</dd>
          <dt>Assigned to</dt>
          <dd>{ticket.assigned_to ?? "Unassigned"}</dd>
          <dt>Created</dt>
          <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
          <dt>Last updated</dt>
          <dd>{new Date(ticket.updated_at).toLocaleString()}</dd>
        </dl>
      </section>

      {isPrivileged && (
        <section className="directory-page__list">
          <h2 className="directory-form__title">Manage</h2>
          <StatusControls status={ticket.status} onChange={handleStatusChange} />
          <ReassignControl
            currentAssignee={ticket.assigned_to}
            viewerId={employeeId}
            onReassign={handleReassign}
          />
        </section>
      )}

      <section className="directory-page__list">
        <h2 className="directory-form__title">Activity</h2>
        <CommentThread comments={ticket.comments} canComment={canComment} onAddComment={handleAddComment} />
      </section>
    </div>
  );
}
