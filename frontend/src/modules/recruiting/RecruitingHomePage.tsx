import { useEffect, useMemo, useState } from "react";
import { recruitingApi } from "./api";
import type { Candidate, DuplicateFlag } from "./api";
import { PipelineFunnelPage } from "./PipelineFunnelPage";
import { CandidatePipelinePage } from "./CandidatePipelinePage";
import { SourcingPage } from "./SourcingPage";
import { DuplicatesPage } from "./DuplicatesPage";
import {
  IconUsers,
  IconClock,
  IconCheckCircle,
  IconTarget,
  IconTrendingUp,
  IconLayoutGrid,
  IconCopyWarn,
  IconArrowRight,
} from "./components/icons";
import "./RecruitingHomePage.css";

type ActiveView = "funnel" | "pipeline" | "sourcing" | "duplicates" | null;

export function RecruitingHomePage() {
  const [activeView, setActiveView] = useState<ActiveView>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([
      recruitingApi.listCandidates(),
      recruitingApi.getDuplicates(0.8),
    ])
      .then(([allCandidates, dupes]) => {
        if (cancelled) return;
        setCandidates(allCandidates);
        setDuplicates(dupes);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Couldn't load the hub."
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const total = candidates.length;
    const hired = candidates.filter((c) => c.stage === "Hired").length;
    const rejected = candidates.filter((c) => c.stage === "Rejected").length;
    const active = total - hired - rejected;
    const conversion = total > 0 ? Math.round((hired / total) * 100) : 0;
    return { total, hired, active, conversion };
  }, [candidates]);

  function toggleView(view: Exclude<ActiveView, null>) {
    setActiveView((current) => (current === view ? null : view));
  }

  return (
    <div className="rhub">
      {error && (
        <div className="rhub-error" role="alert">
          {error}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <section className="rhub-stats">
        <div className="rhub-stat">
          <div className="rhub-stat__icon rhub-stat__icon--blue">
            <IconUsers size={18} />
          </div>
          <div>
            <p className="rhub-stat__value">{isLoading ? "…" : totals.total}</p>
            <p className="rhub-stat__label">Total candidates</p>
          </div>
        </div>
        <div className="rhub-stat">
          <div className="rhub-stat__icon rhub-stat__icon--amber">
            <IconClock size={18} />
          </div>
          <div>
            <p className="rhub-stat__value">{isLoading ? "…" : totals.active}</p>
            <p className="rhub-stat__label">In active stages</p>
          </div>
        </div>
        <div className="rhub-stat">
          <div className="rhub-stat__icon rhub-stat__icon--green">
            <IconCheckCircle size={18} />
          </div>
          <div>
            <p className="rhub-stat__value">{isLoading ? "…" : totals.hired}</p>
            <p className="rhub-stat__label">Hired</p>
          </div>
        </div>
        <div className="rhub-stat">
          <div className="rhub-stat__icon rhub-stat__icon--indigo">
            <IconTarget size={18} />
          </div>
          <div>
            <p className="rhub-stat__value">
              {isLoading ? "…" : `${totals.conversion}%`}
            </p>
            <p className="rhub-stat__label">Hire conversion</p>
          </div>
        </div>
      </section>

      {/* ── Module cards ────────────────────────────────────────────── */}
      <section className="rhub-grid">
        <button
          className={`rhub-card ${activeView === "funnel" ? "rhub-card--active" : ""}`}
          onClick={() => toggleView("funnel")}
        >
          <div className="rhub-card__icon rhub-card__icon--indigo">
            <IconTrendingUp size={22} />
          </div>
          <h3>Pipeline Funnel</h3>
          <p>Stage-by-stage drop-off from application to hire.</p>
          <span className="rhub-card__go">
            {activeView === "funnel" ? "Close" : "Open"} <IconArrowRight size={14} />
          </span>
        </button>

        <button
          className={`rhub-card ${activeView === "pipeline" ? "rhub-card--active" : ""}`}
          onClick={() => toggleView("pipeline")}
        >
          <div className="rhub-card__icon rhub-card__icon--violet">
            <IconLayoutGrid size={22} />
          </div>
          <h3>Candidate Pipeline</h3>
          <p>Drag-and-drop board — move candidates between stages.</p>
          <span className="rhub-card__go">
            {activeView === "pipeline" ? "Close" : "Open"} <IconArrowRight size={14} />
          </span>
        </button>

        <button
          className={`rhub-card ${activeView === "sourcing" ? "rhub-card--active" : ""}`}
          onClick={() => toggleView("sourcing")}
        >
          <div className="rhub-card__icon rhub-card__icon--teal">
            <IconUsers size={22} />
          </div>
          <h3>Sourcing &amp; Roles</h3>
          <p>Where candidates come from, and which roles are hottest.</p>
          <span className="rhub-card__go">
            {activeView === "sourcing" ? "Close" : "Open"} <IconArrowRight size={14} />
          </span>
        </button>

        <button
          className={`rhub-card rhub-card--alert ${activeView === "duplicates" ? "rhub-card--active" : ""}`}
          onClick={() => toggleView("duplicates")}
        >
          <div className="rhub-card__icon rhub-card__icon--rose">
            <IconCopyWarn size={22} />
          </div>
          <h3>Duplicate Watch</h3>
          <p>
            {isLoading
              ? "Checking for duplicates…"
              : duplicates.length === 0
                ? "All clear — no likely duplicates."
                : `${duplicates.length} likely duplicate pair(s) to review.`}
          </p>
          <span className="rhub-card__go">
            {activeView === "duplicates" ? "Close" : "Open"} <IconArrowRight size={14} />
          </span>
        </button>
      </section>

      {/* ── Inline content for the selected card, shown on this same page ── */}
      {activeView && (
        <section className="rhub-inline">
          {activeView === "funnel" && <PipelineFunnelPage key="funnel" />}
          {activeView === "pipeline" && <CandidatePipelinePage key="pipeline" />}
          {activeView === "sourcing" && <SourcingPage key="sourcing" />}
          {activeView === "duplicates" && <DuplicatesPage key="duplicates" />}
        </section>
      )}
    </div>
  );
}