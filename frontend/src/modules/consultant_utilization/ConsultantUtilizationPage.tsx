
import { useEffect, useState } from "react";
import { utilizationApi, type Project, type PersonalDashboard } from "./api";
import { UtilizationSummaryCard } from "./components/UtilizationSummaryCard";
import { TimeEntryForm } from "./components/TimeEntryForm";
import "./ConsultantUtilizationPage.css";

const CURRENT_EMPLOYEE_ID = "E1"; // TODO: replace once auth exists

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function ConsultantUtilizationPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboard, setDashboard] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const periodStart = isoDateNDaysAgo(7);
  const periodEnd = isoDateNDaysAgo(0);

  async function loadDashboard() {
    const [projectList, personalDashboard] = await Promise.all([
      utilizationApi.listProjects(),
      utilizationApi.getPersonalDashboard(CURRENT_EMPLOYEE_ID, periodStart, periodEnd),
    ]);
    setProjects(projectList);
    setDashboard(personalDashboard);
  }

  useEffect(() => {
    setLoading(true);
    loadDashboard()
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load your dashboard."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogHours(entry: { projectId: string; date: string; hours: number; billable: boolean }) {
    await utilizationApi.createTimeEntry({
      entry_id: `TE-${CURRENT_EMPLOYEE_ID}-${entry.projectId}-${entry.date}-${Date.now()}`,
      employee_id: CURRENT_EMPLOYEE_ID,
      project_id: entry.projectId,
      date: entry.date,
      hours: entry.hours,
      billable_flag: entry.billable,
    });
    await loadDashboard(); // refresh summary + trend after logging
  }

  if (loading) {
    return <div className="cu-page cu-page--status">Loading your utilization…</div>;
  }

  if (loadError) {
    return <div className="cu-page cu-page--status cu-page--error">Couldn't load this page: {loadError}</div>;
  }

  if (!dashboard) {
    return null;
  }

  const projectRows = (Object.entries(dashboard.hours_by_project) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const trendRows = (Object.entries(dashboard.weekly_trend) as [string, number][]).sort((a, b) =>
    a[0] > b[0] ? 1 : -1
  );
  const maxTrendHours = Math.max(1, ...trendRows.map(([, hours]) => hours));

  return (
    <div className="cu-page">
      <h1 className="cu-page__title">Consultant Utilization</h1>
      <p className="cu-page__subtitle">
        Last 7 days · {periodStart} to {periodEnd}
      </p>

      <UtilizationSummaryCard summary={dashboard.summary} />

      <div className="cu-page__grid">
        <section className="cu-panel">
          <h2 className="cu-panel__title">Hours by project</h2>
          {projectRows.length === 0 ? (
            <p className="cu-panel__empty">No hours logged in this period yet.</p>
          ) : (
            <table className="cu-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.map(([projectId, hours]) => (
                  <tr key={projectId}>
                    <td>{projects.find((p: Project) => p.project_id === projectId)?.name ?? projectId}</td>
                    <td>{hours.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="cu-panel">
          <h2 className="cu-panel__title">Weekly trend</h2>
          {trendRows.length === 0 ? (
            <p className="cu-panel__empty">Nothing to trend yet.</p>
          ) : (
            <div className="cu-trend">
              {trendRows.map(([week, hours]) => (
                <div className="cu-trend__row" key={week}>
                  <span className="cu-trend__label">{week}</span>
                  <div className="cu-trend__bar-track">
                    <div className="cu-trend__bar" style={{ width: `${(hours / maxTrendHours) * 100}%` }} />
                  </div>
                  <span className="cu-trend__value">{hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <TimeEntryForm projects={projects} onSubmit={handleLogHours} />
    </div>
  );
}
