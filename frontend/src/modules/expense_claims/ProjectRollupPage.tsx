
import { useState } from "react";
import { expenseClaimsApi, type ProjectExpenseRollup } from "./api";
import "./ProjectRollupPage.css";

export function ProjectRollupPage() {
  const [projectId, setProjectId] = useState("");
  const [rollup, setRollup] = useState<ProjectExpenseRollup | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setStatus("loading");
    try {
      const result = await expenseClaimsApi.getProjectRollup(projectId);
      setRollup(result);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't load this project's rollup.");
    }
  }

  return (
    <div className="pr-page">
      <h1 className="pr-page__title">Project Expense Rollup</h1>
      <p className="pr-page__subtitle">Total expenses claimed against a project, broken down by status.</p>

      <form className="pr-form" onSubmit={handleLookup}>
        <input
          type="text"
          placeholder="Project ID (e.g. P1)"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Loading…" : "Look up"}
        </button>
      </form>

      {status === "error" && <p className="pr-page__error">{errorMsg}</p>}

      {rollup && (
        <div className="pr-panel">
          <div className="pr-panel__total">₹{rollup.total_amount.toLocaleString()}</div>
          <div className="pr-panel__label">
            total across {rollup.claim_count} claim{rollup.claim_count === 1 ? "" : "s"}
          </div>

          <table className="pr-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rollup.by_status).map(([status, amount]) => (
                <tr key={status}>
                  <td>{status}</td>
                  <td>₹{(amount as number).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
