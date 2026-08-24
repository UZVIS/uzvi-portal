import { useEffect, useState } from "react";
import { getCohort, type CohortRow } from "../api";

interface CohortViewProps {
  requesterId: string;
  refreshKey: number;
}

export function CohortView({ requesterId, refreshKey }: CohortViewProps) {
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getCohort(requesterId)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the cohort view.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requesterId, refreshKey]);

  if (isLoading) return <p className="directory-row__muted">Loading cohort…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (rows.length === 0) return <p className="directory-row__muted">No onboarding instances yet.</p>;

  return (
    <table className="directory-table directory-table--compact">
      <colgroup>
        <col style={{ width: "24%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "22%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Instance</th>
          <th>Template</th>
          <th>Start date</th>
          <th>Progress</th>
          <th>Overdue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.instance_id} className="directory-row">
            <td>
              <div className="directory-row__name">{row.employee_name}</div>
              <div className="directory-row__muted">{row.employee_id}</div>
            </td>
            <td className="directory-row__id">{row.instance_id}</td>
            <td>{row.template_id}</td>
            <td>{row.start_date}</td>
            <td>{row.completion_pct}%</td>
            <td>
              {row.has_overdue_tasks ? (
                <span className="instance-tracker__overdue-badge">Overdue</span>
              ) : (
                <span className="directory-row__muted">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
