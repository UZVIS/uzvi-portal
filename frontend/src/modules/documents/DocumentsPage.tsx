import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { registerDocument, viewDocument, getAccessLogs } from "./api";
import { DocumentUploadForm } from "./components/DocumentUploadForm";
import { DocumentLookup } from "./components/DocumentLookup";
import "../shared-theme.css";
import "./DocumentsPage.css";

// FR-DOC-01/06: only HR-Restricted may upload; only HR-Restricted + the
// document owner may read — enforced server-side, this just hides the
// upload form from tiers that would get a 403/empty result anyway.
const UPLOAD_TIERS = new Set(["HR-Restricted"]);

export function DocumentsPage() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const canUpload = employee ? UPLOAD_TIERS.has(employee.access_tier) : false;

  return (
    <div className="directory-page uzvi-portal-theme">
      <header className="directory-page__header">
        <div>
          <button className="button-secondary" onClick={() => navigate("/")}>
            ← Modules
          </button>
          <h1>Document Repository</h1>
          <p className="directory-page__subtitle">
            Personal HR documents — every view is logged (NFR-AUD-02). Only HR-Restricted and the
            document's owner can read a record.
          </p>
        </div>
        {employee && (
          <div className="directory-page__me">
            <span>{employee.name}</span>
            <button className="button-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>

      <section className="directory-page__manage">
        {canUpload && (
          <DocumentUploadForm
            uploaderId={employee!.employee_id}
            onSubmit={(input) => registerDocument(input).then(() => undefined)}
          />
        )}
        <DocumentLookup
          requesterId={employee?.employee_id ?? ""}
          onLookup={(id) => viewDocument(id, employee!.employee_id)}
          onGetLogs={(id) => getAccessLogs(id)}
        />
      </section>
    </div>
  );
}
