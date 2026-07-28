import { useEffect, useState } from "react";
import { getAcknowledgmentStatus } from "../api";
import type { AcknowledgmentStatusRow } from "../types";
import { IconCheckCircle, IconClose, IconUsers } from "./icons";

interface Props {
  announcementId: string;
  onClose: () => void;
}

export function AcknowledgmentDrawer({ announcementId, onClose }: Props) {
  const [rows, setRows] = useState<AcknowledgmentStatusRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAcknowledgmentStatus(announcementId)
      .then(setRows)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load status.")
      );
  }, [announcementId]);

  const ackedCount = rows?.filter((r) => r.acknowledged).length ?? 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>
            <IconUsers size={18} className="modal__title-icon" /> Acknowledgments
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}

        {rows && (
          <p className="drawer__summary">
            {ackedCount} of {rows.length} have acknowledged
          </p>
        )}

        {rows && rows.length === 0 && !error && (
          <p className="drawer__summary">No employees are targeted by this announcement.</p>
        )}

        <ul className="drawer__list">
          {(rows ?? []).map((row) => (
            <li key={row.employee_id} className="drawer__row">
              <span
                className={`drawer__marker ${
                  row.acknowledged ? "drawer__marker--acked" : "drawer__marker--pending"
                }`}
              >
                <IconCheckCircle size={14} />
              </span>
              <span className="drawer__employee">{row.employee_id}</span>
              <span
                className={`drawer__status ${
                  row.acknowledged ? "drawer__status--acked" : "drawer__status--pending"
                }`}
              >
                {row.acknowledged ? "Acknowledged" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}