
import { useEffect, useState } from "react";
import { expenseClaimsApi, type ExpenseCategory, type ExpenseClaim, type PendingTotal } from "./api";
import { ExpenseClaimForm } from "./components/ExpenseClaimForm";
import { ClaimsTable } from "./components/ClaimsTable";
import "./ExpenseClaimsPage.css";

const CURRENT_EMPLOYEE_ID = "E1"; // TODO: replace once auth exists

export function ExpenseClaimsPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [pendingTotal, setPendingTotal] = useState<PendingTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAll() {
    const [categoryList, claimList, total] = await Promise.all([
      expenseClaimsApi.listCategories(),
      expenseClaimsApi.listClaims(CURRENT_EMPLOYEE_ID),
      expenseClaimsApi.getPendingTotal(CURRENT_EMPLOYEE_ID),
    ]);
    setCategories(categoryList);
    setClaims(claimList);
    setPendingTotal(total);
  }

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load your claims."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmitClaim(input: {
    categoryId: string;
    amount: number;
    date: string;
    description: string;
    receiptAttached: boolean;
  }) {
    await expenseClaimsApi.createClaim({
      claim_id: `CL-${CURRENT_EMPLOYEE_ID}-${Date.now()}`,
      employee_id: CURRENT_EMPLOYEE_ID,
      category_id: input.categoryId,
      amount: input.amount,
      date: input.date,
      description: input.description,
      receipt_attached: input.receiptAttached,
    });
    await loadAll(); // refresh history + pending total after submitting
  }

  if (loading) {
    return <div className="ec-page ec-page--status">Loading your claims…</div>;
  }

  if (loadError) {
    return <div className="ec-page ec-page--status ec-page--error">Couldn't load this page: {loadError}</div>;
  }

  return (
    <div className="ec-page">
      <h1 className="ec-page__title">Expense Claims</h1>

      {pendingTotal && (
        <div className="ec-pending">
          <div className="ec-pending__amount">₹{pendingTotal.pending_reimbursement_total.toLocaleString()}</div>
          <div className="ec-pending__label">
            pending reimbursement across {pendingTotal.claim_count} claim
            {pendingTotal.claim_count === 1 ? "" : "s"}
          </div>
        </div>
      )}

      <div className="ec-page__grid">
        <section className="ec-panel">
          <h2 className="ec-panel__title">Your claims</h2>
          <ClaimsTable claims={claims} categories={categories} />
        </section>

        <section>
          <ExpenseClaimForm categories={categories} onSubmit={handleSubmitClaim} />
        </section>
      </div>
    </div>
  );
}
