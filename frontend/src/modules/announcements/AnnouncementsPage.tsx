import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { listAllAnnouncements, listFeedForEmployee, acknowledgeAnnouncement } from "./api";
import type { Announcement } from "./types";
import { AnnouncementCard } from "./components/AnnouncementCard";
import { AcknowledgmentDrawer } from "./components/AcknowledgmentDrawer";
import {
  IconInbox,
  IconLayers,
  IconMegaphone,
} from "./components/icons";
import "./AnnouncementsPage.css";

// FR-ANN-01: only these tiers may post / manage announcements.
const POSTER_TIERS = new Set(["Admin/Leadership", "Manager"]);

type ViewMode = "feed" | "all";

interface AnnouncementsPageProps {
  initialView?: ViewMode;
}

export function AnnouncementsPage({ initialView: initialViewProp }: AnnouncementsPageProps = {}) {
  const { employee } = useAuth();
  const canManage = employee ? POSTER_TIERS.has(employee.access_tier) : false;

  const [searchParams] = useSearchParams();
  const initialView: ViewMode =
    initialViewProp ?? (searchParams.get("view") === "all" ? "all" : "feed");
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

  if (!employee) return null;

  return (
    <div className="announcements-page">
      <div className="announcements-header">
        <div className="announcements-header__row">
          <div>
            <h1>Announcements</h1>
            <p>Company notices, updates, and required acknowledgments.</p>
          </div>
        </div>
      </div>

      <div className="c-toolbar__pills">
        {view === "feed" && (
          <button
            className="c-pill c-pill--active c-pill--indigo"
            onClick={() => setView("feed")}
          >
            <IconInbox size={15} /> My Feed
          </button>
        )}

        {canManage && view === "all" && (
          <button
            className="c-pill c-pill--active c-pill--violet"
            onClick={() => setView("all")}
          >
            <IconLayers size={15} /> All Announcements
          </button>
        )}
      </div>

      <div className="announcements-card">
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}

        {isLoading && (
          <div className="announcements-state">
            <IconInbox size={22} />
            <p>Fetching the latest notices…</p>
          </div>
        )}

        {!isLoading && announcements.length === 0 && !error && (
          <div className="announcements-state">
            <IconMegaphone size={22} />
            <p>Nothing here yet. Check back soon.</p>
          </div>
        )}

        <ol className="notice-list">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.announcement_id}
              announcement={a}
              currentEmployeeId={employee.employee_id}
              canManage={canManage}
              isAcking={pendingAckId === a.announcement_id}
              showAcknowledgeAction={view === "feed"}
              onAcknowledge={() => handleAcknowledge(a.announcement_id)}
              onViewAcknowledgments={() => setAckDrawerId(a.announcement_id)}
            />
          ))}
        </ol>
      </div>

      {ackDrawerId && (
        <AcknowledgmentDrawer
          announcementId={ackDrawerId}
          onClose={() => setAckDrawerId(null)}
        />
      )}
    </div>
  );
}