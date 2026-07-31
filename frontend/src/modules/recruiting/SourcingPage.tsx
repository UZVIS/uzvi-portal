import { useEffect, useMemo, useState } from "react";
import { recruitingApi } from "./api";
import type { FunnelStats } from "./api";
import { DonutChart, BarList } from "./components/charts";
import { colorForIndex } from "./stageMeta";
import { IconUsers, IconBriefcase, IconTarget, IconStar } from "./components/icons";
import "./SourcingPage.css";

export function SourcingPage() {
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load sourcing data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.by_source)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: colorForIndex(i) }));
  }, [stats]);

  const roleData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.by_role)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: colorForIndex(i) }));
  }, [stats]);

  const sourceTotal = sourceData.reduce((sum, d) => sum + d.value, 0);
  const topSource = sourceData[0];
  const topSourcePct = topSource && sourceTotal > 0 ? Math.round((topSource.value / sourceTotal) * 100) : 0;
  const topRole = roleData[0];
  const rolesOpenCount = roleData.length;

  return (
    <div className="sourcing-page">
      <div className="sourcing-page__hero">
        <div className="sourcing-page__hero-icon">
          <IconUsers size={24} />
        </div>
        <div>
          <h1>Sourcing &amp; Roles</h1>
          <p>Where applicants are coming from, and which roles are attracting them.</p>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="sourcing-page__kpis">
        <div className="src-kpi-card src-kpi-card--teal">
          <div className="src-kpi-card__icon">
            <IconUsers size={17} />
          </div>
          <div>
            <strong>{isLoading ? "—" : sourceTotal}</strong>
            <span>Total applicants</span>
          </div>
        </div>
        <div className="src-kpi-card src-kpi-card--amber">
          <div className="src-kpi-card__icon">
            <IconStar size={17} />
          </div>
          <div>
            <strong>{isLoading || !topSource ? "—" : topSource.label}</strong>
            <span>{isLoading || !topSource ? "Top channel" : `Top channel · ${topSourcePct}% of applicants`}</span>
          </div>
        </div>
        <div className="src-kpi-card src-kpi-card--indigo">
          <div className="src-kpi-card__icon">
            <IconTarget size={17} />
          </div>
          <div>
            <strong>{isLoading || !topRole ? "—" : topRole.label}</strong>
            <span>{isLoading ? "Hottest role" : `Hottest role · ${rolesOpenCount} role(s) in demand`}</span>
          </div>
        </div>
      </div>

      <div className="sourcing-page__grid">
        <section className="panel">
          <header className="panel__header">
            <h2>Sourcing Mix</h2>
            <span className="panel__hint">By channel</span>
          </header>
          <div className="panel__body">
            {isLoading ? (
              <p className="panel__loading">Loading…</p>
            ) : (
              <div className="sourcing-page__donut-row">
                <DonutChart data={sourceData} size={140} />
                <ul className="sourcing-page__legend">
                  {sourceData.map((d, i) => (
                    <li key={i}>
                      <span className="sourcing-page__dot" style={{ background: d.color }} />
                      <span className="sourcing-page__legend-label">{d.label}</span>
                      <b>{d.value}</b>
                      <span className="sourcing-page__legend-pct">
                        {sourceTotal > 0 ? Math.round((d.value / sourceTotal) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                  {sourceData.length === 0 && <li>No source data yet.</li>}
                </ul>
              </div>
            )}
          </div>
          {!isLoading && topSource && (
            <p className="panel__footnote">
              <IconStar size={13} /> <strong>{topSource.label}</strong> is bringing in the most candidates, at{" "}
              {topSourcePct}% of total applicants.
            </p>
          )}
        </section>

        <section className="panel">
          <header className="panel__header">
            <h2>
              <IconBriefcase size={16} /> Roles in Demand
            </h2>
            <span className="panel__hint">By applied role</span>
          </header>
          <div className="panel__body">
            {isLoading ? <p className="panel__loading">Loading…</p> : <BarList data={roleData} />}
          </div>
          {!isLoading && topRole && (
            <p className="panel__footnote">
              <IconTarget size={13} /> <strong>{topRole.label}</strong> is the most applied-to role, with{" "}
              {rolesOpenCount} role(s) currently drawing applicants.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}