/**
 * M4 - Expense Claims
 * frontend/src/modules/expense_claims/components/ExpenseClaimForm.tsx
 *
 * FR-EXP-01, FR-EXP-02: submit a claim with category, amount, date,
 * description, and receipt. NOTE: description/receipt_attached are
 * collected here and sent to the API, but the backend does not persist
 * them yet - see the schema-gap note in api.ts and models.py. They're
 * still shown here so the gap is visible rather than hidden by leaving
 * the fields out of the UI entirely.
 */
import { useState } from "react";
import type { ExpenseCategory } from "../api";
import "./ExpenseClaimForm.css";

interface Props {
  categories: ExpenseCategory[];
  onSubmit: (input: {
    categoryId: string;
    amount: number;
    date: string;
    description: string;
    receiptAttached: boolean;
  }) => Promise<void>;
}

export function ExpenseClaimForm({ categories, onSubmit }: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.category_id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [receiptAttached, setReceiptAttached] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedCategory = categories.find((c) => c.category_id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!categoryId || !parsedAmount || parsedAmount <= 0) {
      setStatus("error");
      setErrorMsg("Pick a category and enter an amount greater than 0.");
      return;
    }
    setStatus("saving");
    try {
      await onSubmit({ categoryId, amount: parsedAmount, date, description, receiptAttached });
      setAmount("");
      setDescription("");
      setReceiptAttached(false);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't submit this claim.");
    }
  }

  return (
    <form className="claim-form" onSubmit={handleSubmit}>
      <h3 className="claim-form__title">Submit an expense claim</h3>

      <div className="claim-form__row">
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <label className="claim-form__field">
        Description
        <textarea
          rows={2}
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="claim-form__checkbox">
        <input type="checkbox" checked={receiptAttached} onChange={(e) => setReceiptAttached(e.target.checked)} />
        Receipt attached
      </label>
      <p className="claim-form__hint claim-form__hint--warn">
        Description and receipt aren't saved by the backend yet (pending a schema decision) - they're collected here
        so the gap stays visible.
      </p>

      {selectedCategory?.cap_amount != null && (
        <p className="claim-form__hint">Cap for this category: ₹{selectedCategory.cap_amount.toLocaleString()}</p>
      )}

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Submitting…" : "Submit claim"}
      </button>

      {status === "error" && <p className="claim-form__error">{errorMsg}</p>}
      {status === "saved" && <p className="claim-form__success">Submitted.</p>}
    </form>
  );
}
