/**
 * M1 - Consultant Utilization Tracker
 * frontend/src/modules/consultant_utilization/components/UtilizationSummaryCard.tsx
 */
import type { UtilizationSummary } from "../api";
import "./UtilizationSummaryCard.css";

interface Props {
  summary: UtilizationSummary;
}

export function UtilizationSummaryCard({ summary }: Props) {
  const pct = Math.round(summary.utilization_pct * 100);

  const flagLabel =
    summary.flag === "under_utilized"
      ? "Under-utilized"
      : summary.flag === "over_allocated"
      ? "Over-allocated"
      : "On track";

  return (
    <div className={`util-card util-card--${summary.flag ?? "ok"}`}>
      <div className="util-card__pct">{pct}%</div>
      <div className="util-card__body">
        <div className="util-card__label">Utilization</div>
        <div className="util-card__flag">{flagLabel}</div>
        <div className="util-card__hours">
          {summary.billable_hours.toFixed(1)}h billable / {summary.available_hours.toFixed(1)}h available
        </div>
        <div className="util-card__period">
          {summary.period_start} → {summary.period_end}
        </div>
      </div>
    </div>
  );
}
