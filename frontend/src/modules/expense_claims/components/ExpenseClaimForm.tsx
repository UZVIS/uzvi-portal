import { useEffect, useState } from "react";
import type { ExpenseCategory } from "../api";
import "./ExpenseClaimForm.css";

interface ProjectOption {
  project_id: string;
  name: string;
}

interface Props {
  categories: ExpenseCategory[];
  projects: ProjectOption[];
  onSubmit: (input: {
    categoryId: string;
    amount: number;
    date: string;
    description: string;
    receiptFile: File | null;
    projectId: string | null;
  }) => Promise<void>;
}

export function ExpenseClaimForm({
  categories,
  projects,
  onSubmit,
}: Props) {
  const [categoryId, setCategoryId] = useState(
    categories[0]?.category_id ?? ""
  );
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [errorMsg, setErrorMsg] = useState("");

  const selectedCategory = categories.find(
    (c) => c.category_id === categoryId
  );

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].category_id);
    }
  }, [categories, categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);

    if (!categoryId || !parsedAmount || parsedAmount <= 0) {
      setStatus("error");
      setErrorMsg("Pick a category and enter an amount greater than 0.");
      return;
    }

    if (!receiptFile) {
      setStatus("error");
      setErrorMsg("Please attach a receipt before submitting.");
      return;
    }

    if (!projectId) {
      setStatus("error");
      setErrorMsg("Please select a project before submitting.");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      await onSubmit({
        categoryId,
        amount: parsedAmount,
        date,
        description,
        receiptFile,
        projectId: projectId || null,
      });

      setAmount("");
      setDescription("");
      setReceiptFile(null);
      setFileInputKey((k) => k + 1);
      setProjectId("");

      setStatus("saved");

      // Hide success message after 2 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Couldn't submit this claim."
      );
    }
  }

  return (
    <form className="claim-form" onSubmit={handleSubmit}>
      <h3 className="claim-form__title">Submit an expense claim</h3>

      <div className="claim-form__row">
        <label>
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
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
            onWheel={(e) => e.currentTarget.blur()}
          />
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <label className="claim-form__field">
        Project
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a project
          </option>

          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="claim-form__field">
        Description
        <textarea
          rows={2}
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="claim-form__field">
        Receipt (required)
        <input
          key={fileInputKey}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          required
          onChange={(e) =>
            setReceiptFile(e.target.files?.[0] ?? null)
          }
        />
      </label>

      {receiptFile && (
        <p className="claim-form__hint">
          Selected: {receiptFile.name}
        </p>
      )}

      {selectedCategory?.cap_amount != null && (
        <p className="claim-form__hint">
          Cap for this category: ₹
          {selectedCategory.cap_amount.toLocaleString()}
        </p>
      )}

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Submitting…" : "Submit claim"}
      </button>

      {status === "error" && (
        <p className="claim-form__error">{errorMsg}</p>
      )}

      {status === "saved" && (
        <p className="claim-form__success">Submitted.</p>
      )}
    </form>
  );
}