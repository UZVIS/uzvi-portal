import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import { listFeedForEmployee, getAcknowledgmentStatus } from "../announcements/api";
import type { Announcement } from "../announcements/types";
import { AnnouncementsPage } from "../announcements/AnnouncementsPage";
import { AcknowledgmentsOverviewPage } from "../announcements/AcknowledgmentsOverviewPage";
import { ComposeAnnouncementPage } from "../announcements/ComposeAnnouncementPage";
import {
  IconArrowRight,
  IconBell,
  IconInbox,
  IconLayers,
  IconMegaphone,
  IconPlus,
  IconUsers,
} from "../announcements/components/icons";
import "./AnnouncementsDashboardPage.css";

const POSTER_TIERS = new Set(["Admin/Leadership", "Manager"]);

type ActiveView = "feed" | "needsAck" | "all" | "ack" | "new" | null;

export function AnnouncementsDashboardPage() {
  const { employee } = useAuth();
  const canManage = employee ? POSTER_TIERS.has(employee.access_tier) : false;

  const [activeView, setActiveView] = useState<ActiveView>(null);

  const [feed, setFeed] = useState<Announcement[]>([]);
  const [pendingAckCount, setPendingAckCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const data = await listFeedForEmployee(employee!.employee_id);
        if (cancelled) return;
        setFeed(data);

        const requiringAck = data.filter((a) => a.requires_ack);
        const withStatus = await Promise.all(
          requiringAck.map(async (a) => {
            const rows = await getAcknowledgmentStatus(a.announcement_id);
            const mine = rows.find((r) => r.employee_id === employee!.employee_id);
            return mine?.acknowledged ?? false;
          })
        );
        if (!cancelled) {
          setPendingAckCount(withStatus.filter((acked) => !acked).length);
        }
      } catch (err) {
        if (!cancelled) {
          setFeed([]);
          setPendingAckCount(0);
          setError(err instanceof Error ? err.message : "Couldn't load the notice board.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [employee]);

  const stats = useMemo(() => {
    const total = feed.length;
    const companyWide = feed.filter((a) => a.target_type === "company_wide").length;
    return { total, needsAck: pendingAckCount, companyWide };
  }, [feed, pendingAckCount]);

  if (!employee) return null;

  function closeView() {
    setActiveView(null);
  }

  return (
    <div className="ahub">
      {error && (
        <div className="ahub-error" role="alert">
          {error}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <section className="ahub-stats">
        <div className="ahub-stat">
          <div className="ahub-stat__icon ahub-stat__icon--blue">
            <IconInbox size={18} />
          </div>
          <div>
            <p className="ahub-stat__value">{isLoading ? "…" : stats.total}</p>
            <p className="ahub-stat__label">In your feed</p>
          </div>
        </div>
        <div className="ahub-stat">
          <div className="ahub-stat__icon ahub-stat__icon--amber">
            <IconBell size={18} />
          </div>
          <div>
            <p className="ahub-stat__value">{isLoading ? "…" : stats.needsAck}</p>
            <p className="ahub-stat__label">Need acknowledgment</p>
          </div>
        </div>
        <div className="ahub-stat">
          <div className="ahub-stat__icon ahub-stat__icon--indigo">
            <IconLayers size={18} />
          </div>
          <div>
            <p className="ahub-stat__value">{isLoading ? "…" : stats.companyWide}</p>
            <p className="ahub-stat__label">Company-wide</p>
          </div>
        </div>
      </section>

      {/* ── Module cards ────────────────────────────────────────────── */}
      <section className="ahub-grid">
        <button
          className={`ahub-card ${activeView === "feed" ? "ahub-card--active" : ""}`}
          onClick={() => setActiveView(activeView === "feed" ? null : "feed")}
        >
          <div className="ahub-card__icon ahub-card__icon--indigo">
            <IconInbox size={22} />
          </div>
          <h3>My Feed</h3>
          <p>Company-wide notices, plus anything for your team or role.</p>
          <span className="ahub-card__go">
            {activeView === "feed" ? "Close" : "Open"} <IconArrowRight size={14} />
          </span>
        </button>

        {!canManage && (
          <button
            className={`ahub-card ahub-card--alert ${activeView === "needsAck" ? "ahub-card--active" : ""}`}
            onClick={() => setActiveView(activeView === "needsAck" ? null : "needsAck")}
          >
            <div className="ahub-card__icon ahub-card__icon--rose">
              <IconBell size={22} />
            </div>
            <h3>Needs Acknowledgment</h3>
            <p>
              {isLoading
                ? "Checking your feed…"
                : stats.needsAck > 0
                  ? `${stats.needsAck} notice${stats.needsAck === 1 ? "" : "s"} waiting on your acknowledgment.`
                  : "You're all caught up — nothing pending right now."}
            </p>
            <span className="ahub-card__go">
              {activeView === "needsAck" ? "Close" : stats.needsAck > 0 ? "Review" : "Open"}{" "}
              <IconArrowRight size={14} />
            </span>
          </button>
        )}

        {canManage && (
          <button
            className={`ahub-card ${activeView === "all" ? "ahub-card--active" : ""}`}
            onClick={() => setActiveView(activeView === "all" ? null : "all")}
          >
            <div className="ahub-card__icon ahub-card__icon--violet">
              <IconLayers size={22} />
            </div>
            <h3>All Announcements</h3>
            <p>Every notice across the company — active and archived.</p>
            <span className="ahub-card__go">
              {activeView === "all" ? "Close" : "Open"} <IconArrowRight size={14} />
            </span>
          </button>
        )}

        {canManage && (
          <button
            className={`ahub-card ${activeView === "ack" ? "ahub-card--active" : ""}`}
            onClick={() => setActiveView(activeView === "ack" ? null : "ack")}
          >
            <div className="ahub-card__icon ahub-card__icon--teal">
              <IconUsers size={22} />
            </div>
            <h3>View Acknowledgments</h3>
            <p>See exactly who has (and hasn't) acknowledged each notice.</p>
            <span className="ahub-card__go">
              {activeView === "ack" ? "Close" : "Open"} <IconArrowRight size={14} />
            </span>
          </button>
        )}

        {canManage && (
          <button
            className={`ahub-card ${activeView === "new" ? "ahub-card--active" : ""}`}
            onClick={() => setActiveView(activeView === "new" ? null : "new")}
          >
            <div className="ahub-card__icon ahub-card__icon--orange">
              <IconMegaphone size={22} />
            </div>
            <h3>
              New Announcement <IconPlus size={14} />
            </h3>
            <p>Post a notice to the company, a team, or a specific role.</p>
            <span className="ahub-card__go">
              {activeView === "new" ? "Close" : "Compose"} <IconArrowRight size={14} />
            </span>
          </button>
        )}
      </section>

      {/* ── Inline content for the selected card, shown on this same page ── */}
      {activeView && (
        <section className="ahub-inline">
          {(activeView === "feed" || activeView === "needsAck" || activeView === "all") && (
            <AnnouncementsPage key={activeView} initialView={activeView} />
          )}
          {activeView === "ack" && <AcknowledgmentsOverviewPage key="ack" />}
          {activeView === "new" && (
            <ComposeAnnouncementPage key="new" onPosted={closeView} />
          )}
        </section>
      )}
    </div>
  );
}