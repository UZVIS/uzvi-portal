import { useState } from "react";
import "./AddCategoryForm.css";

interface Props {
  onSubmit: (input: {
    name: string;
    capAmount: number;
  }) => Promise<void>;
}

export function AddCategoryForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [capAmount, setCapAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setStatus("error");
      setErrorMsg("Enter a category name.");
      return;
    }

    if (!capAmount.trim()) {
      setStatus("error");
      setErrorMsg("Enter a cap amount.");
      return;
    }

    const parsedCap = parseFloat(capAmount);

    if (isNaN(parsedCap) || parsedCap < 0) {
      setStatus("error");
      setErrorMsg("Enter a valid cap amount.");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      await onSubmit({
        name: name.trim(),
        capAmount: parsedCap,
      });

      setName("");
      setCapAmount("");
      setStatus("saved");

      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Couldn't add this category."
      );
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
          Cap amount
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter cap amount"
            value={capAmount}
            onChange={(e) => setCapAmount(e.target.value)}
            required
          />
        </label>
      </div>

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Adding…" : "Add category"}
      </button>

      {status === "error" && (
        <p className="add-category-form__error">{errorMsg}</p>
      )}

      {status === "saved" && (
        <p className="add-category-form__success">Added.</p>
      )}
    </form>
  );
}