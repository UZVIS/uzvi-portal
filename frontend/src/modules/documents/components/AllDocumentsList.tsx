import { useEffect, useState } from "react";
import { getAllDocuments, type DocumentRecord } from "../api";
import type { Employee } from "../../directory/api";

interface AllDocumentsListProps {
  requesterId: string;
  employees: Employee[];
  refreshKey: number;
}

export function AllDocumentsList({ requesterId, employees, refreshKey }: AllDocumentsListProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getAllDocuments(requesterId)
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

  const term = search.trim().toLowerCase();
  const filtered = term
    ? docs.filter(
        (d) =>
          d.employee_id.toLowerCase().includes(term) ||
          nameFor(d.employee_id).toLowerCase().includes(term)
      )
    : docs;

  if (isLoading) return <p className="directory-row__muted">Loading...</p>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <input
        className="field__input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by employee ID or name..."
        style={{ marginBottom: 10 }}
      />
      {filtered.length === 0 ? (
        <p className="directory-row__muted">No documents match.</p>
      ) : (
        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
          <table className="directory-table directory-table--compact">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "28%" }} />
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
              {filtered.map((doc) => (
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
      )}
    </div>
  );
}