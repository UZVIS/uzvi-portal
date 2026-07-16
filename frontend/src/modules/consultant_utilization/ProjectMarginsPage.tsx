/**
 * M1 - Consultant Utilization Tracker
 * frontend/src/modules/consultant_utilization/ProjectMarginsPage.tsx
 *
 * FR-UTL-04: per-project revenue, cost, and margin from logged hours and
 * billing/cost rates.
 */
import { useEffect, useState } from "react";
import { utilizationApi, type Project, type ProjectMargin } from "./api";
import "./ProjectMarginsPage.css";

export function ProjectMarginsPage() {
  const [margins, setMargins] = useState<ProjectMargin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    utilizationApi
      .listProjects()
      .then((projects: Project[]) =>
        Promise.all(projects.map((p) => utilizationApi.getProjectMargin(p.project_id)))
      )
      .then(setMargins)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load project margins."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="pm-page pm-page--status">Loading project margins…</div>;
  }

  if (loadError) {
    return <div className="pm-page pm-page--status pm-page--error">Couldn't load this page: {loadError}</div>;
  }

  return (
    <div className="pm-page">
      <h1 className="pm-page__title">Project Margins</h1>
      <p className="pm-page__subtitle">Revenue, cost, and margin computed from logged hours × billing/cost rates.</p>

      {margins.length === 0 ? (
        <p className="pm-page__empty">No projects yet.</p>
      ) : (
        <table className="pm-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Margin</th>
              <th>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {margins.map((m) => (
              <tr key={m.project_id}>
                <td>{m.project_name}</td>
                <td>₹{m.revenue.toLocaleString()}</td>
                <td>₹{m.cost.toLocaleString()}</td>
                <td className={m.margin < 0 ? "pm-table__negative" : ""}>₹{m.margin.toLocaleString()}</td>
                <td>{m.margin_pct != null ? `${Math.round(m.margin_pct * 100)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
