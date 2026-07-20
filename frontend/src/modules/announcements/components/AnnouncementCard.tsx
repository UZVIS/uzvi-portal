import { useEffect, useState, type ReactElement } from "react";
import type { Announcement, TargetType } from "../types";
import { getAcknowledgmentStatus } from "../api";
import {
  IconArchive,
  IconBell,
  IconCheckCircle,
  IconClock,
  IconMegaphone,
  IconShield,
  IconUsers,
} from "./icons";

interface Props {
  announcement: Announcement;
  currentEmployeeId: string;
  canManage: boolean;
  isAcking: boolean;
  onAcknowledge: () => void;
  onViewAcknowledgments: () => void;
}

const TARGET_LABEL: Record<TargetType, (value: string | null) => string> = {
  company_wide: () => "Company-wide",
  team: (value) => `Team · ${value ?? "—"}`,
  role: (value) => `Role · ${value ?? "—"}`,
};

// Color theme per audience: indigo (company-wide), teal (team), violet (role)
const TARGET_THEME: Record<TargetType, string> = {
  company_wide: "c-notice--indigo",
  team: "c-notice--teal",
  role: "c-notice--violet",
};

const TARGET_ICON: Record<TargetType, (size: number) => ReactElement> = {
  company_wide: (size) => <IconMegaphone size={size} />,
  team: (size) => <IconUsers size={size} />,
  role: (size) => <IconShield size={size} />,
};

function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnnouncementCard({
  announcement,
  currentEmployeeId,
  canManage,
  isAcking,
  onAcknowledge,
  onViewAcknowledgments,
}: Props) {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!announcement.requires_ack) {
      setAcknowledged(null);
      return;
    }
    getAcknowledgmentStatus(announcement.announcement_id)
      .then((rows) => {
        if (cancelled) return;
        const mine = rows.find((r) => r.employee_id === currentEmployeeId);
        setAcknowledged(mine?.acknowledged ?? false);
      })
      .catch(() => {
        if (!cancelled) setAcknowledged(false);
      });
    return () => {
      cancelled = true;
    };
  }, [announcement.announcement_id, announcement.requires_ack, currentEmployeeId]);

  const isArchived = announcement.status === "archived";
  const theme = TARGET_THEME[announcement.target_type];

  return (
    <li className="c-notice-item">
      <article className={`c-notice ${theme} ${isArchived ? "c-notice--archived" : ""}`}>
        <div className="c-notice__header">
          <span className="c-notice__badge">
            {TARGET_ICON[announcement.target_type](19)}
          </span>

          <div className="c-notice__headline">
            <div className="c-notice__meta">
              <span className="c-notice__eyebrow">
                {TARGET_LABEL[announcement.target_type](announcement.target_value)}
              </span>
              {isArchived && (
                <span className="c-chip c-chip--muted">
                  <IconArchive size={12} /> Archived
                </span>
              )}
              {announcement.requires_ack && (
                <span className="c-chip c-chip--amber">
                  <IconBell size={12} /> Needs ack
                </span>
              )}
            </div>
            <h2 className="c-notice__title">{announcement.title}</h2>
          </div>
        </div>

        <p className="c-notice__body">{announcement.body}</p>

        <div className="c-notice__footer">
          <span className="c-notice__posted">
            <IconClock size={12} />
            {announcement.posted_by} · {formatPostedAt(announcement.posted_at)}
          </span>

          <div className="c-notice__actions">
            {canManage && announcement.requires_ack && (
              <button className="c-notice__link" onClick={onViewAcknowledgments}>
                <IconUsers size={14} /> View acknowledgments
              </button>
            )}
            {announcement.requires_ack && acknowledged === false && (
              <button
                className="c-notice__ack-button"
                onClick={onAcknowledge}
                disabled={isAcking}
              >
                <IconCheckCircle size={14} />
                {isAcking ? "Acknowledging…" : "Acknowledge"}
              </button>
            )}
            {announcement.requires_ack && acknowledged === true && (
              <span className="c-notice__acked-tag">
                <IconCheckCircle size={14} /> Acknowledged
              </span>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}