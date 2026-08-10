import { useState } from "react";
import "./HelpdeskModulePage.css";

import TicketListPage from "./TicketListPage";
import CreateTicketPage from "./CreateTicketPage";
import { useAuth } from "../../shared/auth/AuthContext";
import { isHelpdeskPrivileged } from "./roles";

export default function HelpdeskModulePage() {
  const { employee } = useAuth();
  const privileged = isHelpdeskPrivileged(employee?.access_tier);

  const [activeTab, setActiveTab] = useState<"tickets" | "create">("tickets");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTicketCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab("tickets");
  };

  return (
    <div className="helpdesk-page">
      <div className="helpdesk-header">
        <div>
          <h1>Helpdesk</h1>
          <p>
            {privileged
              ? "Manage the full support ticket queue and track SLA status."
              : "Raise support tickets and track the status of your own requests."}
          </p>
        </div>
        {privileged && (
          <span className="helpdesk-role-badge">{employee?.access_tier} view</span>
        )}
      </div>

      <div className="helpdesk-tabs">
        <button
          className={activeTab === "tickets" ? "active" : ""}
          onClick={() => setActiveTab("tickets")}
        >
          Tickets
        </button>

        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          Create Ticket
        </button>
      </div>

      <div className="helpdesk-content">
        {activeTab === "tickets" ? (
          <TicketListPage key={refreshKey} />
        ) : (
          <CreateTicketPage
            onTicketCreated={handleTicketCreated}
            onCancel={() => setActiveTab("tickets")}
          />
        )}
      </div>
    </div>
  );
}