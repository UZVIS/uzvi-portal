import { useState, type FormEvent } from "react";
import type { Team } from "../api";

interface TeamManagerProps {
  teams: Team[];
  onCreate: (teamId: string, name: string) => Promise<void>;
}

export function TeamManager({ teams, onCreate }: TeamManagerProps) {
  const [teamId, setTeamId] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!teamId.trim() || !name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(teamId.trim(), name.trim());
      setTeamId("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="team-manager">
      <h3 className="directory-form__title">Teams</h3>
      {error && <div className="error-banner">{error}</div>}
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
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Team ID (T3)"
        />
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
