import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { recruitingApi } from "./api";
import type { Candidate, DuplicateFlag } from "./api";
import { IconCopyWarn, IconArrowRight } from "./components/icons";
import type { RecruitingOutletContext } from "./RecruitingModulePage";
import "./DuplicatesPage.css";

export function DuplicatesPage() {
  const { openCandidate } = useOutletContext<RecruitingOutletContext>();
  const [flags, setFlags] = useState<DuplicateFlag[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const [threshold, setThreshold] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(t: number) {
    setIsLoading(true);
    setError(null);
    try {
      const [dups, all] = await Promise.all([
        recruitingApi.getDuplicates(t),
        recruitingApi.listCandidates(),
      ]);
      setFlags(dups);
      const map: Record<string, Candidate> = {};
      for (const c of all) map[c.candidate_id] = c;
      setCandidates(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check for duplicates.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load(threshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () =>
      flags.map((f) => ({
        ...f,
        a: candidates[f.candidate_id],
        b: candidates[f.other_candidate_id],
      })),
    [flags, candidates]
  );

  return (
    <div className="dup-page">

      <div className="dup-hero">
        <div className="dup-hero__icon">
          <IconCopyWarn size={24} />
        </div>
        <div>
          <h1>Duplicate Watch</h1>
          <p>
            Candidates whose resume details closely match another applicant — review before
            scheduling duplicate interviews.
          </p>
        </div>
        <div className="dup-hero__threshold">
          <label>
            Similarity threshold
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              onMouseUp={() => load(threshold)}
              onTouchEnd={() => load(threshold)}
            />
          </label>
          <span>{Math.round(threshold * 100)}%</span>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {isLoading && <p className="panel__loading">Scanning candidates…</p>}

      {!isLoading && rows.length === 0 && !error && (
        <div className="dup-empty">
          <IconCopyWarn size={30} />
          <p>No likely duplicates found at this threshold. Nice and clean.</p>
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="dup-table-wrap">
          <table className="dup-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Candidate</th>
                <th>Role</th>
                <th aria-hidden="true"></th>
                <th>Candidate</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span className="dup-table__pct">{Math.round(r.similarity * 100)}%</span>
                  </td>
                  <td>
                    <button
                      className="dup-table__person"
                      onClick={() => openCandidate(r.candidate_id)}
                    >
                      {r.a?.name ?? r.candidate_id}
                    </button>
                  </td>
                  <td className="dup-table__role">{r.a?.applied_role ?? "—"}</td>
                  <td className="dup-table__connector">
                    <IconArrowRight size={15} />
                  </td>
                  <td>
                    <button
                      className="dup-table__person"
                      onClick={() => openCandidate(r.other_candidate_id)}
                    >
                      {r.b?.name ?? r.other_candidate_id}
                    </button>
                  </td>
                  <td className="dup-table__role">{r.b?.applied_role ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}