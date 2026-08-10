import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { helpdeskApi } from "./api";
import type { Ticket } from "./types";
import { useAuth } from "../../shared/auth/AuthContext";
import { isHelpdeskPrivileged } from "./roles";

import "./TicketDetailsPage.css";

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { employee } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [comment, setComment] =
    useState("");

  // Mirrors the backend rule in change_ticket_status: only a privileged
  // tier or the ticket's assigned owner may update status/assignment
  // (FR-HLP-05). Everyone else gets a read-only view of this ticket.
  const privileged = isHelpdeskPrivileged(employee?.access_tier);
  const canManage =
    !!ticket &&
    (privileged || employee?.employee_id === ticket.assigned_to);

  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) return;

      try {
        const data =
          await helpdeskApi.getTicket(
            Number(ticketId)
          );

        setTicket(data);
        setSelectedStatus(data.status);
        setAssignedTo(
          data.assigned_to ?? ""
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load ticket."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketId]);

  async function handleStatusUpdate() {
    if (!ticket) return;

    try {
      setSaving(true);

      const updatedTicket =
        await helpdeskApi.updateTicket(
          ticket.ticket_id,
          {
            status: selectedStatus,
            assigned_to:
              assignedTo.trim() || null,
          }
        );

      setTicket(updatedTicket);

      setSelectedStatus(
        updatedTicket.status
      );

      setAssignedTo(
        updatedTicket.assigned_to ?? ""
      );

      alert(
        "Ticket updated successfully."
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update ticket."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment() {
    if (!ticket) return;

    if (!employee?.employee_id) {
      alert("You need to be signed in to comment.");
      return;
    }

    if (!comment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    try {
      await helpdeskApi.addComment(
        ticket.ticket_id,
        {
          author_id: employee.employee_id,
          comment,
        }
      );

      setComment("");

      const updatedTicket =
        await helpdeskApi.getTicket(
          ticket.ticket_id
        );

      setTicket(updatedTicket);

      alert(
        "Comment added successfully."
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to add comment."
      );
    }
  }

  if (loading) {
    return (
      <div className="ticket-details-page">
        Loading ticket...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-details-page">
        {error}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-details-page">
        Ticket not found.
      </div>
    );
  }

  return (
    <div className="ticket-details-page">

      <button
        className="back-button"
        onClick={() =>
          navigate("/helpdesk")
        }
      >
        ← Back to Tickets
      </button>

      <div className="details-card">

        <h1>
          Ticket #{ticket.ticket_id}
        </h1>

        <div className="details-grid">

          <div className="detail-item">
            <span>Category</span>
            <strong>
              {ticket.category}
            </strong>
          </div>

          <div className="detail-item">
            <span>Priority</span>

            <span
              className={`priority-badge ${ticket.priority.toLowerCase()}`}
            >
              {ticket.priority}
            </span>
          </div>

          <div className="detail-item">
            <span>Status</span>

            <span
              className={`status-badge ${
                ticket.status.toLowerCase() ===
                "open"
                  ? "open"
                  : ticket.status
                      .toLowerCase()
                      .includes(
                        "progress"
                      )
                  ? "progress"
                  : "resolved"
              }`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="detail-item">
            <span>SLA Status</span>

            {ticket.sla_breached ? (
              <span className="sla-badge breached">
                SLA Breached
              </span>
            ) : (
              <span className="status-badge resolved">
                Within SLA
              </span>
            )}
          </div>

          <div className="detail-item">
            <span>Raised By</span>

            <strong>
              {ticket.raised_by}
            </strong>
          </div>

          <div className="detail-item">
            <span>
              Assigned To
            </span>

            {canManage ? (
              <input
                type="text"
                value={assignedTo}
                placeholder="Assign employee"
                onChange={(e) =>
                  setAssignedTo(
                    e.target.value
                  )
                }
              />
            ) : (
              <strong>
                {ticket.assigned_to || "Unassigned"}
              </strong>
            )}
          </div>

        </div>

      </div>
            <div className="description-card">
        <h2>Description</h2>

        <p>{ticket.description}</p>
      </div>

      {canManage ? (
        <div className="status-update-card">
          <h2>Update Ticket</h2>

          <div className="form-group">
            <label>Status</label>

            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value
                )
              }
            >
              <option value="Open">
                Open
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Resolved">
                Resolved
              </option>
            </select>
          </div>

          <button
            className="save-button"
            onClick={handleStatusUpdate}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      ) : (
        <div className="status-update-card readonly-note">
          <h2>Update Ticket</h2>
          <p>
            Only the assigned owner or a Manager/Admin-Leadership/HR-Restricted
            account can change this ticket's status or assignment.
          </p>
        </div>
      )}

      <div className="comments-card">
        <h2>Comments</h2>

        {ticket.comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <div className="comments-list">
            {ticket.comments.map(
              (item) => (
                <div
                  key={item.comment_id}
                  className="comment-item"
                >
                  <div className="comment-header">
                    <strong>
                      {item.author_id}
                    </strong>

                    <span>
                      {new Date(
                        item.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <p>{item.comment}</p>
                </div>
              )
            )}
          </div>
        )}

        <div className="comment-form">
          <textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) =>
              setComment(
                e.target.value
              )
            }
            rows={4}
          />

          <button
            className="save-button"
            onClick={handleAddComment}
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
}