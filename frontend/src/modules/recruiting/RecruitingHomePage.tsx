import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { recruitingApi } from "./api";
import type { Candidate, DuplicateFlag } from "./api";
import { STAGE_META, initialsOf } from "./stageMeta";
import type { RecruitingOutletContext } from "./RecruitingModulePage";
import {
  IconSparkles,
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

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function RecruitingHomePage() {
  const navigate = useNavigate();
  const { openCandidate } = useOutletContext<RecruitingOutletContext>();

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
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the hub.");
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

  const recent = useMemo(
    () =>
      [...candidates]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [candidates]
  );

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="rhub">
      {error && <p className="error-banner">{error}</p>}

      <section className="rhub-hero">
        <div className="rhub-hero__blob rhub-hero__blob--a" aria-hidden="true" />
        <div className="rhub-hero__blob rhub-hero__blob--b" aria-hidden="true" />
        <div className="rhub-hero__content">
          <p className="rhub-hero__eyebrow">
            <IconSparkles size={14} /> {greeting}
          </p>
          <h1 className="rhub-hero__title">Recruiting Hub</h1>
          <p className="rhub-hero__sub">
            Application to offer — sourcing, the candidate pipeline, and hire
            conversion, all in one place.
          </p>

          <div className="rhub-hero__stats">
            <div className="rhub-stat-pill">
              <span className="rhub-stat-pill__icon rhub-stat-pill__icon--blue">
                <IconUsers size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : totals.total}</strong>
                <span>Total candidates</span>
              </div>
            </div>
            <div className="rhub-stat-pill">
              <span className="rhub-stat-pill__icon rhub-stat-pill__icon--amber">
                <IconClock size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : totals.active}</strong>
                <span>In active stages</span>
              </div>
            </div>
            <div className="rhub-stat-pill">
              <span className="rhub-stat-pill__icon rhub-stat-pill__icon--green">
                <IconCheckCircle size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : totals.hired}</strong>
                <span>Hired</span>
              </div>
            </div>
            <div className="rhub-stat-pill">
              <span className="rhub-stat-pill__icon rhub-stat-pill__icon--navy">
                <IconTarget size={16} />
              </span>
              <div>
                <strong>{isLoading ? "…" : `${totals.conversion}%`}</strong>
                <span>Hire conversion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rhub-grid">
        <button className="rhub-card rhub-card--indigo" onClick={() => navigate("/recruiting/funnel")}>
          <span className="rhub-card__icon">
            <IconTrendingUp size={26} />
          </span>
          <div className="rhub-card__text">
            <h3>Pipeline Funnel</h3>
            <p>Stage-by-stage drop-off from application to hire.</p>
          </div>
          <span className="rhub-card__go">
            Open <IconArrowRight size={15} />
          </span>
        </button>

        <button className="rhub-card rhub-card--violet" onClick={() => navigate("/recruiting/pipeline")}>
          <span className="rhub-card__icon">
            <IconLayoutGrid size={26} />
          </span>
          <div className="rhub-card__text">
            <h3>Candidate Pipeline</h3>
            <p>Drag-and-drop board — move candidates between stages.</p>
          </div>
          <span className="rhub-card__go">
            Open <IconArrowRight size={15} />
          </span>
        </button>

        <button className="rhub-card rhub-card--teal" onClick={() => navigate("/recruiting/sourcing")}>
          <span className="rhub-card__icon">
            <IconUsers size={26} />
          </span>
          <div className="rhub-card__text">
            <h3>Sourcing &amp; Roles</h3>
            <p>Where candidates come from, and which roles are hottest.</p>
          </div>
          <span className="rhub-card__go">
            Open <IconArrowRight size={15} />
          </span>
        </button>

        <button className="rhub-card rhub-card--spotlight" onClick={() => navigate("/recruiting/duplicates")}>
          <span className="rhub-card__spotlight-icon">
            <IconCopyWarn size={26} />
          </span>
          <div className="rhub-card__text">
            <h3>Duplicate Watch</h3>
            <p>
              {isLoading
                ? "Checking for duplicates…"
                : duplicates.length === 0
                ? "All clear — no likely duplicates."
                : `${duplicates.length} likely duplicate pair(s) to review.`}
            </p>
          </div>
          <span className="rhub-card__go rhub-card__go--light">
            Open <IconArrowRight size={15} />
          </span>
        </button>
      </section>

      <section className="rhub-recent">
        <div className="rhub-recent__header">
          <h2>
            <IconClock size={16} /> Recently added candidates
          </h2>
          {candidates.length > 0 && (
            <button className="rhub-recent__viewall" onClick={() => navigate("/recruiting/pipeline")}>
              View all <IconArrowRight size={13} />
            </button>
          )}
        </div>

        {isLoading && <p className="rhub-recent__state">Loading candidates…</p>}

        {!isLoading && recent.length === 0 && (
          <p className="rhub-recent__state">No candidates logged yet.</p>
        )}

        <div className="rhub-recent__list">
          {recent.map((c) => {
            const meta = STAGE_META[c.stage];
            return (
              <div
                key={c.candidate_id}
                className="rhub-recent__item"
                onClick={() => openCandidate(c.candidate_id)}
              >
                <span className="rhub-recent__item-badge" style={{ background: meta.gradient }}>
                  {initialsOf(c.name)}
                </span>
                <div className="rhub-recent__item-text">
                  <span className="rhub-recent__item-title">{c.name}</span>
                  <span className="rhub-recent__item-meta">{c.applied_role}</span>
                </div>
                <span className="rhub-recent__badge" style={{ background: meta.soft, color: meta.solid }}>
                  {c.stage}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}