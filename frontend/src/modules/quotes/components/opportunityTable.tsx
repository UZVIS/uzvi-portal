import { useState } from "react";
import {
  Plus,
  Search,
  FolderOpen,
  Inbox,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Opportunity } from "../types/quote";

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onAddOpportunity: () => void;
}

function formatDate(value?: string | Date) {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function OpportunityTable({
  opportunities,
  onAddOpportunity,
}: OpportunityTableProps) {

  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const filteredOpportunities = opportunities.filter(
    (item) =>
      item.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.client
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="table-card">

      {/* =========================
          TOOLBAR
      ========================= */}
      <div className="table-toolbar">

        {/* Search */}
        <div className="opportunity-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-spacer" />

        {/* New Opportunity */}
        <button
          className="add-btn"
          onClick={onAddOpportunity}
        >
          <Plus size={18} />
          New Opportunity
        </button>

      </div>

      {/* =========================
          TABLE
      ========================= */}
      <table className="data-table">

        <thead>
          <tr>
            <th>Opportunity</th>
            <th>Client</th>
            <th>Scenarios</th>
            <th>Created</th>
            <th className="col-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>

          {filteredOpportunities.length === 0 ? (

            <tr>
              <td colSpan={5}>

                <div className="empty-state">

                  <div className="empty-icon">
                    <Inbox size={28} />
                  </div>

                  <h3>
                    {search
                      ? "No matching opportunities"
                      : "No opportunities yet"}
                  </h3>

                  <p>
                    {search
                      ? "Try a different search."
                      : "Create your first opportunity to start building quote scenarios and generating tenders for a client."}
                  </p>

                  {!search && (
                    <button
                      className="add-btn"
                      onClick={onAddOpportunity}
                    >
                      <Plus size={16} />
                      Create Opportunity
                    </button>
                  )}

                </div>

              </td>
            </tr>

          ) : (

            filteredOpportunities.map((item) => (

              <tr key={item.opportunity_id}>

                {/* Opportunity */}
                <td>
                  <div className="opp-name">
                    {item.name}
                  </div>
                </td>

                {/* Client */}
                <td>
                  <div className="client-cell">

                    <div className="client-avatar">
                      {getInitials(item.client)}
                    </div>

                    <span>
                      {item.client}
                    </span>

                  </div>
                </td>

                {/* Scenarios */}
                <td>
                  <span className="badge badge-zero">
                    {item.scenarioCount ?? 0}{" "}

                    {(item.scenarioCount ?? 0) === 1
                      ? "scenario"
                      : "scenarios"}
                  </span>
                </td>

                {/* Created */}
                <td className="date-cell">
                  {formatDate()}
                </td>

                {/* Actions */}
                <td>
                  <div className="action-buttons">

                    <button
                      className="icon-btn"
                      title="Open Opportunity"
                      onClick={() =>
                        navigate(
                          `/quotes/opportunity/${item.opportunity_id}`
                        )
                      }
                    >
                      <FolderOpen size={16} />
                    </button>

                  </div>
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      {/* =========================
          FOOTER
      ========================= */}
      {opportunities.length > 0 && (
        <div className="table-footer">

          <span>
            Showing {filteredOpportunities.length} of{" "}
            {opportunities.length} opportunities
          </span>

        </div>
      )}

    </div>
  );
}