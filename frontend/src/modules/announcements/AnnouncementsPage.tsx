import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { listAllAnnouncements, listFeedForEmployee, acknowledgeAnnouncement } from "./api";
import type { Announcement } from "./types";
import { AnnouncementCard } from "./components/AnnouncementCard";
import { ComposeAnnouncementModal } from "./components/ComposeAnnouncementModal";
import { AcknowledgmentDrawer } from "./components/AcknowledgmentDrawer";
import "./AnnouncementsPage.css";

// FR-ANN-01: only these tiers may post / manage announcements.
const POSTER_TIERS = new Set(["Admin/Leadership", "Manager"]);

type ViewMode = "feed" | "all";

export function AnnouncementsPage() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const canManage = employee ? POSTER_TIERS.has(employee.access_tier) : false;

  const [view, setView] = useState<ViewMode>("feed");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
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

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!employee) return null;

  return (
    <div className="announcements-screen">
      <header className="topbar">
        <div className="topbar__brand">UZVI</div>
        <div className="topbar__user">
          <div className="topbar__user-info">
            <span className="topbar__user-name">{employee.name}</span>
            <span className="topbar__user-role">{employee.access_tier}</span>
          </div>
          <button className="topbar__logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="announcements-body">
        <aside className="rail">
          <nav className="rail__tabs">
            <button
              className={`rail__tab ${view === "feed" ? "rail__tab--active" : ""}`}
              onClick={() => setView("feed")}
            >
              My feed
            </button>
            {canManage && (
              <button
                className={`rail__tab ${view === "all" ? "rail__tab--active" : ""}`}
                onClick={() => setView("all")}
              >
                All announcements
              </button>
            )}
          </nav>

          {canManage && (
            <button className="rail__compose" onClick={() => setIsComposeOpen(true)}>
              + New announcement
            </button>
          )}
        </aside>

        <main className="feed">
          <h1 className="feed__title">
            {view === "all" ? "All announcements" : "Notice board"}
          </h1>
          <p className="feed__sub">
            {view === "all"
              ? "Every announcement across the company, including archived."
              : "Company-wide notices, plus anything for your team or role."}
          </p>

          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}

          {isLoading && <p className="feed__state">Loading announcements…</p>}

          {!isLoading && announcements.length === 0 && !error && (
            <p className="feed__state">Nothing here yet. Check back soon.</p>
          )}

          <ol className="ledger">
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
      </div>

      {isComposeOpen && (
        <ComposeAnnouncementModal
          postedBy={employee.employee_id}
          onClose={() => setIsComposeOpen(false)}
          onPosted={() => {
            setIsComposeOpen(false);
            void load();
          }}
        />
      )}

      {ackDrawerId && (
        <AcknowledgmentDrawer
          announcementId={ackDrawerId}
          onClose={() => setAckDrawerId(null)}
        />
      )}
    </div>
  );
}