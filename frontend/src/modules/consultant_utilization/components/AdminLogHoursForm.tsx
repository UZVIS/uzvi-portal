
import { useState } from "react";
import type { Project } from "../api";

interface Props {
  projects: Project[];
  onSubmit: (input: {
    employeeId: string;
    projectId: string;
    date: string;
    hours: number;
    billable: boolean;
  }) => Promise<void>;
}

export function AdminLogHoursForm({ projects, onSubmit }: Props) {
  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.project_id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [billable, setBillable] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedHours = parseFloat(hours);
    if (!employeeId.trim() || !projectId || !parsedHours || parsedHours <= 0) {
      setStatus("error");
      setErrorMsg("Enter an employee ID, pick a project, and enter hours greater than 0.");
      return;
    }
    const dayOfWeek = new Date(date + "T00:00:00").getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setStatus("error");
      setErrorMsg("Weekends are not working days. Pick a weekday (Monday-Friday).");
      return;
    }
    setStatus("saving");
    try {
      await onSubmit({ employeeId: employeeId.trim(), projectId, date, hours: parsedHours, billable });
      setEmployeeId("");
      setHours("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't log these hours.");
    }
  }

  return (
    <form className="uzvi-portal-theme" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <div style={{ background: "#ffffff", border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)", padding: 20 }}>
        <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
          Log hours for an employee
        </h3>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Employee ID</span>
            <input
              className="field__input"
              placeholder="e.g. E1"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Project</span>
            <select
              className="field__input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row" style={{ marginTop: 12 }}>
          <label className="field">
            <span className="field__label">Date</span>
            <input
              className="field__input"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Hours</span>
            <input
              className="field__input"
              type="number"
              min="0"
              max="24"
              step="0.5"
              placeholder="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13 }}>
          <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
          Billable
        </label>

        <button type="submit" className="button-primary" disabled={status === "saving"} style={{ marginTop: 16 }}>
          {status === "saving" ? "Logging…" : "Log hours"}
        </button>

        {status === "error" && <div className="error-banner" style={{ marginTop: 12 }}>{errorMsg}</div>}
        {status === "saved" && <div className="success-banner" style={{ marginTop: 12 }}>Hours logged for {employeeId || "employee"}.</div>}
      </div>
    </form>
  );
}