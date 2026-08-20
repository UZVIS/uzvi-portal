import { useState, type FormEvent } from "react";
import type { Team } from "../api";
import { Toast } from "../../../shared/components/Toast";

interface TeamManagerProps {
  teams: Team[];
  onCreate: (name: string) => Promise<void>;
}

export function TeamManager({ teams, onCreate }: TeamManagerProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await onCreate(name.trim());
      setName("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="team-manager">
      <h3 className="directory-form__title">Teams</h3>
      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      {success && <Toast message="Team created successfully." kind="success" onDismiss={() => setSuccess(false)} />}
      <ul className="team-manager__list">
        {teams.length === 0 && (
          <li className="directory-row__muted">No teams yet — add one below.</li>
        )}
        {teams.map((t) => (
          <li key={t.team_id} className="team-manager__item">
            <span className="team-manager__name">{t.name}</span>
            <span className="team-manager__id">{t.team_id}</span>
          </li>
        ))}
      </ul>
      <form className="team-manager__form" onSubmit={handleSubmit}>
        <input
          className="field__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
        />
        <button className="button-secondary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add team"}
        </button>
      </form>
    </div>
  );
}