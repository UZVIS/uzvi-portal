import { useEffect, useRef, useState } from "react";
import { getAcknowledgmentStatus } from "../api";
import type { AcknowledgmentStatusRow } from "../types";
import { fetchEmployee, type Employee } from "../../../shared/auth/api";
import { IconCheckCircle, IconClose, IconUsers } from "./icons";

interface Props {
  announcementId: string;
  onClose: () => void;
}

interface DrawerRow extends AcknowledgmentStatusRow {
  name: string;
}

export function AcknowledgmentDrawer({ announcementId, onClose }: Props) {
  const [rows, setRows] = useState<DrawerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const employeeCache = useRef(new Map<string, Employee>());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const statusRows = await getAcknowledgmentStatus(announcementId);

        async function getEmployeeName(employeeId: string): Promise<string> {
          if (employeeCache.current.has(employeeId)) {
            return employeeCache.current.get(employeeId)!.name;
          }
          try {
            const emp = await fetchEmployee(employeeId);
            employeeCache.current.set(employeeId, emp);
            return emp.name;
          } catch {
            return employeeId;
          }
        }

        const withNames = await Promise.all(
          statusRows.map(async (row) => ({
            ...row,
            name: await getEmployeeName(row.employee_id),
          }))
        );

        if (!cancelled) setRows(withNames);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load status.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
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
              <span className="drawer__employee">
                {row.name}
                {row.name !== row.employee_id && (
                  <span className="drawer__employee-id"> · {row.employee_id}</span>
                )}
              </span>
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