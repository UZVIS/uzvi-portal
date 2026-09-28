import { useState, type FormEvent } from "react";
import type { TicketCategory, TicketPriority } from "../api";

const CATEGORIES: TicketCategory[] = ["HR", "IT", "Facilities", "Other"];
const PRIORITIES: TicketPriority[] = ["High", "Medium", "Low"];

interface CreateTicketFormProps {
  onCreate: (
    category: TicketCategory,
    priority: TicketPriority,
    description: string
  ) => void | Promise<void>;
}

export function CreateTicketForm({ onCreate }: CreateTicketFormProps) {
  const [category, setCategory] = useState<TicketCategory>("IT");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onCreate(category, priority, trimmed);
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="create-ticket-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <div className="field">
          <label className="field__label">Category</label>
          <select
            className="field__input"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label">Priority</label>
          <select
            className="field__input"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field__label">Description</label>
        <textarea
          className="field__input field__textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          required
        />
      </div>
      <button type="submit" className="button-primary" disabled={isSubmitting || !description.trim()}>
        {isSubmitting ? "Submitting..." : "Raise ticket"}
      </button>
    </form>
  );
}
