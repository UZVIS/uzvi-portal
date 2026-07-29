import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { listAllAnnouncements, listFeedForEmployee, acknowledgeAnnouncement } from "./api";
import type { Announcement } from "./types";
import { AnnouncementCard } from "./components/AnnouncementCard";
import { AcknowledgmentDrawer } from "./components/AcknowledgmentDrawer";
import {
  IconArrowLeft,
  IconBell,
  IconInbox,
  IconLayers,
  IconMegaphone,
} from "./components/icons";
import "./AnnouncementsPage.css";

// FR-ANN-01: only these tiers may post / manage announcements.
const POSTER_TIERS = new Set(["Admin/Leadership", "Manager"]);

type ViewMode = "feed" | "all";

export function AnnouncementsPage() {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const canManage = employee ? POSTER_TIERS.has(employee.access_tier) : false;

  const [searchParams] = useSearchParams();
  const initialView: ViewMode = searchParams.get("view") === "all" ? "all" : "feed";
  const [view, setView] = useState<ViewMode>(initialView);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackDrawerId, setAckDrawerId] = useState<string | null>(null);
  const [pendingAckId, setPendingAckId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employee) return;
    setIsLoading(true);
    setError(null);
    try {
      const data =
        view === "all"
          ? await listAllAnnouncements()
          : await listFeedForEmployee(employee.employee_id);
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load announcements.");
    } finally {
      setIsLoading(false);
    }
  }, [employee, view]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAcknowledge(announcementId: string) {
    if (!employee) return;
    setPendingAckId(announcementId);
    try {
      await acknowledgeAnnouncement(announcementId, employee.employee_id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record acknowledgment.");
    } finally {
      setPendingAckId(null);
    }
  }

  const stats = useMemo(() => {
    const total = announcements.length;
    const needsAck = announcements.filter((a) => a.requires_ack).length;
    return { total, needsAck };
  }, [announcements]);

  if (!employee) return null;

  return (
    <div className="c-feed-screen">
      <button className="c-back-link" onClick={() => navigate("/dashboard")}>
        <IconArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="c-toolbar">
        <div className="c-toolbar__pills">
          <button
            className={`c-pill ${view === "feed" ? "c-pill--active c-pill--indigo" : ""}`}
            onClick={() => setView("feed")}
          >
            <IconInbox size={15} /> My Feed
          </button>
          {canManage && (
            <button
              className={`c-pill ${view === "all" ? "c-pill--active c-pill--violet" : ""}`}
              onClick={() => setView("all")}
            >
              <IconLayers size={15} /> All Announcements
            </button>
          )}
        </div>

        <div className="c-toolbar__stats">
          <span className="c-toolbar__stat c-toolbar__stat--blue">
            <IconInbox size={13} /> {stats.total} total
          </span>
          <span className="c-toolbar__stat c-toolbar__stat--amber">
            <IconBell size={13} /> {stats.needsAck} need ack
          </span>
        </div>

      </div>

      <main className="c-feed">
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}

        {isLoading && (
          <div className="c-feed__state">
            <IconInbox size={22} />
            <p>Fetching the latest notices…</p>
          </div>
        )}

        {!isLoading && announcements.length === 0 && !error && (
          <div className="c-feed__state">
            <IconMegaphone size={22} />
            <p>Nothing here yet. Check back soon.</p>
          </div>
        )}

        <ol className="c-ledger">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.announcement_id}
              announcement={a}
              currentEmployeeId={employee.employee_id}
              canManage={canManage}
              isAcking={pendingAckId === a.announcement_id}
              onAcknowledge={() => handleAcknowledge(a.announcement_id)}
              onViewAcknowledgments={() => setAckDrawerId(a.announcement_id)}
            />
          ))}
        </ol>
      </main>

      {ackDrawerId && (
        <AcknowledgmentDrawer
          announcementId={ackDrawerId}
          onClose={() => setAckDrawerId(null)}
        />
      )}
    </div>
  );
}