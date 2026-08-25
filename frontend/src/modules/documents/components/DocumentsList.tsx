import { useEffect, useState } from "react";
import { getVisibleDocuments, type DocumentRecord } from "../api";
import type { Employee } from "../../directory/api";

interface DocumentsListProps {
  requesterId: string;
  employees: Employee[];
  refreshKey: number;
}

export function DocumentsList({ requesterId, employees, refreshKey }: DocumentsListProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getVisibleDocuments(requesterId)
      .then((data) => {
        if (!cancelled) setDocs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load documents.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requesterId, refreshKey]);

  function nameFor(employeeId: string): string {
    return employees.find((e) => e.employee_id === employeeId)?.name ?? employeeId;
  }

  if (isLoading) return <p className="directory-row__muted">Loading...</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (docs.length === 0) return <p className="directory-row__muted">No documents yet.</p>;

  return (
    <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
      <table className="directory-table directory-table--compact">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Document ID</th>
            <th>Type</th>
            <th>Owner</th>
            <th>Retention expiry</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.document_id} className="directory-row">
              <td className="directory-row__id">{doc.document_id}</td>
              <td>{doc.doc_type.replace(/_/g, " ")}</td>
              <td>
                {nameFor(doc.employee_id)}{" "}
                <span className="directory-row__muted">({doc.employee_id})</span>
              </td>
              <td>{doc.retention_expiry ?? <span className="directory-row__muted">-</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}