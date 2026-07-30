import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { listFeedForEmployee } from "../announcements/api";
import type { Announcement } from "../announcements/types";
import {
  IconArrowRight,
  IconBell,
  IconInbox,
  IconLayers,
  IconMegaphone,
  IconPlus,
  IconSparkles,
  IconUsers,
} from "../announcements/components/icons";
import "./AnnouncementsDashboardPage.css";

const POSTER_TIERS = new Set(["Admin/Leadership", "Manager"]);

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function AnnouncementsDashboardPage() {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const canManage = employee ? POSTER_TIERS.has(employee.access_tier) : false;

  const [feed, setFeed] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    listFeedForEmployee(employee.employee_id)
      .then((data) => {
        if (!cancelled) setFeed(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setFeed([]);
          setError(err instanceof Error ? err.message : "Couldn't load the notice board.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employee]);

  const stats = useMemo(() => {
    const total = feed.length;
    const needsAck = feed.filter((a) => a.requires_ack).length;
    const companyWide = feed.filter((a) => a.target_type === "company_wide").length;
    return { total, needsAck, companyWide };
  }, [feed]);

  if (!employee) return null;

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="ahub">
      {error && (
        <div className="ahub-error" role="alert">
          {error}
        </div>
      )}

      {/* ── Header card ─────────────────────────────────────────────── */}
      <section className="ahub-hero">
        <p className="ahub-hero__eyebrow">
          <IconSparkles size={14} /> {greeting}
        </p>
        <h1 className="ahub-hero__title">Notice Board</h1>
        <p className="ahub-hero__sub">
          Everything for company announcements — your feed, posting new notices,
          and tracking who's acknowledged what, all in one place.
        </p>
      </section>

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
        <button className="ahub-card" onClick={() => navigate("/announcements")}>
          <div className="ahub-card__icon ahub-card__icon--indigo">
            <IconInbox size={22} />
          </div>
          <h3>My Feed</h3>
          <p>Company-wide notices, plus anything for your team or role.</p>
          <span className="ahub-card__go">
            Open <IconArrowRight size={14} />
          </span>
        </button>

        {!canManage && (
          <button className="ahub-card ahub-card--alert" onClick={() => navigate("/announcements")}>
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
              {stats.needsAck > 0 ? "Review" : "Open"} <IconArrowRight size={14} />
            </span>
          </button>
        )}

        {canManage && (
          <button className="ahub-card" onClick={() => navigate("/announcements?view=all")}>
            <div className="ahub-card__icon ahub-card__icon--violet">
              <IconLayers size={22} />
            </div>
            <h3>All Announcements</h3>
            <p>Every notice across the company — active and archived.</p>
            <span className="ahub-card__go">
              Open <IconArrowRight size={14} />
            </span>
          </button>
        )}

        {canManage && (
          <button className="ahub-card" onClick={() => navigate("/announcements/acknowledgments")}>
            <div className="ahub-card__icon ahub-card__icon--teal">
              <IconUsers size={22} />
            </div>
            <h3>View Acknowledgments</h3>
            <p>See exactly who has (and hasn't) acknowledged each notice.</p>
            <span className="ahub-card__go">
              Open <IconArrowRight size={14} />
            </span>
          </button>
        )}

        {canManage && (
          <button className="ahub-card" onClick={() => navigate("/announcements/new")}>
            <div className="ahub-card__icon ahub-card__icon--orange">
              <IconMegaphone size={22} />
            </div>
            <h3>
              New Announcement <IconPlus size={14} />
            </h3>
            <p>Post a notice to the company, a team, or a specific role.</p>
            <span className="ahub-card__go">
              Compose <IconArrowRight size={14} />
            </span>
          </button>
        )}
      </section>
    </div>
  );
}