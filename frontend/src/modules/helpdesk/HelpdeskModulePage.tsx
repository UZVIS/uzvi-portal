import { useState } from "react";
import "./HelpdeskModulePage.css";

import TicketListPage from "./TicketListPage";
import CreateTicketPage from "./CreateTicketPage";

export default function HelpdeskModulePage() {
  const [activeTab, setActiveTab] = useState<"tickets" | "create">("tickets");

  return (
    <div className="helpdesk-page">
      <div className="helpdesk-header">
        <div>
          <h1>Helpdesk</h1>
          <p>Manage support tickets and track their status.</p>
        </div>
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
          <TicketListPage />
        ) : (
          <CreateTicketPage />
        )}
      </div>
    </div>
  );
}