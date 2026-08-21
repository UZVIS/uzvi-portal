import { useState } from "react";
import type { Employee, Team } from "../api";

interface EmployeeRowProps {
  employee: Employee;
  teamName: string | null;
  teams: Team[];
  employees: Employee[];
  onExit: (employeeId: string) => void;
  onUpdate: (
    employeeId: string,
    input: {
      designation?: string;
      team_id?: string;
      manager_id?: string;
      contact_details?: string;
      join_date?: string;
      access_tier?: string;
    }
  ) => Promise<void>;
  canManage: boolean;
}

const TIERS = ["Employee", "Manager", "HR-Restricted", "Admin/Leadership"];

export function EmployeeRow({
  employee,
  teamName,
  teams,
  employees,
  onExit,
  onUpdate,
  canManage,
}: EmployeeRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [designation, setDesignation] = useState(employee.designation ?? "");
  const [teamId, setTeamId] = useState(employee.team_id ?? "");
  const [managerId, setManagerId] = useState(employee.manager_id ?? "");
  const [contactDetails, setContactDetails] = useState(employee.contact_details ?? "");
  const [joinDate, setJoinDate] = useState(employee.join_date ?? "");
  const [accessTier, setAccessTier] = useState(employee.access_tier);
  const [isSaving, setIsSaving] = useState(false);

  function startEdit() {
    setDesignation(employee.designation ?? "");
    setTeamId(employee.team_id ?? "");
    setManagerId(employee.manager_id ?? "");
    setContactDetails(employee.contact_details ?? "");
    setJoinDate(employee.join_date ?? "");
    setAccessTier(employee.access_tier);
    setIsEditing(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onUpdate(employee.employee_id, {
        designation: designation.trim() || undefined,
        team_id: teamId || undefined,
        manager_id: managerId || undefined,
        contact_details: contactDetails.trim() || undefined,
        join_date: joinDate || undefined,
        access_tier: accessTier,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <tr className="directory-row directory-row--editing">
        <td className="directory-row__id">{employee.employee_id}</td>
        <td>
          <div className="directory-row__name">{employee.name}</div>
          <input
            className="field__input directory-row__edit-input"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Designation"
          />
        </td>
        <td>
          <select
            className="field__input directory-row__edit-input"
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
        </td>
        <td>
          <select
            className="field__input directory-row__edit-input"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">No manager</option>
            {employees
              .filter((e) => e.employee_id !== employee.employee_id)
              .filter((e) => e.access_tier === "Manager" || e.access_tier === "Admin/Leadership")
              .map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.name} ({e.employee_id})
                </option>
              ))}
          </select>
        </td>
        <td>
          <select
            className="field__input directory-row__edit-input"
            value={accessTier}
            onChange={(e) => setAccessTier(e.target.value)}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </td>
        <td>
          <input
            className="field__input directory-row__edit-input"
            value={contactDetails}
            onChange={(e) => setContactDetails(e.target.value)}
            placeholder="Contact details"
          />
        </td>
        <td>
          <input
            className="field__input directory-row__edit-input"
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
          />
        </td>
        <td className="directory-row__actions">
          <button
            className="button-primary directory-row__exit-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            className="button-secondary directory-row__exit-btn"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="directory-row">
      <td className="directory-row__id" style={{ whiteSpace: "nowrap" }}>{employee.employee_id}</td>
      <td>
        <div className="directory-row__name">{employee.name}</div>
        {employee.designation && (
          <div className="directory-row__designation">{employee.designation}</div>
        )}
      </td>
      <td title={teamName ?? undefined}>{teamName ?? <span className="directory-row__muted">Unassigned</span>}</td>
      <td>{managerNameFor(employee.manager_id, employees) ?? <span className="directory-row__muted">—</span>}</td>
      <td>
        <span className={`tier-badge tier-badge--${employee.access_tier.toLowerCase().replace(/[^a-z]/g, "-")}`}>
          {employee.access_tier}
        </span>
      </td>
      <td className="directory-row__truncate" title={employee.contact_details ?? undefined}>{employee.contact_details ?? <span className="directory-row__muted">—</span>}</td>
      <td style={{ whiteSpace: "nowrap" }}>{employee.join_date ?? <span className="directory-row__muted">—</span>}</td>
      {canManage && employee.employment_status === "active" && (
        <td className="directory-row__actions">
          <button className="button-secondary directory-row__exit-btn" onClick={startEdit}>
            Edit
          </button>
          <button
            className="button-secondary directory-row__exit-btn"
            onClick={() => onExit(employee.employee_id)}
          >
            Mark exited
          </button>
        </td>
      )}
    </tr>
  );
}

export function teamNameFor(teamId: string | null, teams: Team[]): string | null {
  if (!teamId) return null;
  return teams.find((t) => t.team_id === teamId)?.name ?? teamId;
}

export function managerNameFor(
  managerId: string | null | undefined,
  employees: { employee_id: string; name: string }[]
): string | null {
  if (!managerId) return null;
  return employees.find((e) => e.employee_id === managerId)?.name ?? managerId;
}