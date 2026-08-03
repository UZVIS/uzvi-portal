import { useEffect, useState } from "react";
import { expenseClaimsApi, type ExpenseCategory, type ExpenseClaim, type PendingTotal } from "./api";
import { utilizationApi, type Project } from "../consultant_utilization/api";
import { useAuth } from "../../shared/auth/AuthContext";
import { ExpenseClaimForm } from "./components/ExpenseClaimForm";
import { ClaimsTable } from "./components/ClaimsTable";
import { AddCategoryForm } from "./components/AddCategoryForm";
import "./ExpenseClaimsPage.css";

export function ExpenseClaimsPage() {
  const { employee } = useAuth();
  const currentEmployeeId = employee?.employee_id ?? "";

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [pendingTotal, setPendingTotal] = useState<PendingTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAll() {
    const [categoryList, projectList, claimList, total] = await Promise.all([
      expenseClaimsApi.listCategories(),
      utilizationApi.listProjects(),
      expenseClaimsApi.listClaims(currentEmployeeId),
      expenseClaimsApi.getPendingTotal(currentEmployeeId),
    ]);
    setCategories(categoryList);
    setProjects(projectList);
    setClaims(claimList);
    setPendingTotal(total);
  }

  useEffect(() => {
    if (!currentEmployeeId) return;
    setLoading(true);
    loadAll()
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load your claims."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId]);

  async function handleSubmitClaim(input: {
    categoryId: string;
    amount: number;
    date: string;
    description: string;
    receiptFile: File | null;
    projectId: string | null;
  }) {
    // Step 1: create the claim (JSON body - category, amount, date, description, project).
    const claim = await expenseClaimsApi.createClaim({
      claim_id: `CL-${currentEmployeeId}-${Date.now()}`,
      employee_id: currentEmployeeId,
      category_id: input.categoryId,
      project_id: input.projectId,
      amount: input.amount,
      date: input.date,
      description: input.description,
    });

    // Step 2: if a receipt file was picked, upload it separately
    // (multipart/form-data - can't be combined with the JSON claim body).
    if (input.receiptFile) {
      await expenseClaimsApi.uploadReceipt(claim.claim_id, input.receiptFile);
    }

    await loadAll(); // refresh history + pending total after submitting
  }

  async function handleAddCategory(input: { name: string; capAmount: number | null }) {
    await expenseClaimsApi.createCategory({
      category_id: `C-${Date.now()}`,
      name: input.name,
      cap_amount: input.capAmount,
    });
    await loadAll(); // refresh categories so the new one appears in the dropdown
  }

  if (!currentEmployeeId || loading) {
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
        <section className="ec-panel ec-panel--claims">
          <h2 className="ec-panel__title">Your claims</h2>
          <ClaimsTable claims={claims} categories={categories} />
        </section>

        <section>
          <ExpenseClaimForm categories={categories} projects={projects} onSubmit={handleSubmitClaim} />
          <AddCategoryForm onSubmit={handleAddCategory} />
        </section>
      </div>
    </div>
  );
}