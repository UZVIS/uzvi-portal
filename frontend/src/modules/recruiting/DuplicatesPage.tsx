import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recruitingApi } from "./api";
import type { Candidate, DuplicateFlag } from "./api";
import { IconCopyWarn, IconArrowRight } from "./components/icons";
import "./DuplicatesPage.css";

export function DuplicatesPage() {
  const navigate = useNavigate();
  function openCandidate(id: string) {
    navigate(`/recruiting/candidates/${id}`);
  }
  const [flags, setFlags] = useState<DuplicateFlag[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [dups, all] = await Promise.all([
        recruitingApi.getDuplicates(),
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
    void load();
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
            Candidates who share the same Aadhar card number as another applicant — review
            before scheduling duplicate interviews.
          </p>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {isLoading && <p className="panel__loading">Scanning candidates…</p>}

      {!isLoading && rows.length === 0 && !error && (
        <div className="dup-empty">
          <IconCopyWarn size={30} />
          <p>No matching Aadhar numbers found. Nice and clean.</p>
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="dup-table-wrap">
          <table className="dup-table">
            <thead>
              <tr>
                <th>Aadhar Number</th>
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
                    <span className="dup-table__pct">{r.aadhar_number}</span>
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