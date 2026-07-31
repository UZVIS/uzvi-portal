import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import {
  listActiveEmployees,
  listTeams,
  createEmployee,
  updateEmployee,
  createTeam,
  exitEmployee,
  type Employee,
  type Team,
} from "./api";
import { EmployeeRow, teamNameFor } from "./components/EmployeeRow";
import { EmployeeForm } from "./components/EmployeeForm";
import { TeamManager } from "./components/TeamManager";
import "../shared-theme.css";
import "./DirectoryPage.css";

const MANAGE_TIERS = new Set(["Admin/Leadership", "HR-Restricted"]);

export function DirectoryPage() {
  const { employee } = useAuth();
  const canManage = employee ? MANAGE_TIERS.has(employee.access_tier) : false;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emps, tms] = await Promise.all([listActiveEmployees(), listTeams()]);
      setEmployees(emps);
      setTeams(tms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the directory.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateEmployee(input: Parameters<typeof createEmployee>[0]) {
    if (!employee) return;
    await createEmployee(input, employee.employee_id);
    await load();
  }

  async function handleUpdateEmployee(
    employeeId: string,
    input: Parameters<typeof updateEmployee>[1]
  ) {
    if (!employee) return;
    await updateEmployee(employeeId, input, employee.employee_id);
    await load();
  }

  async function handleCreateTeam(teamId: string, name: string) {
    await createTeam(teamId, name);
    await load();
  }

  async function handleExit(employeeId: string) {
    if (!employee) return;
    if (!window.confirm(`Mark ${employeeId} as exited? This can't be undone from here.`)) {
      return;
    }
    try {
      await exitEmployee(employeeId, employee.employee_id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark the employee as exited.");
    }
  }

  const TIER_ORDER: Record<string, number> = {
    "Admin/Leadership": 0,
    "HR-Restricted": 1,
    "Manager": 2,
    "Employee": 3,
  };

  const filtered = employees
    .filter((e) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const teamName = teamNameFor(e.team_id, teams) ?? "";
      return (
        e.name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        (e.designation ?? "").toLowerCase().includes(q) ||
        teamName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const orderA = TIER_ORDER[a.access_tier] ?? 99;
      const orderB = TIER_ORDER[b.access_tier] ?? 99;
      return orderA - orderB;
    });

  return (
    <div className="directory-page uzvi-portal-theme">
      <header className="directory-page__header">
        <div>
          <h1>Employee Directory</h1>
          <p className="directory-page__subtitle">
            The single source of truth for who exists — every other module references this list.
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {canManage && (
        <section className="directory-page__manage">
          <EmployeeForm teams={teams} employees={employees} onSubmit={handleCreateEmployee} />
          <TeamManager teams={teams} onCreate={handleCreateTeam} />
        </section>
      )}

      <section className="directory-page__list">
        <div className="directory-page__list-header">
          <h2>Directory ({filtered.length})</h2>
          <input
            className="field__input directory-page__search"
            placeholder="Search by name, ID, team, or designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="directory-row__muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="directory-row__muted">No employees match your search.</p>
        ) : (
          <table className="directory-table">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              {canManage && <col />}
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Team</th>
                <th>Manager</th>
                <th>Access tier</th>
                <th>Contact</th>
                <th>Join date</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <EmployeeRow
                  key={e.employee_id}
                  employee={e}
                  teamName={teamNameFor(e.team_id, teams)}
                  teams={teams}
                  employees={employees}
                  onExit={handleExit}
                  onUpdate={handleUpdateEmployee}
                  canManage={canManage}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
