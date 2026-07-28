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

  return (
    <div className="table-card">

      <div className="table-toolbar">

        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search opportunity..."
            className="search-input"
          />
        </div>

        {/* <button className="filter-chip" disabled>
          Status <span className="soon-tag">Soon</span>
        </button>

        <button className="filter-chip" disabled>
          Client <span className="soon-tag">Soon</span>
        </button> */}

        <div className="toolbar-spacer" />

        <button className="add-btn" onClick={onAddOpportunity}>
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
            <th className="col-actions">Actions</th>
          </tr>
        </thead>

        <tbody>

          {opportunities.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="empty-state">
                  <div className="empty-icon">
                    <Inbox size={28} />
                  </div>
                  <h3>No opportunities yet</h3>
                  <p>
                    Create your first opportunity to start building quote
                    scenarios and generating tenders for a client.
                  </p>
                  <button className="add-btn" onClick={onAddOpportunity}>
                    <Plus size={16} />
                    Create Opportunity
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            opportunities.map((item) => (
              <tr key={item.opportunity_id}>

                <td>
                  <div className="opp-name">{item.name}</div>
                  {/* <div className="opp-meta">{item.opportunity_id}</div> */}
                </td>

                <td>
                  <div className="client-cell">
                    <div className="client-avatar">
                      {getInitials(item.client)}
                    </div>
                    <span>{item.client}</span>
                  </div>
                </td>

                <td>
                  <span className="badge badge-zero">0 scenarios</span>
                </td>

                <td className="date-cell">{formatDate()}</td>

                <td className="action-buttons">
                  <button
                    className="icon-btn"
                    title="Open Opportunity"
                    onClick={() =>
                      navigate(`/quotes/opportunity/${item.opportunity_id}`)
                    }
                  >
                    <FolderOpen size={16} />
                  </button>

                  <button
                    className="icon-btn"
                    title="Edit Opportunity"
                    onClick={() =>
                      navigate(
                        `/quotes/opportunity/${item.opportunity_id}/edit`
                      )
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="icon-btn icon-btn-danger"
                    title="Delete Opportunity"
                  >
                    <Trash2 size={16} />
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
            Showing {opportunities.length} of {opportunities.length}{" "}
            opportunities
          </span>
        </div>
      )}

    </div>
  );
}