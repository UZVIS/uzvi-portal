import { useEffect, useState } from "react";
import { getExpiredDocuments, type DocumentRecord } from "../api";

interface ExpiredDocumentsListProps {
  requesterId: string;
}

export function ExpiredDocumentsList({ requesterId }: ExpiredDocumentsListProps) {
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
  }, [requesterId]);

  if (isLoading) return <p className="directory-row__muted">Loading…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (docs.length === 0) return <p className="directory-row__muted">No expired documents.</p>;

  return (
    <ul className="team-manager__list">
      {docs.map((doc) => (
        <li key={doc.document_id} className="team-manager__item">
          <span className="team-manager__name">
            {doc.doc_type.replace(/_/g, " ")} — {doc.employee_id}
          </span>
          <span className="instance-tracker__overdue-badge">
            Expired {doc.retention_expiry}
          </span>
        </li>
      ))}
    </ul>
  );
}