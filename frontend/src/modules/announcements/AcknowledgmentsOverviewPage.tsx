import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEmployee, type Employee } from "../../shared/auth/api";
import { listAllAnnouncements, getAcknowledgmentStatus } from "./api";
import type { Announcement } from "./types";
import {
  IconArrowLeft,
  IconBuilding,
  IconCheckCircle,
  IconLayers,
  IconShield,
  IconUsers,
} from "./components/icons";
import "./AcknowledgmentsOverviewPage.css";

interface OverviewRow {
  employee_id: string;
  name: string;
  designation: string | null;
  access_tier: string;
  announcement_title: string;
  acknowledged: boolean;
}

interface CategoryGroup {
  key: string;
  label: string;
  kind: "company_wide" | "team" | "role";
  rows: OverviewRow[];
}

function categoryFor(a: Announcement): { key: string; label: string; kind: CategoryGroup["kind"] } {
  if (a.target_type === "company_wide") {
    return { key: "company_wide", label: "Company-wide", kind: "company_wide" };
  }
  if (a.target_type === "team") {
    return { key: `team:${a.target_value}`, label: `Team: ${a.target_value}`, kind: "team" };
  }
  return { key: `role:${a.target_value}`, label: `Role: ${a.target_value}`, kind: "role" };
}

const KIND_ICON: Record<CategoryGroup["kind"], typeof IconBuilding> = {
  company_wide: IconBuilding,
  team: IconLayers,
  role: IconShield,
};

const KIND_ORDER: Record<CategoryGroup["kind"], number> = {
  company_wide: 0,
  team: 1,
  role: 2,
};

export function AcknowledgmentsOverviewPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CategoryGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const announcements = await listAllAnnouncements();
        const ackRequired = announcements.filter((a) => a.requires_ack);

        const employeeCache = new Map<string, Employee>();
        async function getEmployee(employeeId: string): Promise<Employee | null> {
          if (employeeCache.has(employeeId)) return employeeCache.get(employeeId)!;
          try {
            const emp = await fetchEmployee(employeeId);
            employeeCache.set(employeeId, emp);
            return emp;
          } catch {
            return null;
          }
        }

        const groupMap = new Map<string, CategoryGroup>();

        for (const announcement of ackRequired) {
          const { key, label, kind } = categoryFor(announcement);
          if (!groupMap.has(key)) {
            groupMap.set(key, { key, label, kind, rows: [] });
          }
          const group = groupMap.get(key)!;

          const statusRows = await getAcknowledgmentStatus(announcement.announcement_id);
          for (const status of statusRows) {
            const emp = await getEmployee(status.employee_id);
            group.rows.push({
              employee_id: status.employee_id,
              name: emp?.name ?? "Unknown employee",
              designation: emp?.designation ?? null,
              access_tier: emp?.access_tier ?? "—",
              announcement_title: announcement.title,
              acknowledged: status.acknowledged,
            });
          }
        }

        const sortedGroups = Array.from(groupMap.values()).sort(
          (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.label.localeCompare(b.label)
        );

        if (!cancelled) setGroups(sortedGroups);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load acknowledgments.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const overallSummary = useMemo(() => {
    if (!groups) return null;
    const allRows = groups.flatMap((g) => g.rows);
    const acked = allRows.filter((r) => r.acknowledged).length;
    return { total: allRows.length, acked };
  }, [groups]);

  return (
    <div className="ack-overview-screen">
      <header className="ack-overview-topbar">
        <button
          className="ack-overview-topbar__back"
          onClick={() => navigate("/dashboard")}
        >
          <IconArrowLeft size={16} /> Back
        </button>
      </header>

      <div className="ack-overview-page">
        <div className="ack-overview-page__header">
          <span className="ack-overview-page__icon">
            <IconUsers size={22} />
          </span>
          <div>
            <h1>Acknowledgments</h1>
            <p>Grouped by audience — company-wide, team, and role.</p>
          </div>
          {overallSummary && (
            <div className="ack-overview-page__summary">
              <strong>{overallSummary.acked}</strong> / {overallSummary.total} acknowledged
            </div>
          )}
        </div>

        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}

        {isLoading && <p className="ack-overview-page__state">Loading acknowledgment records…</p>}

        {!isLoading && groups && groups.length === 0 && !error && (
          <p className="ack-overview-page__state">
            No announcements currently require acknowledgment.
          </p>
        )}

        <div className="ack-group-grid">
          {groups?.map((group) => {
            const Icon = KIND_ICON[group.kind];
            const ackedCount = group.rows.filter((r) => r.acknowledged).length;
            return (
              <section key={group.key} className={`ack-group ack-group--${group.kind}`}>
                <div className="ack-group__header">
                  <span className="ack-group__icon">
                    <Icon size={18} />
                  </span>
                  <div className="ack-group__heading">
                    <h2>{group.label}</h2>
                    <span>
                      {ackedCount} / {group.rows.length} acknowledged
                    </span>
                  </div>
                </div>

                <div className="ack-group__table-wrap">
                  <table className="ack-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Employee ID</th>
                        <th>Role</th>
                        <th>Announcement</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, i) => (
                        <tr key={`${row.employee_id}-${row.announcement_title}-${i}`}>
                          <td>{row.name}</td>
                          <td className="ack-table__mono">{row.employee_id}</td>
                          <td>{row.designation ?? row.access_tier}</td>
                          <td>{row.announcement_title}</td>
                          <td>
                            <span
                              className={`ack-table__status ${
                                row.acknowledged
                                  ? "ack-table__status--acked"
                                  : "ack-table__status--pending"
                              }`}
                            >
                              <IconCheckCircle size={13} />
                              {row.acknowledged ? "Acknowledged" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}