
import { useEffect, useState } from "react";
import { utilizationApi, type Project, type TimeEntry } from "./api";
import "./OTApprovalsPage.css";

export function OTApprovalsPage() {
  const [pending, setPending] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadAll() {
    const [pendingList, projectList] = await Promise.all([
      utilizationApi.listPendingOT(),
      utilizationApi.listProjects(),
    ]);
    setPending(pendingList);
    setProjects(projectList);
  }

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load pending overtime."))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(entryId: string) {
    setActionError(null);
    try {
      await utilizationApi.approveOT(entryId);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't approve this overtime.");
    }
  }

  async function handleReject(entryId: string) {
    setActionError(null);
    try {
      await utilizationApi.rejectOT(entryId);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't reject this overtime.");
    }
  }

  if (loading) {
    return <div className="ota-page ota-page--status">Loading pending overtime…</div>;
  }

  if (loadError) {
    return <div className="ota-page ota-page--status ota-page--error">Couldn't load this page: {loadError}</div>;
  }

  return (
    <div className="ota-page">
      <h1 className="ota-page__title">Overtime Approvals</h1>
      <p className="ota-page__subtitle">
        Overtime saves immediately when logged, but only counts toward utilization once approved here.
      </p>

      {actionError && <p className="ota-page__error">{actionError}</p>}

      {pending.length === 0 ? (
        <p className="ota-page__empty">No pending overtime right now.</p>
      ) : (
        <div className="ota-table-wrap">
          <table className="ota-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Date</th>
                <th>Normal</th>
                <th>Overtime</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((entry) => (
                <tr key={entry.entry_id}>
                  <td>{entry.employee_id}</td>
                  <td>{projects.find((p) => p.project_id === entry.project_id)?.name ?? entry.project_id}</td>
                  <td>{entry.date}</td>
                  <td>{entry.normal_hours.toFixed(1)}h</td>
                  <td className="ota-table__ot">{entry.overtime_hours.toFixed(1)}h</td>
                  <td className="ota-table__notes" title={entry.notes ?? undefined}>
                    {entry.notes || "—"}
                  </td>
                  <td className="ota-table__actions">
                    <button className="ota-btn ota-btn--approve" onClick={() => handleApprove(entry.entry_id)}>
                      Approve
                    </button>
                    <button className="ota-btn ota-btn--reject" onClick={() => handleReject(entry.entry_id)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}