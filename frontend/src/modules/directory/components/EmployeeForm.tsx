import { useState, type FormEvent } from "react";
import type { Team } from "../api";

interface EmployeeFormProps {
  teams: Team[];
  employees: { employee_id: string; name: string; access_tier: string }[];
  onSubmit: (input: {
    employee_id: string;
    name: string;
    designation?: string;
    team_id?: string;
    manager_id?: string;
    contact_details?: string;
    join_date?: string;
    access_tier?: string;
  }) => Promise<void>;
}

export function EmployeeForm({ teams, employees, onSubmit }: EmployeeFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [teamId, setTeamId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [accessTier, setAccessTier] = useState("Employee");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!employeeId.trim() || !name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        employee_id: employeeId.trim(),
        name: name.trim(),
        designation: designation.trim() || undefined,
        team_id: teamId || undefined,
        manager_id: managerId || undefined,
        contact_details: contactDetails.trim() || undefined,
        join_date: joinDate || undefined,
        access_tier: accessTier,
      });
      setEmployeeId("");
      setName("");
      setAccessTier("Employee");
      setDesignation("");
      setTeamId("");
      setManagerId("");
      setContactDetails("");
      setJoinDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register the employee.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="directory-form" onSubmit={handleSubmit}>
      <h3 className="directory-form__title">Register a new employee</h3>
      {error && <div className="error-banner">{error}</div>}
      <div className="field-row">
        <label className="field">
          <span className="field__label">Employee ID</span>
          <input
            className="field__input"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="E010"
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Full name</span>
          <input
            className="field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Lee"
            required
          />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span className="field__label">Designation</span>
          <input
            className="field__input"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Consultant"
          />
        </label>
        <label className="field">
          <span className="field__label">Team</span>
          <select
            className="field__input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span className="field__label">Reporting manager</span>
          <select
            className="field__input"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">No manager</option>
            {employees
              .filter((e) => e.access_tier === "Manager" || e.access_tier === "Admin/Leadership")
              .map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.name} ({e.employee_id})
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Contact details</span>
          <input
            className="field__input"
            value={contactDetails}
            onChange={(e) => setContactDetails(e.target.value)}
            placeholder="jordan@company.com"
          />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span className="field__label">Join date</span>
          <input
            className="field__input"
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
          />
        </label>
      </div>
      <label className="field" style={{ marginBottom: 16 }}>
        <span className="field__label">Access tier</span>
        <select
          className="field__input"
          value={accessTier}
          onChange={(e) => setAccessTier(e.target.value)}
        >
          <option value="Employee">Employee/Consultant</option>
          <option value="Manager">Manager</option>
          <option value="HR-Restricted">HR-Restricted</option>
          <option value="Admin/Leadership">Admin/Leadership</option>
        </select>
      </label>
      <button className="button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registering…" : "Register employee"}
      </button>
    </form>
  );
}