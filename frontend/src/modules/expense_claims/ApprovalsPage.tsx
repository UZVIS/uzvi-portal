
import { useEffect, useState } from "react";
import { expenseClaimsApi, type ExpenseCategory, type ExpenseClaim } from "./api";
import "./ApprovalsPage.css";

type ActingRole = "Manager" | "Admin" | "HR-Restricted";

export function ApprovalsPage() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [actingAs, setActingAs] = useState<ActingRole>("Manager");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadAll() {
    const [claimList, categoryList] = await Promise.all([
      expenseClaimsApi.listClaims(),
      expenseClaimsApi.listCategories(),
    ]);
    setClaims(claimList);
    setCategories(categoryList);
  }

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load claims."))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(claimId: string) {
    setActionError(null);
    try {
      await expenseClaimsApi.approveClaim(claimId, actingAs);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't approve this claim.");
    }
  }

  async function handleReject(claimId: string) {
    setActionError(null);
    try {
      await expenseClaimsApi.rejectClaim(claimId);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't reject this claim.");
    }
  }

  async function handleReimburse(claimId: string) {
    setActionError(null);
    try {
      await expenseClaimsApi.reimburseClaim(claimId);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't mark this claim reimbursed.");
    }
  }

  if (loading) {
    return <div className="ap-page ap-page--status">Loading claims…</div>;
  }

  if (loadError) {
    return <div className="ap-page ap-page--status ap-page--error">Couldn't load this page: {loadError}</div>;
  }

  return (
    <div className="ap-page">
      <h1 className="ap-page__title">Approvals</h1>
      <p className="ap-page__subtitle">
        Not role-restricted yet (NFR-SEC-01) - anyone can act here for now. Use the selector below to test
        threshold-based routing (claims above the admin threshold need Admin/HR-Restricted, not Manager).
      </p>

      <label className="ap-page__acting">
        Acting as:
        <select value={actingAs} onChange={(e) => setActingAs(e.target.value as ActingRole)}>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
          <option value="HR-Restricted">HR-Restricted</option>
        </select>
      </label>

      {actionError && <p className="ap-page__error">{actionError}</p>}

      {claims.length === 0 ? (
        <p className="ap-page__empty">No claims in the system yet.</p>
      ) : (
        <table className="ap-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.claim_id}>
                <td>{claim.employee_id}</td>
                <td>{categories.find((c) => c.category_id === claim.category_id)?.name ?? claim.category_id}</td>
                <td>₹{claim.amount.toLocaleString()}</td>
                <td>{claim.date}</td>
                <td>
                  <span className={`ap-badge ap-badge--${claim.status.toLowerCase()}`}>{claim.status}</span>
                </td>
                <td className="ap-table__actions">
                  {claim.status === "Submitted" && (
                    <>
                      <button className="ap-btn ap-btn--approve" onClick={() => handleApprove(claim.claim_id)}>
                        Approve
                      </button>
                      <button className="ap-btn ap-btn--reject" onClick={() => handleReject(claim.claim_id)}>
                        Reject
                      </button>
                    </>
                  )}
                  {claim.status === "Approved" && (
                    <button className="ap-btn ap-btn--reimburse" onClick={() => handleReimburse(claim.claim_id)}>
                      Mark reimbursed
                    </button>
                  )}
                  {(claim.status === "Rejected" || claim.status === "Reimbursed") && (
                    <span className="ap-table__done">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
