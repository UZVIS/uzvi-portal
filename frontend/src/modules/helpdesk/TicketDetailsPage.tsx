import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { helpdeskApi } from "./api";
import type { Ticket } from "./types";

import "./TicketDetailsPage.css";

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [authorId, setAuthorId] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) return;

      try {
        const data = await helpdeskApi.getTicket(
          Number(ticketId)
        );

        setTicket(data);
        setSelectedStatus(data.status);
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

            const updatedTicket = await helpdeskApi.updateStatus(
            ticket.ticket_id,
            {
                status: selectedStatus,
            }
            );

            setTicket(updatedTicket);
            setSelectedStatus(updatedTicket.status);

            alert("Status updated successfully.");
        } catch (err) {
            alert(
            err instanceof Error
                ? err.message
                : "Failed to update status."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleAddComment() {
        if (!ticket) return;

        if (!authorId.trim() || !comment.trim()) {
            alert("Please enter Author ID and Comment.");
            return;
        }

        try {
            await helpdeskApi.addComment(ticket.ticket_id, {
            author_id: authorId,
            comment,
            });

            setAuthorId("");
            setComment("");

            const updatedTicket = await helpdeskApi.getTicket(
            ticket.ticket_id
            );

            setTicket(updatedTicket);

            alert("Comment added successfully.");
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
      onClick={() => navigate("/helpdesk")}
    >
      ← Back to Tickets
    </button>

    <div className="details-card">

      <h1>Ticket #{ticket.ticket_id}</h1>

      <div className="details-grid">

        <div className="detail-item">
          <span>Category</span>
          <strong>{ticket.category}</strong>
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
              ticket.status.toLowerCase() === "open"
                ? "open"
                : ticket.status.toLowerCase().includes("progress")
                ? "progress"
                : "resolved"
            }`}
          >
            {ticket.status}
          </span>

        </div>

        <div className="detail-item">
          <span>Raised By</span>
          <strong>{ticket.raised_by}</strong>
        </div>

        <div className="detail-item">
          <span>Assigned To</span>
          <strong>
            {ticket.assigned_to ?? "Not Assigned"}
          </strong>
        </div>

      </div>

    </div>

    <div className="description-card">

      <h2>Description</h2>

      <p>{ticket.description}</p>

    </div>
    
    <div className="status-update-card">

    <h2>Update Status</h2>

    <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
    >
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
    </select>

    <button
        className="save-button"
        onClick={handleStatusUpdate}
        disabled={saving}
    >
        {saving ? "Saving..." : "Save Changes"}
    </button>

    </div>
    <div className="comments-card">

        <h2>Comments</h2>

        {ticket.comments.length === 0 ? (
            <p>No comments yet.</p>
        ) : (
            <div className="comments-list">

            {ticket.comments.map((item) => (
                <div
                key={item.comment_id}
                className="comment-item"
                >
                <div className="comment-header">

                    <strong>{item.author_id}</strong>

                    <span>
                    {new Date(item.created_at).toLocaleString()}
                    </span>

                </div>

                <p>{item.comment}</p>
                </div>
            ))}

            </div>
        )}

        <div className="comment-form">

            <input
            type="text"
            placeholder="Author ID"
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            />

            <textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
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