import { useState, type FormEvent } from "react";

interface CreateProgramFormProps {
  onCreate: (name: string) => void | Promise<void>;
}

export function CreateProgramForm({ onCreate }: CreateProgramFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onCreate(trimmed);
      setName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="template-builder__row" onSubmit={handleSubmit}>
      <input
        className="field__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Program name, e.g. Onboarding Basics"
        required
      />
      <button type="submit" className="button-primary" disabled={isSubmitting || !name.trim()}>
        {isSubmitting ? "Creating..." : "Create program"}
      </button>
    </form>
  );
}
