import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { helpdeskApi } from "./api";
import type { Ticket } from "./types";
import "./TicketListPage.css";

export default function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await helpdeskApi.listTickets();
        setTickets(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load tickets."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const openCount = tickets.filter(
    (ticket) => ticket.status.toLowerCase() === "open"
  ).length;

  const progressCount = tickets.filter((ticket) =>
    ticket.status.toLowerCase().includes("progress")
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status.toLowerCase() === "resolved"
  ).length;

  const filteredTickets = useMemo(() => {
    const value = search.toLowerCase();

    return tickets.filter(
      (ticket) =>
        ticket.ticket_id.toString().includes(value) ||
        ticket.category.toLowerCase().includes(value) ||
        ticket.priority.toLowerCase().includes(value) ||
        ticket.status.toLowerCase().includes(value) ||
        ticket.raised_by.toLowerCase().includes(value)
    );
  }, [tickets, search]);

  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "high";

      case "medium":
        return "medium";

      default:
        return "low";
    }
  };

  const getStatusClass = (status: string) => {
    if (status.toLowerCase() === "open") return "open";

    if (status.toLowerCase().includes("progress"))
      return "progress";

    return "resolved";
  };

  if (loading) {
    return (
      <div className="ticket-loading">
        Loading tickets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-error">
        {error}
      </div>
    );
  }

  return (
    <div className="ticket-list-page">

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-dot open"></span>
            <span className="stat-heading">
              Open Tickets
            </span>
          </div>

          <h2>{openCount}</h2>

          <p>Awaiting action</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-dot progress"></span>
            <span className="stat-heading">
              In Progress
            </span>
          </div>

          <h2>{progressCount}</h2>

          <p>Currently assigned</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-dot resolved"></span>
            <span className="stat-heading">
              Resolved
            </span>
          </div>

          <h2>{resolvedCount}</h2>

          <p>Successfully completed</p>
        </div>

      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <div className="ticket-card">

        <div className="ticket-card-header">
          <div>
            <h3>Your Tickets</h3>
            <span>
              {filteredTickets.length} tickets
            </span>
          </div>
        </div>

        <div className="table-header">

          <span>Ticket</span>

          <span>Category</span>

          <span>Priority</span>

          <span>Status</span>

        </div>
          {filteredTickets.length === 0 ? (

          <div className="empty-state">
            <h4>No tickets found</h4>
            <p>
              Try a different search or create a new ticket.
            </p>
          </div>

        ) : (

          filteredTickets.map((ticket) => (

            <div
              className="ticket-item"
              key={ticket.ticket_id}
              onClick={() => navigate(`/helpdesk/tickets/${ticket.ticket_id}`)}
            >

              <div className="ticket-id">
                #{ticket.ticket_id}
              </div>

              <div className="ticket-category">
                {ticket.category}
              </div>

              <div>
                <span
                  className={`priority-badge ${getPriorityClass(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </span>
              </div>

              <div className="ticket-status">

                <span
                  className={`status-badge ${getStatusClass(
                    ticket.status
                  )}`}
                >
                  {ticket.status}
                </span>

                <span className="arrow">
                  →
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}