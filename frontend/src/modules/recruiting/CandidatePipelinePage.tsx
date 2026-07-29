import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { recruitingApi, PIPELINE_STAGES } from "./api";
import type { Candidate, CandidateInput, CandidateStage, CandidateUpdateInput } from "./api";
import { initialsOf, STAGE_META, colorForIndex } from "./stageMeta";
import { AddCandidateModal } from "./components/AddCandidateModal";
import { EditCandidateModal } from "./components/EditCandidateModal";
import { DeleteCandidateModal } from "./components/DeleteCandidateModal";
import { IconPlus, IconFilter, IconUsers, IconEdit, IconTrash } from "./components/icons";
import type { RecruitingOutletContext } from "./RecruitingModulePage";
import "./CandidatePipelinePage.css";

const STAGE_SELECT_CLASS: Record<CandidateStage, string> = {
  Applied: "pt-stage-select--applied",
  Screened: "pt-stage-select--screened",
  Interview: "pt-stage-select--interview",
  Offer: "pt-stage-select--offer",
  Hired: "pt-stage-select--hired",
  Rejected: "pt-stage-select--rejected",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return colorForIndex(hash);
}

export function CandidatePipelinePage() {
  const navigate = useNavigate();
  const { openCandidate } = useOutletContext<RecruitingOutletContext>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recruitingApi.listCandidates();
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load candidates.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roles = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.applied_role))).sort(),
    [candidates]
  );

  const filtered = useMemo(
    () =>
      candidates.filter(
        (c) => (!roleFilter || c.applied_role === roleFilter) && (!stageFilter || c.stage === stageFilter)
      ),
    [candidates, roleFilter, stageFilter]
  );

  async function handleCreate(input: CandidateInput) {
    await recruitingApi.createCandidate(input);
    await load();
  }

  async function handleUpdate(candidateId: string, input: CandidateUpdateInput) {
    await recruitingApi.updateCandidate(candidateId, input);
    await load();
  }

  async function handleDelete(candidateId: string) {
    await recruitingApi.deleteCandidate(candidateId);
    setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId));
  }

  async function moveCandidate(candidateId: string, stage: CandidateStage) {
    const candidate = candidates.find((c) => c.candidate_id === candidateId);
    if (!candidate || candidate.stage === stage) return;
    setMovingId(candidateId);
    setCandidates((prev) =>
      prev.map((c) => (c.candidate_id === candidateId ? { ...c, stage } : c))
    );
    try {
      await recruitingApi.updateStage(candidateId, stage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't move candidate.");
      await load();
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div className="pipeline">
      <button type="button" className="rec-back-top" onClick={() => navigate("/recruiting")}>
        ← Back
      </button>
      <div className="pipeline__hero">
        <div className="pipeline__hero-icon">
          <IconUsers size={20} />
        </div>
        <div>
          <h1>Candidate Pipeline</h1>
          <p>Every candidate, one table — use the stage dropdown to move them along.</p>
        </div>
      </div>

      <div className="pipeline__toolbar">
        <div className="pipeline__toolbar-left">
          <span className="pipeline__count-chip">
            <IconUsers size={14} /> {filtered.length} candidates
          </span>
          <div className="pipeline__filter">
            <IconFilter size={14} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="pipeline__filter">
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="pt-btn" onClick={() => setShowAddModal(true)}>
          <IconPlus size={15} /> Add Candidate
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="pt-table-wrap">
        {isLoading ? (
          <p className="panel__loading">Loading pipeline…</p>
        ) : (
          <table className="pt-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Source</th>
                <th>Stage</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.candidate_id}
                  className={movingId === c.candidate_id ? "pt-row--moving" : ""}
                >
                  <td style={{ boxShadow: `inset 3px 0 0 ${STAGE_META[c.stage].solid}` }}>
                    <button className="pt-candidate" onClick={() => openCandidate(c.candidate_id)}>
                      <span className="pt-avatar" style={{ background: avatarColorFor(c.candidate_id) }}>
                        {initialsOf(c.name)}
                      </span>
                      <span style={{ color: avatarColorFor(c.candidate_id) }}>{c.name}</span>
                    </button>
                  </td>
                  <td>{c.applied_role}</td>
                  <td>{c.source || <span className="pt-dash">—</span>}</td>
                  <td>
                    <select
                      className={`pt-stage-select ${STAGE_SELECT_CLASS[c.stage]}`}
                      value={c.stage}
                      onChange={(e) => moveCandidate(c.candidate_id, e.target.value as CandidateStage)}
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(c.created_at)}</td>
                  <td>
                    <div className="pt-row-actions">
                      <button
                        className="pt-icon-btn pt-icon-btn--edit"
                        onClick={() => setEditingCandidate(c)}
                        aria-label={`Edit ${c.name}`}
                        title="Edit candidate"
                      >
                        <IconEdit size={15} />
                      </button>
                      <button
                        className="pt-icon-btn pt-icon-btn--delete"
                        onClick={() => setDeletingCandidate(c)}
                        aria-label={`Delete ${c.name}`}
                        title="Delete candidate"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="pt-table__empty">
                    No candidates match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddCandidateModal onClose={() => setShowAddModal(false)} onCreate={handleCreate} />
      )}

      {editingCandidate && (
        <EditCandidateModal
          candidate={editingCandidate}
          onClose={() => setEditingCandidate(null)}
          onSave={handleUpdate}
        />
      )}

      {deletingCandidate && (
        <DeleteCandidateModal
          candidate={deletingCandidate}
          onClose={() => setDeletingCandidate(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}