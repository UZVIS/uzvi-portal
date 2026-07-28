import { useEffect, useMemo, useState } from "react";
import { recruitingApi } from "./api";
import type { FunnelStats } from "./api";
import { StageFunnelChart } from "./components/charts";
import { STAGE_META } from "./stageMeta";
import { IconTrendingUp, IconUsers, IconCheckCircle, IconTarget } from "./components/icons";
import "./PipelineFunnelPage.css";

export function PipelineFunnelPage() {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    recruitingApi
      .getFunnelStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load funnel stats.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const funnelData = useMemo(() => {
    if (!stats) return [];
    const order = ["Applied", "Screened", "Interview", "Offer", "Hired"] as const;
    return order.map((stage) => ({
      label: stage,
      value: stats.by_stage.find((s) => s.stage === stage)?.count ?? 0,
      color: STAGE_META[stage].solid,
    }));
  }, [stats]);

  const rejectedDatum = useMemo(() => {
    const value = stats?.by_stage.find((s) => s.stage === "Rejected")?.count ?? 0;
    return { label: "Rejected", value, color: STAGE_META.Rejected.solid };
  }, [stats]);

  const breakdown = useMemo(() => {
    const base = funnelData[0]?.value || 0;
    return funnelData.map((d, i) => {
      const prev = i > 0 ? funnelData[i - 1].value : d.value;
      const pctOfTotal = base > 0 ? Math.round((d.value / base) * 100) : 0;
      const dropOff = i > 0 && prev > 0 ? Math.round(((prev - d.value) / prev) * 100) : 0;
      return { ...d, pctOfTotal, dropOff, isFirst: i === 0 };
    });
  }, [funnelData]);

  const timeInStageRows = useMemo(() => {
    if (!stats) return [];
    const order = ["Applied", "Screened", "Interview", "Offer"] as const;
    return order.map((stage) => {
      const entry = stats.time_in_stage.find((t) => t.stage === stage);
      return {
        label: stage,
        color: STAGE_META[stage].solid,
        avgDays: entry?.avg_days_in_stage ?? null,
        candidateCount: entry?.candidate_count ?? 0,
      };
    });
  }, [stats]);

  const totals = useMemo(() => {
    const total = funnelData[0]?.value ?? 0;
    const hired = funnelData[funnelData.length - 1]?.value ?? 0;
    const conversion = total > 0 ? Math.round((hired / total) * 100) : 0;
    return { total, hired, conversion };
  }, [funnelData]);

  return (
    <div className="funnel-page">

      <div className="funnel-page__hero">
        <div className="funnel-page__hero-icon">
          <IconTrendingUp size={24} />
        </div>
        <div>
          <h1>Pipeline Funnel</h1>
          <p>How candidates progress — and where they drop off — across every stage.</p>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="funnel-page__kpis">
        <div className="kpi-card kpi-card--indigo">
          <div className="kpi-card__icon">
            <IconUsers size={18} />
          </div>
          <div>
            <strong>{isLoading ? "—" : totals.total}</strong>
            <span>Applied (base)</span>
          </div>
        </div>
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon">
            <IconCheckCircle size={18} />
          </div>
          <div>
            <strong>{isLoading ? "—" : totals.hired}</strong>
            <span>Hired</span>
          </div>
        </div>
        <div className="kpi-card kpi-card--rose">
          <div className="kpi-card__icon">
            <IconTarget size={18} />
          </div>
          <div>
            <strong>{isLoading ? "—" : `${totals.conversion}%`}</strong>
            <span>End-to-end conversion</span>
          </div>
        </div>
      </div>

      <div className="funnel-page__grid">
        <section className="panel funnel-page__chart-panel">
          <header className="panel__header">
            <h2>Stage Funnel</h2>
          </header>
          <div className="panel__body">
            {isLoading ? (
              <p className="panel__loading">Loading funnel…</p>
            ) : (
              <StageFunnelChart data={funnelData} reject={rejectedDatum} />
            )}
          </div>
        </section>

        <section className="panel funnel-page__table-panel">
          <header className="panel__header">
            <h2>Stage Breakdown</h2>
          </header>
          <div className="panel__body">
            {isLoading ? (
              <p className="panel__loading">Loading…</p>
            ) : (
              <table className="fp-table">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Count</th>
                    <th>% of applied</th>
                    <th>Drop-off</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row) => (
                    <tr key={row.label}>
                      <td>
                        <span className="fp-table__dot" style={{ background: row.color }} />
                        {row.label}
                      </td>
                      <td>{row.value}</td>
                      <td>{row.pctOfTotal}%</td>
                      <td>
                        {row.isFirst ? (
                          <span className="fp-table__dash">—</span>
                        ) : (
                          <span className={row.dropOff > 0 ? "fp-table__dropoff" : "fp-table__dash"}>
                            {row.dropOff > 0 ? `−${row.dropOff}%` : "0%"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="fp-table__reject-row">
                    <td>
                      <span
                        className="fp-table__dot"
                        style={{ background: rejectedDatum.color }}
                      />
                      Rejected
                    </td>
                    <td colSpan={3}>{rejectedDatum.value} candidate(s) exited the pipeline</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <section className="panel funnel-page__table-panel funnel-page__timeinstage-panel">
        <header className="panel__header">
          <h2>Time in Stage</h2>
          <p className="panel__subtitle">
            Average days a candidate spends in each stage before moving forward.
          </p>
        </header>
        <div className="panel__body">
          {isLoading ? (
            <p className="panel__loading">Loading…</p>
          ) : (
            <table className="fp-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Avg. days before moving on</th>
                  <th>Candidates completed</th>
                </tr>
              </thead>
              <tbody>
                {timeInStageRows.map((row) => (
                  <tr key={row.label}>
                    <td>
                      <span className="fp-table__dot" style={{ background: row.color }} />
                      {row.label}
                    </td>
                    <td>
                      {row.avgDays === null ? (
                        <span className="fp-table__dash">No data yet</span>
                      ) : (
                        <span className="fp-table__days">
                          {row.avgDays} day{row.avgDays === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                    <td>{row.candidateCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}