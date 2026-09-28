import { useEffect, useState } from "react";
import type { CohortProgress } from "../api";
import { listActiveEmployees } from "../../directory/api";

interface CohortTableProps {
  cohort: CohortProgress;
}

// Reuses Directory's own tier-badge color classes for visual consistency -
// the CSS class suffix is the tier name lowercased with "/" as "-".
function tierBadgeClass(accessTier: string): string {
  return `tier-badge--${accessTier.toLowerCase().replace(/\//g, "-")}`;
}

// Short label matching how tiers already appear elsewhere in this module
// (e.g. ProgramCard just says "Admin", not the full "Admin/Leadership").
function tierShortLabel(accessTier: string): string {
  if (accessTier === "Admin/Leadership") return "Admin";
  if (accessTier === "HR-Restricted") return "HR";
  return accessTier;
}

export function CohortTable({ cohort }: CohortTableProps) {
  const [tierByEmployee, setTierByEmployee] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    listActiveEmployees()
      .then((all) => setTierByEmployee(new Map(all.map((e) => [e.employee_id, e.access_tier]))))
      .catch(() => setTierByEmployee(new Map()));
  }, []);

  if (cohort.employees.length === 0) {
    return <p className="directory-row__muted">No one is enrolled in this program yet.</p>;
  }

  return (
    <div className="directory-table__scroll table-scroll-bounded">
      <table className="directory-table directory-table--compact">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Progress</th>
            <th>Completion</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {cohort.employees.map((row) => {
            const tier = tierByEmployee.get(row.employee_id);
            return (
              <tr className="directory-row" key={row.employee_id}>
                <td>
                  <div className="cohort-table__name-row">
                    <span className="directory-row__name">{row.employee_name ?? row.employee_id}</span>
                    {tier && (
                      <span className={`tier-badge ${tierBadgeClass(tier)}`}>{tierShortLabel(tier)}</span>
                    )}
                  </div>
                  <div className="directory-row__id">{row.employee_id}</div>
                </td>
                <td>
                  {row.completed_units} / {row.total_units} units
                </td>
                <td>{Math.round(row.completion_pct)}%</td>
                <td>
                  {row.flagged_behind ? (
                    <span className="status-badge status-badge--warning">Falling behind</span>
                  ) : (
                    <span className="directory-row__muted">On track</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="cohort-median">Cohort median: {Math.round(cohort.median_completion_pct)}%</p>
    </div>
  );
}
