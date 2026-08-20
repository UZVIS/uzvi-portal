import { useEffect, useState } from "react";
import { getVisibleDocuments, type DocumentRecord } from "../api";

interface DocumentsListProps {
  requesterId: string;
  refreshKey: number;
}

export function DocumentsList({ requesterId, refreshKey }: DocumentsListProps) {
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

  if (isLoading) return <p className="directory-row__muted">Loading…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (docs.length === 0) return <p className="directory-row__muted">No documents yet.</p>;

  return (
    <table className="directory-table" style={{ tableLayout: "auto" }}>
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
            <td>{doc.employee_id}</td>
            <td>{doc.retention_expiry ?? <span className="directory-row__muted">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}