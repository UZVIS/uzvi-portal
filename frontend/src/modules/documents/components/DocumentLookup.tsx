import { useState } from "react";
import type { DocumentAccessLog, DocumentRecord } from "../api";
import { Toast } from "../../../shared/components/Toast";

// Backend stores timestamps as UTC, but SQLite drops the timezone marker
// on the way out, so the API returns a bare "2026-07-21T06:53:48" with no
// offset. Without a marker, `new Date(...)` assumes that string is already
// in the browser's local time and does no conversion at all. Appending "Z"
// tells it explicitly "this is UTC," which is what it actually is.
function parseUtc(timestamp: string): Date {
  const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(timestamp);
  return new Date(hasOffset ? timestamp : `${timestamp}Z`);
}

interface DocumentLookupProps {
  requesterId: string;
  onLookup: (documentId: string) => Promise<DocumentRecord>;
  onGetLogs: (documentId: string) => Promise<DocumentAccessLog[]>;
}

export function DocumentLookup({ requesterId, onLookup, onGetLogs }: DocumentLookupProps) {
  const [documentId, setDocumentId] = useState("");
  const [record, setRecord] = useState<DocumentRecord | null>(null);
  const [logs, setLogs] = useState<DocumentAccessLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleView() {
    if (!documentId.trim() || !requesterId) return;
    setIsLoading(true);
    setError(null);
    try {
      const doc = await onLookup(documentId.trim());
      setRecord(doc);
      const logRows = await onGetLogs(documentId.trim());
      setLogs(logRows);
    } catch (err) {
      setRecord(null);
      setLogs([]);
      setError(err instanceof Error ? err.message : "Could not view that document.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="team-manager">
      <h3 className="directory-form__title">View a document</h3>
      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      <div className="team-manager__form">
        <input
          className="field__input"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          placeholder="Document ID (D1)"
        />
        <button className="button-secondary" onClick={handleView} disabled={isLoading || !requesterId}>
          {isLoading ? "Loading…" : "View"}
        </button>
      </div>
      {!requesterId && (
        <p className="directory-row__muted">Log in to view documents.</p>
      )}

      {record && (
        <div className="document-record">
          <dl>
            <dt>Type</dt>
            <dd>{record.doc_type.replace(/_/g, " ")}</dd>
            <dt>Owner</dt>
            <dd>{record.employee_id}</dd>
            <dt>Uploaded by</dt>
            <dd>{record.uploaded_by}</dd>
            <dt>Retention expiry</dt>
            <dd>{record.retention_expiry ?? "—"}</dd>
          </dl>

          <h4 className="document-record__logs-title">Access log</h4>
          <ul className="document-record__logs">
            {logs.map((log) => (
              <li key={log.log_id}>
                <span className="team-manager__id">{log.action}</span> by {log.accessed_by} ·{" "}
                {parseUtc(log.timestamp).toLocaleString()}
              </li>
            ))}
            {logs.length === 0 && <li className="directory-row__muted">No access recorded yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
