/**
 * M4 - Expense Claims
 * frontend/src/modules/expense_claims/components/ClaimsTable.tsx
 *
 * FR-EXP-07: employees see their own claim history.
 */
import type { ExpenseClaim, ExpenseCategory } from "../api";
import "./ClaimsTable.css";

interface Props {
  claims: ExpenseClaim[];
  categories: ExpenseCategory[];
}

export function ClaimsTable({ claims, categories }: Props) {
  if (claims.length === 0) {
    return <p className="claims-table__empty">No claims submitted yet.</p>;
  }

  const sorted = [...claims].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <table className="claims-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((claim) => (
          <tr key={claim.claim_id}>
            <td>{claim.date}</td>
            <td>{categories.find((c) => c.category_id === claim.category_id)?.name ?? claim.category_id}</td>
            <td>₹{claim.amount.toLocaleString()}</td>
            <td>
              <span className={`claims-table__badge claims-table__badge--${claim.status.toLowerCase()}`}>
                {claim.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
