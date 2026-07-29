import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recruitingApi } from "./api";
import type { Candidate, DuplicateFlag } from "./api";
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

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="rhub">
      {error && (
        <div className="rhub-error" role="alert">
          {error}
        </div>
      )}

      {/* ── Header card ─────────────────────────────────────────────── */}
      <section className="rhub-hero">
        <div className="rhub-hero__left">
          <p className="rhub-hero__eyebrow">
            <IconSparkles size={14} /> {greeting}
          </p>
          <h1 className="rhub-hero__title">Recruiting Hub</h1>
          <p className="rhub-hero__sub">
            Application to offer — sourcing, the candidate pipeline, and hire
            conversion, all in one place.
          </p>
        </div>
      </section>

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
          className="rhub-card"
          onClick={() => navigate("/recruiting/funnel")}
        >
          <div className="rhub-card__icon rhub-card__icon--indigo">
            <IconTrendingUp size={22} />
          </div>
          <h3>Pipeline Funnel</h3>
          <p>Stage-by-stage drop-off from application to hire.</p>
          <span className="rhub-card__go">
            Open <IconArrowRight size={14} />
          </span>
        </button>

        <button
          className="rhub-card"
          onClick={() => navigate("/recruiting/pipeline")}
        >
          <div className="rhub-card__icon rhub-card__icon--violet">
            <IconLayoutGrid size={22} />
          </div>
          <h3>Candidate Pipeline</h3>
          <p>Drag-and-drop board — move candidates between stages.</p>
          <span className="rhub-card__go">
            Open <IconArrowRight size={14} />
          </span>
        </button>

        <button
          className="rhub-card"
          onClick={() => navigate("/recruiting/sourcing")}
        >
          <div className="rhub-card__icon rhub-card__icon--teal">
            <IconUsers size={22} />
          </div>
          <h3>Sourcing &amp; Roles</h3>
          <p>Where candidates come from, and which roles are hottest.</p>
          <span className="rhub-card__go">
            Open <IconArrowRight size={14} />
          </span>
        </button>

        <button
          className="rhub-card rhub-card--alert"
          onClick={() => navigate("/recruiting/duplicates")}
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
            Open <IconArrowRight size={14} />
          </span>
        </button>
      </section>
    </div>
  );
}