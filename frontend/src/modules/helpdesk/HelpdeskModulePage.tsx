import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Inbox } from "lucide-react";

import { useAuth } from "../../shared/auth/AuthContext";
import { Toast } from "../../shared/components/Toast";
import {
  createTicket,
  listMyTickets,
  listQueue,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "./api";
import { CreateTicketForm } from "./components/CreateTicketForm";
import { TicketTable } from "./components/TicketTable";
import { QueueFilters } from "./components/QueueFilters";
import "../shared-theme.css";
import "./HelpdeskModulePage.css";

// Matches the backend's PRIVILEGED_TIERS exactly (require_privileged).
const PRIVILEGED_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);

export default function HelpdeskModulePage() {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const employeeId = employee?.employee_id;
  const isPrivileged = employee ? PRIVILEGED_TIERS.has(employee.access_tier) : false;

  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [queueTickets, setQueueTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<TicketCategory | "">("");
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "">("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "">("");
  const [filterMinAge, setFilterMinAge] = useState("");

  const loadMine = useCallback(async () => {
    if (!employeeId) return;
    try {
      setMyTickets(await listMyTickets(employeeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your tickets.");
    }
  }, [employeeId]);

  const loadQueue = useCallback(async () => {
    if (!employeeId || !isPrivileged) return;
    try {
      const tickets = await listQueue(
        {
          category: filterCategory || undefined,
          priority: filterPriority || undefined,
          status: filterStatus || undefined,
          minAgeHours: filterMinAge ? Number(filterMinAge) : undefined,
        },
        employeeId
      );
      setQueueTickets(tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the queue.");
    }
  }, [employeeId, isPrivileged, filterCategory, filterPriority, filterStatus, filterMinAge]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([loadMine(), loadQueue()]);
    setIsLoading(false);
  }, [loadMine, loadQueue]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleCreateTicket(category: TicketCategory, priority: TicketPriority, description: string) {
    if (!employee) return;
    try {
      await createTicket(category, priority, description, employee.employee_id);
      setSuccess("Ticket raised.");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not raise the ticket.");
    }
  }

  function handleClearFilters() {
    setFilterCategory("");
    setFilterPriority("");
    setFilterStatus("");
    setFilterMinAge("");
  }

  return (
    <div className="directory-page uzvi-portal-theme">
      <header className="directory-page__header">
        <div>
          <h1>Helpdesk</h1>
          <p className="directory-page__subtitle">
            Raise a support request and track it through to resolution.
          </p>
        </div>
      </header>

      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      {success && <Toast message={success} kind="success" onDismiss={() => setSuccess(null)} />}

      <section className="directory-page__list">
        <h2 className="directory-form__title">
          <Headphones size={16} className="training-icon-inline" />
          Raise a ticket
        </h2>
        <CreateTicketForm onCreate={handleCreateTicket} />
      </section>

      <section className="directory-page__list">
        <div className="directory-page__list-header">
          <h2>
            <Inbox size={18} className="training-icon-inline" />
            My tickets
          </h2>
        </div>
        {isLoading ? (
          <p className="directory-row__muted">Loading...</p>
        ) : (
          <TicketTable
            tickets={myTickets}
            emptyMessage="You haven't raised any tickets yet."
            onSelect={(id) => navigate(`/helpdesk/tickets/${id}`)}
          />
        )}
      </section>

      {isPrivileged && (
        <section className="directory-page__list">
          <div className="directory-page__list-header">
            <h2>Queue</h2>
          </div>
          <QueueFilters
            category={filterCategory}
            priority={filterPriority}
            status={filterStatus}
            minAgeHours={filterMinAge}
            onCategoryChange={setFilterCategory}
            onPriorityChange={setFilterPriority}
            onStatusChange={setFilterStatus}
            onMinAgeHoursChange={setFilterMinAge}
            onClear={handleClearFilters}
          />
          <TicketTable
            tickets={queueTickets}
            showAssignee
            emptyMessage="No tickets match these filters."
            onSelect={(id) => navigate(`/helpdesk/tickets/${id}`)}
          />
        </section>
      )}
    </div>
  );
}
