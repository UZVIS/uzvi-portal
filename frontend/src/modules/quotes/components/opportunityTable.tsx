import { useState } from "react";
import { Plus, FolderOpen, Pencil, Trash2, Inbox } from "lucide-react";
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

      <div className="table-toolbar">

        <div className="search-wrap">

          <input
            type="text"
            placeholder="Search opportunity..."
            className="search-input"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="toolbar-spacer" />

        <button
          className="add-btn"
          onClick={onAddOpportunity}
        >
          <Plus size={18} />
          New Opportunity
        </button>

      </div>

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

                <td>

                  <div className="opp-name">

                    {item.name}

                  </div>

                </td>

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

                <td>

                  <span className="badge badge-zero">

                    {item.scenarioCount ?? 0}{" "}

                    {(item.scenarioCount ?? 0) === 1
                      ? "scenario"
                      : "scenarios"}

                  </span>

                </td>

                <td className="date-cell">

                  {formatDate()}

                </td>

                <td className="action-buttons">

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

                  

                  

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      {opportunities.length > 0 && (

        <div className="table-footer">

          <span>

            Showing {filteredOpportunities.length} of {opportunities.length} opportunities

          </span>

        </div>

      )}

    </div>

  );

}