import { useEffect, useState } from "react";
import { listExitedEmployees, type Employee } from "../api";

interface ExitedEmployeesListProps {
  requesterId: string;
  refreshKey: number;
}

export function ExitedEmployeesList({ requesterId, refreshKey }: ExitedEmployeesListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listExitedEmployees(requesterId)
      .then((data) => {
        if (!cancelled) setEmployees(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load exited employees.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requesterId, refreshKey]);

  if (isLoading) return <p className="directory-row__muted">Loading…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (employees.length === 0) return <p className="directory-row__muted">No exited employees.</p>;

  return (
    <table className="directory-table" style={{ tableLayout: "auto" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Designation</th>
          <th>Join date</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((e) => (
          <tr key={e.employee_id} className="directory-row">
            <td className="directory-row__id">{e.employee_id}</td>
            <td className="directory-row__name">{e.name}</td>
            <td>{e.designation ?? <span className="directory-row__muted">—</span>}</td>
            <td>{e.join_date ?? <span className="directory-row__muted">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}