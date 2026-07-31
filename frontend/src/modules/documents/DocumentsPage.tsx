import { useAuth } from "../../shared/auth/AuthContext";
import { registerDocument, viewDocument, getAccessLogs } from "./api";
import { DocumentUploadForm } from "./components/DocumentUploadForm";
import { DocumentLookup } from "./components/DocumentLookup";
import { ExpiredDocumentsList } from "./components/ExpiredDocumentsList";
import "../shared-theme.css";
import "./DocumentsPage.css";

const UPLOAD_TIERS = new Set(["HR-Restricted"]);

export function DocumentsPage() {
  const { employee } = useAuth();
  const canUpload = employee ? UPLOAD_TIERS.has(employee.access_tier) : false;

  return (
    <div className="directory-page uzvi-portal-theme">
      <header className="directory-page__header">
        <div>
          <h1>Document Repository</h1>
          <p className="directory-page__subtitle">
            Securely store and access personal HR documents like offer letters, payslips, and ID proofs.
          </p>
        </div>
      </header>

      <section className="directory-page__manage">
        {employee && (
          <DocumentUploadForm
            uploaderId={employee.employee_id}
            restrictToSelf={!canUpload}
            onSubmit={(input) => registerDocument(input).then(() => undefined)}
          />
        )}

        <DocumentLookup
          requesterId={employee?.employee_id ?? ""}
          onLookup={(id) => viewDocument(id, employee!.employee_id)}
          onGetLogs={(id) => getAccessLogs(id)}
        />
      </section>

      {canUpload && employee && (
        <section className="directory-page__list">
          <h2 style={{ fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 12 }}>
            Expired documents
          </h2>
          <ExpiredDocumentsList requesterId={employee.employee_id} />
        </section>
      )}
    </div>
  );
}
