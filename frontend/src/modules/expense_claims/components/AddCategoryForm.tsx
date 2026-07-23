/**
 * M4 - Expense Claims
 * frontend/src/modules/expense_claims/components/AddCategoryForm.tsx
 *
 * FR-EXP-02: configurable expense categories, each with an optional cap.
 */
import { useState } from "react";
import "./AddCategoryForm.css";

interface Props {
  onSubmit: (input: { name: string; capAmount: number | null }) => Promise<void>;
}

export function AddCategoryForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [capAmount, setCapAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setStatus("error");
      setErrorMsg("Enter a category name.");
      return;
    }
    setStatus("saving");
    try {
      const parsedCap = capAmount ? parseFloat(capAmount) : null;
      await onSubmit({ name: name.trim(), capAmount: parsedCap });
      setName("");
      setCapAmount("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't add this category.");
    }
  }

  return (
    <form className="add-category-form" onSubmit={handleSubmit}>
      <h3 className="add-category-form__title">Add a category</h3>
      <div className="add-category-form__row">
        <label>
          Name
          <input
            type="text"
            placeholder="e.g. Trip, Client Entertainment"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Cap amount (optional)
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="No cap"
            value={capAmount}
            onChange={(e) => setCapAmount(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Adding…" : "Add category"}
      </button>
      {status === "error" && <p className="add-category-form__error">{errorMsg}</p>}
      {status === "saved" && <p className="add-category-form__success">Added.</p>}
    </form>
  );
}