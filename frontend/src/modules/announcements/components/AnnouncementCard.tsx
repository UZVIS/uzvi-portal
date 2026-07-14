import { useEffect, useState } from "react";
import type {Announcement, TargetType} from "../types";
import { getAcknowledgmentStatus } from "../api";

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

const TARGET_MARKER_CLASS: Record<TargetType, string> = {
  company_wide: "marker--navy",
  team: "marker--teal",
  role: "marker--plum",
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
  // requires_ack lives on the announcement, but whether *this* employee has
  // acked it lives in the ack-status list — so we fetch it per card.
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

  return (
    <li className="ledger__row">
      <span
        className={`ledger__marker ${TARGET_MARKER_CLASS[announcement.target_type]}`}
      />
      <article
        className={`notice ${
          announcement.status === "archived" ? "notice--archived" : ""
        }`}
      >
        <div className="notice__meta">
          <span className="notice__eyebrow">
            {TARGET_LABEL[announcement.target_type](announcement.target_value)}
          </span>
          {announcement.status === "archived" && (
            <span className="notice__archived-tag">Archived</span>
          )}
          {announcement.requires_ack && (
            <span className="notice__ack-flag">Needs ack</span>
          )}
        </div>

        <h2 className="notice__title">{announcement.title}</h2>
        <p className="notice__body">{announcement.body}</p>

        <div className="notice__footer">
          <span className="notice__posted">
            {announcement.posted_by} · {formatPostedAt(announcement.posted_at)}
          </span>

          <div className="notice__actions">
            {canManage && announcement.requires_ack && (
              <button className="notice__link" onClick={onViewAcknowledgments}>
                View acknowledgments
              </button>
            )}
            {announcement.requires_ack && acknowledged === false && (
              <button
                className="notice__ack-button"
                onClick={onAcknowledge}
                disabled={isAcking}
              >
                {isAcking ? "Acknowledging…" : "Acknowledge"}
              </button>
            )}
            {announcement.requires_ack && acknowledged === true && (
              <span className="notice__acked-tag">Acknowledged ✓</span>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}