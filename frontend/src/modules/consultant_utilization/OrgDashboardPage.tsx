
import { useEffect, useState } from "react";
import { utilizationApi, type OrgUtilizationDashboard } from "./api";
import "./OrgDashboardPage.css";

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function OrgDashboardPage() {
  const [periodStart, setPeriodStart] = useState(() => isoDateNDaysAgo(7));
  const [periodEnd, setPeriodEnd] = useState(() => isoDateNDaysAgo(0));
  const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState("40");

  const [dashboard, setDashboard] = useState<OrgUtilizationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function load(start: string, end: string, capacity: number) {
    setLoading(true);
    setLoadError(null);
    utilizationApi
      .getOrgDashboard(start, end, capacity)
      .then(setDashboard)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load the org dashboard."))
      .finally(() => setLoading(false));
  }

  // Initial load with the default "last 7 days" window.
  useEffect(() => {
    load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!periodStart || !periodEnd) return;
    load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
  }

  return (
    <div className="od-page">
      <h1 className="od-page__title">Org Utilization Dashboard</h1>
      <p className="od-page__subtitle">Admin/Leadership view (not yet role-restricted)</p>

      <form className="od-filters" onSubmit={handleApply}>
        <label>
          Start date
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </label>
        <label>
          Capacity hrs/week
          <input
            type="number"
            min="1"
            value={capacityHoursPerWeek}
            onChange={(e) => setCapacityHoursPerWeek(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </button>
      </form>

      {loadError && <p className="od-page__error">Couldn't load this page: {loadError}</p>}

      {loading && !dashboard && <p className="od-page__loading">Loading org dashboard…</p>}

      {dashboard && (
        <>
          <p className="od-page__range">
            Showing {dashboard.period_start} to {dashboard.period_end}
          </p>

          <div className="od-page__flags">
            <div className="od-flag od-flag--warn">
              <div className="od-flag__count">{dashboard.bench_risk.length}</div>
              <div className="od-flag__label">Bench-risk (under-utilized)</div>
              <div className="od-flag__ids">{dashboard.bench_risk.join(", ") || "—"}</div>
            </div>
            <div className="od-flag od-flag--danger">
              <div className="od-flag__count">{dashboard.over_allocated.length}</div>
              <div className="od-flag__label">Over-allocated</div>
              <div className="od-flag__ids">{dashboard.over_allocated.join(", ") || "—"}</div>
            </div>
          </div>

          <section className="od-panel">
            <h2 className="od-panel__title">Utilization by employee</h2>
            {dashboard.utilization_by_employee.length === 0 ? (
              <p className="od-panel__empty">No time entries logged in this period yet.</p>
            ) : (
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Billable hours</th>
                    <th>Available hours</th>
                    <th>Utilization</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.utilization_by_employee.map((u) => (
                    <tr key={u.employee_id}>
                      <td>{u.employee_id}</td>
                      <td>{u.billable_hours.toFixed(1)}h</td>
                      <td>{u.available_hours.toFixed(1)}h</td>
                      <td>{Math.round(u.utilization_pct * 100)}%</td>
                      <td>{u.flag ?? "on track"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="od-panel">
            <h2 className="od-panel__title">Project margins</h2>
            {dashboard.project_margins.length === 0 ? (
              <p className="od-panel__empty">No projects yet.</p>
            ) : (
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.project_margins.map((m) => (
                    <tr key={m.project_id}>
                      <td>{m.project_name}</td>
                      <td>₹{m.revenue.toLocaleString()}</td>
                      <td>₹{m.cost.toLocaleString()}</td>
                      <td>₹{m.margin.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
