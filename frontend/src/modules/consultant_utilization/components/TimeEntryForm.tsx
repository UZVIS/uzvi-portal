
import { useState } from "react";
import type { Project } from "../api";
import "./TimeEntryForm.css";

interface Props {
  projects: Project[];
  onSubmit: (entry: { projectId: string; date: string; hours: number; billable: boolean }) => Promise<void>;
}

export function TimeEntryForm({ projects, onSubmit }: Props) {
  const [projectId, setProjectId] = useState(projects[0]?.project_id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [billable, setBillable] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedHours = parseFloat(hours);
    if (!projectId || !parsedHours || parsedHours <= 0) {
      setStatus("error");
      setErrorMsg("Pick a project and enter hours greater than 0.");
      return;
    }
    setStatus("saving");
    try {
      await onSubmit({ projectId, date, hours: parsedHours, billable });
      setHours("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't save this entry.");
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h3 className="entry-form__title">Log hours</h3>

      <div className="entry-form__row">
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label>
          Hours
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </label>
      </div>

      <label className="entry-form__checkbox">
        <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
        Billable
      </label>

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Log hours"}
      </button>

      {status === "error" && <p className="entry-form__error">{errorMsg}</p>}
      {status === "saved" && <p className="entry-form__success">Logged.</p>}
    </form>
  );
}
