import { useState, type FormEvent } from "react";

interface DocumentUploadFormProps {
  uploaderId: string;
  onSubmit: (input: {
    document_id: string;
    employee_id: string;
    uploaded_by: string;
    doc_type: string;
    retention_expiry?: string;
  }) => Promise<void>;
}

const DOC_TYPES = ["offer_letter", "payslip", "experience_letter", "id_proof", "address_proof"];

export function DocumentUploadForm({ uploaderId, onSubmit }: DocumentUploadFormProps) {
  const [documentId, setDocumentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [retentionExpiry, setRetentionExpiry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!documentId.trim() || !employeeId.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await onSubmit({
        document_id: documentId.trim(),
        employee_id: employeeId.trim(),
        uploaded_by: uploaderId,
        doc_type: docType,
        retention_expiry: retentionExpiry || undefined,
      });
      setDocumentId("");
      setEmployeeId("");
      setRetentionExpiry("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register the document.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="directory-form" onSubmit={handleSubmit}>
      <h3 className="directory-form__title">Register a document</h3>
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">Document registered.</div>}
      <div className="field-row">
        <label className="field">
          <span className="field__label">Document ID</span>
          <input
            className="field__input"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="D2"
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Employee ID (owner)</span>
          <input
            className="field__input"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="E001"
            required
          />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span className="field__label">Document type</span>
          <select className="field__input" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Retention expiry (optional)</span>
          <input
            className="field__input"
            type="date"
            value={retentionExpiry}
            onChange={(e) => setRetentionExpiry(e.target.value)}
          />
        </label>
      </div>
      <button className="button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registering…" : "Register document"}
      </button>
    </form>
  );
}
