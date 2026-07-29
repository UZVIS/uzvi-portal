import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEmployee, type Employee } from "../../shared/auth/api";
import { listAllAnnouncements, getAcknowledgmentStatus } from "./api";
import type { Announcement } from "./types";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBuilding,
  IconCheckCircle,
  IconClock,
  IconLayers,
  IconShield,
  IconUsers,
} from "./components/icons";
import { parseServerDate } from "../../shared/utils/date";
import "./AcknowledgmentsOverviewPage.css";

interface OverviewRow {
  employee_id: string;
  name: string;
  designation: string | null;
  access_tier: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
}

interface AnnouncementSummary {
  announcement: Announcement;
  ackedCount: number;
  totalCount: number;
}

function categoryFor(a: Announcement): { label: string; kind: "company_wide" | "team" | "role" } {
  if (a.target_type === "company_wide") return { label: "Company-wide", kind: "company_wide" };
  if (a.target_type === "team") return { label: `Team: ${a.target_value}`, kind: "team" };
  return { label: `Role: ${a.target_value}`, kind: "role" };
}

const KIND_ICON: Record<"company_wide" | "team" | "role", typeof IconBuilding> = {
  company_wide: IconBuilding,
  team: IconLayers,
  role: IconShield,
};

function formatPostedAt(iso: string): string {
  return parseServerDate(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAckAt(iso: string | null): string {
  if (!iso) return "—";
  return parseServerDate(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AcknowledgmentsOverviewPage() {
  const navigate = useNavigate();
  const employeeCache = useRef(new Map<string, Employee>());

  const [summaries, setSummaries] = useState<AnnouncementSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);

  const [selected, setSelected] = useState<Announcement | null>(null);
  const [rows, setRows] = useState<OverviewRow[] | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsListLoading(true);
      setListError(null);
      try {
        const announcements = await listAllAnnouncements();
        const ackRequired = announcements.filter((a) => a.requires_ack);

        const withCounts = await Promise.all(
          ackRequired.map(async (announcement) => {
            const statusRows = await getAcknowledgmentStatus(announcement.announcement_id);
            return {
              announcement,
              ackedCount: statusRows.filter((r) => r.acknowledged).length,
              totalCount: statusRows.length,
            };
          })
        );

        withCounts.sort(
          (a, b) =>
            new Date(b.announcement.posted_at).getTime() -
            new Date(a.announcement.posted_at).getTime()
        );

        if (!cancelled) setSummaries(withCounts);
      } catch (err) {
        if (!cancelled) {
          setListError(err instanceof Error ? err.message : "Could not load acknowledgments.");
        }
      } finally {
        if (!cancelled) setIsListLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openAnnouncement(announcement: Announcement) {
    setSelected(announcement);
    setRows(null);
    setDetailError(null);
    setIsDetailLoading(true);
    try {
      const statusRows = await getAcknowledgmentStatus(announcement.announcement_id);

      async function getEmployee(employeeId: string): Promise<Employee | null> {
        if (employeeCache.current.has(employeeId)) return employeeCache.current.get(employeeId)!;
        try {
          const emp = await fetchEmployee(employeeId);
          employeeCache.current.set(employeeId, emp);
          return emp;
        } catch {
          return null;
        }
      }

      const built: OverviewRow[] = [];
      for (const status of statusRows) {
        const emp = await getEmployee(status.employee_id);
        built.push({
          employee_id: status.employee_id,
          name: emp?.name ?? "Unknown employee",
          designation: emp?.designation ?? null,
          access_tier: emp?.access_tier ?? "—",
          acknowledged: status.acknowledged,
          acknowledged_at: status.acknowledged_at,
        });
      }
      setRows(built);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Could not load this announcement's acknowledgments.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeAnnouncement() {
    setSelected(null);
    setRows(null);
    setDetailError(null);
  }

  const overallSummary = useMemo(() => {
    if (!summaries) return null;
    const total = summaries.reduce((sum, s) => sum + s.totalCount, 0);
    const acked = summaries.reduce((sum, s) => sum + s.ackedCount, 0);
    return { total, acked };
  }, [summaries]);

  return (
    <div className="ack-overview-screen">
      <header className="ack-overview-topbar">
        <button
          className="ack-overview-topbar__back"
          onClick={() => (selected ? closeAnnouncement() : navigate("/dashboard"))}
        >
          <IconArrowLeft size={16} /> {selected ? "Back to announcements" : "Back"}
        </button>
      </header>

      <div className="ack-overview-page">
        {!selected && (
          <>
            <div className="ack-overview-page__header">
              <span className="ack-overview-page__icon">
                <IconUsers size={22} />
              </span>
              <div>
                <h1>Acknowledgments</h1>
                <p>Pick an announcement to see who's acknowledged it.</p>
              </div>
              {overallSummary && (
                <div className="ack-overview-page__summary">
                  <strong>{overallSummary.acked}</strong> / {overallSummary.total} acknowledged
                </div>
              )}
            </div>

            {listError && (
              <p className="error-banner" role="alert">
                {listError}
              </p>
            )}

            {isListLoading && <p className="ack-overview-page__state">Loading announcements…</p>}

            {!isListLoading && summaries && summaries.length === 0 && !listError && (
              <p className="ack-overview-page__state">
                No announcements currently require acknowledgment.
              </p>
            )}

            <div className="ack-announcement-list">
              {summaries?.map((s) => {
                const { label, kind } = categoryFor(s.announcement);
                const Icon = KIND_ICON[kind];
                const pending = s.totalCount - s.ackedCount;
                return (
                  <button
                    key={s.announcement.announcement_id}
                    className={`ack-announcement-item ack-announcement-item--${kind}`}
                    onClick={() => openAnnouncement(s.announcement)}
                  >
                    <span className="ack-announcement-item__icon">
                      <Icon size={18} />
                    </span>
                    <div className="ack-announcement-item__text">
                      <h3>{s.announcement.title}</h3>
                      <div className="ack-announcement-item__meta">
                        <span>{label}</span>
                        <span>
                          <IconClock size={12} /> {formatPostedAt(s.announcement.posted_at)}
                        </span>
                      </div>
                    </div>
                    <div className="ack-announcement-item__stats">
                      <span className="ack-announcement-item__count">
                        {s.ackedCount} / {s.totalCount} acknowledged
                      </span>
                      {pending > 0 ? (
                        <span className="ack-announcement-item__pending">{pending} pending</span>
                      ) : (
                        <span className="ack-announcement-item__done">
                          <IconCheckCircle size={12} /> All acknowledged
                        </span>
                      )}
                    </div>
                    <IconArrowRight size={16} className="ack-announcement-item__go" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {selected && (
          <>
            <div className="ack-overview-page__header">
              <span className="ack-overview-page__icon">
                <IconUsers size={22} />
              </span>
              <div>
                <h1>{selected.title}</h1>
                <p>{categoryFor(selected).label} · acknowledgment status</p>
              </div>
              {rows && (
                <div className="ack-overview-page__summary">
                  <strong>{rows.filter((r) => r.acknowledged).length}</strong> / {rows.length}{" "}
                  acknowledged
                </div>
              )}
            </div>

            {detailError && (
              <p className="error-banner" role="alert">
                {detailError}
              </p>
            )}

            {isDetailLoading && (
              <p className="ack-overview-page__state">Loading acknowledgment records…</p>
            )}

            {!isDetailLoading && rows && (
              <div className="ack-table-wrap">
                <table className="ack-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Acknowledged On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={`${row.employee_id}-${i}`}>
                        <td>{row.name}</td>
                        <td className="ack-table__mono">{row.employee_id}</td>
                        <td>{row.designation ?? row.access_tier}</td>
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
                        <td className="ack-table__mono">{formatAckAt(row.acknowledged_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}