import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { listFeedForEmployee } from "../announcements/api";
import type { Announcement } from "../announcements/types";
import {
  IconBell,
  IconBuilding,
  IconCheckCircle,
  IconClock,
  IconInbox,
  IconLayers,
  IconLogOut,
  IconMegaphone,
  IconPlus,
  IconSparkles,
  IconArrowRight,
  IconUsers,
} from "../announcements/components/icons";
import "./AnnouncementsDashboardPage.css";

const POSTER_TIERS = new Set(["Admin/Leadership", "Manager"]);

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function AnnouncementsDashboardPage() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const canManage = employee ? POSTER_TIERS.has(employee.access_tier) : false;

  const [feed, setFeed] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    setIsLoading(true);
    listFeedForEmployee(employee.employee_id)
      .then((data) => {
        if (!cancelled) setFeed(data);
      })
      .catch(() => {
        if (!cancelled) setFeed([]);
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

  const recent = feed.slice(0, 4);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!employee) return null;

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="dash-screen">
      <header className="dash-topbar">
        <div className="dash-topbar__brand">
          <span className="dash-topbar__brand-icon">
            <IconBuilding size={18} />
          </span>
          UZVI
        </div>
        <div className="dash-topbar__user">
          <div className="dash-topbar__user-info">
            <span className="dash-topbar__user-name">{employee.name}</span>
            <span className="dash-topbar__user-role">{employee.access_tier}</span>
          </div>
          <span className="dash-topbar__avatar">{initialsOf(employee.name)}</span>
          <button className="dash-topbar__logout" onClick={handleLogout}>
            <IconLogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <section className="dash-hero">
        <div className="dash-hero__blob dash-hero__blob--a" aria-hidden="true" />
        <div className="dash-hero__blob dash-hero__blob--b" aria-hidden="true" />
        <div className="dash-hero__content">
          <p className="dash-hero__eyebrow">
            <IconSparkles size={14} /> {greeting}, {employee.name.split(" ")[0]}
          </p>
          <h1 className="dash-hero__title">What would you like to do?</h1>
          <p className="dash-hero__sub">
            Everything for the Notice Board lives right here — your feed, posting
            new notices, and tracking who's acknowledged what.
          </p>

          <div className="dash-hero__stats">
            <div className="dash-stat-pill">
              <span className="dash-stat-pill__icon dash-stat-pill__icon--blue">
                <IconInbox size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : stats.total}</strong>
                <span>In your feed</span>
              </div>
            </div>
            <div className="dash-stat-pill">
              <span className="dash-stat-pill__icon dash-stat-pill__icon--amber">
                <IconBell size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : stats.needsAck}</strong>
                <span>Need acknowledgment</span>
              </div>
            </div>
            <div className="dash-stat-pill">
              <span className="dash-stat-pill__icon dash-stat-pill__icon--navy">
                <IconLayers size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : stats.companyWide}</strong>
                <span>Company-wide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-grid">
        <button
          className="dash-card dash-card--indigo"
          onClick={() => navigate("/announcements")}
        >
          <span className="dash-card__icon">
            <IconInbox size={26} />
          </span>
          <div className="dash-card__text">
            <h3>My Feed</h3>
            <p>Company-wide notices, plus anything for your team or role.</p>
          </div>
          <span className="dash-card__go">
            Open <IconArrowRight size={15} />
          </span>
        </button>

        {canManage && (
          <button
            className="dash-card dash-card--violet"
            onClick={() => navigate("/announcements?view=all")}
          >
            <span className="dash-card__icon">
              <IconLayers size={26} />
            </span>
            <div className="dash-card__text">
              <h3>All Announcements</h3>
              <p>Every notice across the company — active and archived.</p>
            </div>
            <span className="dash-card__go">
              Open <IconArrowRight size={15} />
            </span>
          </button>
        )}

        {canManage && (
          <button
            className="dash-card dash-card--teal"
            onClick={() => navigate("/announcements/acknowledgments")}
          >
            <span className="dash-card__icon">
              <IconUsers size={26} />
            </span>
            <div className="dash-card__text">
              <h3>View Acknowledgments</h3>
              <p>See exactly who has (and hasn't) acknowledged each notice.</p>
            </div>
            <span className="dash-card__go">
              Open <IconArrowRight size={15} />
            </span>
          </button>
        )}

        {canManage && (
          <button
            className="dash-card dash-card--spotlight"
            onClick={() => navigate("/announcements/new")}
          >
            <span className="dash-card__spotlight-icon">
              <IconMegaphone size={30} />
            </span>
            <div className="dash-card__text">
              <h3>
                New Announcement <IconPlus size={16} />
              </h3>
              <p>Post a notice to the company, a team, or a specific role.</p>
            </div>
            <span className="dash-card__go dash-card__go--light">
              Compose <IconArrowRight size={15} />
            </span>
          </button>
        )}
      </section>

      <section className="dash-recent">
        <div className="dash-recent__header">
          <h2>
            <IconClock size={16} /> Recent in your feed
          </h2>
          {feed.length > 0 && (
            <button className="dash-recent__viewall" onClick={() => navigate("/announcements")}>
              View all <IconArrowRight size={13} />
            </button>
          )}
        </div>

        {isLoading && <p className="dash-recent__state">Loading your feed…</p>}

        {!isLoading && recent.length === 0 && (
          <p className="dash-recent__state">Nothing here yet. Check back soon.</p>
        )}

        <div className="dash-recent__list">
          {recent.map((a) => (
            <div key={a.announcement_id} className="dash-recent__item">
              <span className="dash-recent__item-icon">
                <IconMegaphone size={16} />
              </span>
              <div className="dash-recent__item-text">
                <span className="dash-recent__item-title">{a.title}</span>
                <span className="dash-recent__item-meta">
                  {a.target_type === "company_wide"
                    ? "Company-wide"
                    : a.target_type === "team"
                    ? `Team: ${a.target_value}`
                    : `Role: ${a.target_value}`}
                </span>
              </div>
              {a.requires_ack && (
                <span className="dash-recent__badge">
                  <IconCheckCircle size={12} /> Needs ack
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}