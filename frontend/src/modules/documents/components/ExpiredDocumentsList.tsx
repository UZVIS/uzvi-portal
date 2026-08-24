import { useEffect, useState } from "react";
import { getExpiredDocuments, type DocumentRecord } from "../api";

interface ExpiredDocumentsListProps {
  requesterId: string;
  refreshKey: number;
}

export function ExpiredDocumentsList({ requesterId, refreshKey }: ExpiredDocumentsListProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getExpiredDocuments(requesterId)
      .then((data) => {
        if (!cancelled) setDocs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load expired documents.");
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
  if (docs.length === 0) return <p className="directory-row__muted">No expired documents.</p>;

  return (
    <table className="directory-table directory-table--compact">
      <colgroup>
        <col style={{ width: "20%" }} />
        <col style={{ width: "25%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "35%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>Document ID</th>
          <th>Type</th>
          <th>Owner</th>
          <th>Expired on</th>
        </tr>
      </thead>
      <tbody>
        {docs.map((doc) => (
          <tr key={doc.document_id} className="directory-row">
            <td className="directory-row__id">{doc.document_id}</td>
            <td>{doc.doc_type.replace(/_/g, " ")}</td>
            <td>{doc.employee_id}</td>
            <td>
              <span className="instance-tracker__overdue-badge">{doc.retention_expiry}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
