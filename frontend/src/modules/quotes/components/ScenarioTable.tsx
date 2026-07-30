import { useState } from "react";

import {
  FolderOpen,
  Pencil,
  Trash2,
  FileText,
  ClipboardList,
  FolderPlus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { QuoteScenario } from "../types/quote";

interface ScenarioTableProps {
  scenarios: QuoteScenario[];
  onNewScenario?: () => void;
  onDeleteScenario?: (scenarioId: string) => void;
  onEditScenario?: (scenario: QuoteScenario) => void;
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function OutputTypeBadge({ type }: { type: QuoteScenario["output_type"] }) {
  if (type === "tender") {
    return (
      <span className="badge badge-tender">
        <ClipboardList size={13} />
        Tender
      </span>
    );
  }
  return (
    <span className="badge badge-quote">
      <FileText size={13} />
      Quote
    </span>
  );
}

export default function ScenarioTable({
  scenarios,
  onNewScenario,
  onDeleteScenario,
   onEditScenario,
}: ScenarioTableProps) {

  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="table-card">

      <div className="table-toolbar">

        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search scenarios..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        

        <div className="toolbar-spacer" />

      </div>

      <table className="data-table">

        <thead>
          <tr>
            <th>Scenario Name</th>
            <th>Output Type</th>
            <th>Target Margin</th>
            <th>Last Updated</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredScenarios.length === 0 ? (

            <tr>
              <td colSpan={5}>
                <div className="empty-state">
                  <div className="empty-icon">
                    <FolderPlus size={28} />
                  </div>
                  <h3>No scenarios have been created for this opportunity.</h3>
                  {onNewScenario && (
                    <button className="add-btn" onClick={onNewScenario}>
                      <FolderPlus size={16} />
                      Create First Scenario
                    </button>
                  )}
                </div>
              </td>
            </tr>

          ) : (

            filteredScenarios.map((scenario) => (

              <tr key={scenario.scenario_id}>

                <td className="opp-name">{scenario.name}</td>

                <td>
                  <OutputTypeBadge type={scenario.output_type} />
                </td>

                <td className="margin-cell">
                  {(scenario.target_margin * 100).toFixed(1)}%
                </td>

                <td className="date-cell">
                  {formatDate(scenario.created_at)}
                </td>

                <td className="action-buttons">

                  <button
                    className="icon-btn"
                    title="Open Scenario"
                    onClick={() =>
                      navigate(
                        `/quotes/scenario/${scenario.scenario_id}`
                      )
                    }
                  >
                    <FolderOpen size={17} />
                  </button>

                 <button
  className="icon-btn"
  title="Edit"
  onClick={() => onEditScenario?.(scenario)}
>
  <Pencil size={17} />
</button>

                 <button
  className="icon-btn icon-btn-danger"
  title="Delete"
  onClick={() =>
    onDeleteScenario?.(scenario.scenario_id)
  }
>
  <Trash2 size={17} />
</button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      {filteredScenarios.length > 0 && (
        <div className="table-footer table-footer-pagination">
          <span>
            Showing {filteredScenarios.length} of {scenarios.length} scenarios
          </span>
          {/* <div className="pagination-bar">
            <button className="page-btn" disabled>Previous</button>
            <button className="page-btn page-btn-current">1</button>
            <button className="page-btn">Next</button>
          </div> */}
        </div>
      )}

    </div>
  );
}