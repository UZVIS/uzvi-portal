import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  recruitingApi,
  genId,
  PIPELINE_STAGES,
  type CandidateDetail,
  type CandidateStage,
} from "./api";
import { STAGE_META, initialsOf } from "./stageMeta";
import {
  IconArrowLeft,
  IconPlus,
  IconStar,
  IconUserCheck,
  IconClock,
  IconCheckCircle,
} from "./components/icons";
import "./CandidateDetailPage.css";

// The backend returns naive timestamps with no timezone suffix (e.g.
// "2026-07-25T02:44:12"). `new Date(...)` treats a string like that as
// LOCAL time, but the value is actually UTC — so it rendered several
// hours off. Appending "Z" when no timezone is already present tells
// the browser to correctly convert UTC -> local time.
function parseServerTimestamp(iso: string): Date {
  const hasTz = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasTz ? iso : `${iso}Z`);
}

export function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showStageForm, setShowStageForm] = useState(false);
  const [stageName, setStageName] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [notes, setNotes] = useState("");

  const [scorecardOpenFor, setScorecardOpenFor] = useState<string | null>(null);
  const [scoreValue, setScoreValue] = useState("");
  const [questionsValue, setQuestionsValue] = useState("");

  const [showConvert, setShowConvert] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [joinDate, setJoinDate] = useState("");

  async function load() {
    if (!candidateId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await recruitingApi.getCandidate(candidateId);
      setCandidate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this candidate.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  async function handleMoveStage(stage: CandidateStage) {
    if (!candidate || !candidateId || candidate.stage === stage) return;

    if (stage === "Rejected" && candidate.converted_emp_id) {
      setError("This candidate has already been converted to an employee and can't be rejected.");
      return;
    }

    // A candidate can't be moved to Offer (or beyond) without at least one
    // logged interview stage on record.
    const stagesRequiringInterviewLog: CandidateStage[] = ["Offer", "Hired"];
    if (stagesRequiringInterviewLog.includes(stage) && candidate.interview_stages.length === 0) {
      setError(
        `Log at least one interview stage before moving ${candidate.name} to ${stage}.`
      );
      setShowStageForm(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await recruitingApi.updateStage(candidateId, stage);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update stage.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddStage(e: React.FormEvent) {
    e.preventDefault();
    if (!stageName.trim() || !candidateId) return;
    setBusy(true);
    setError(null);
    try {
      await recruitingApi.addInterviewStage(candidateId, {
        stage_id: genId("IST"),
        stage_name: stageName.trim(),
        interviewer_id: interviewerId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setStageName("");
      setInterviewerId("");
      setNotes("");
      setShowStageForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log interview stage.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddScorecard(stageId: string) {
    setBusy(true);
    setError(null);
    try {
      await recruitingApi.addScorecard(stageId, {
        scorecard_id: genId("SC"),
        score: scoreValue ? parseFloat(scoreValue) : undefined,
        questions: questionsValue.trim() || undefined,
      });
      setScoreValue("");
      setQuestionsValue("");
      setScorecardOpenFor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save scorecard.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmployeeId.trim() || !joinDate || !candidateId) return;
    setBusy(true);
    setError(null);
    try {
      await recruitingApi.convertToEmployee(candidateId, {
        employee_id: newEmployeeId.trim(),
        designation: designation.trim() || undefined,
        join_date: joinDate,
      });
      setShowConvert(false);
      setJoinDate("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert to employee.");
    } finally {
      setBusy(false);
    }
  }

  const meta = candidate ? STAGE_META[candidate.stage] : null;

  return (
    <div className="detail-page">
      <button className="detail-page__back" onClick={() => navigate("/recruiting/pipeline")}>
        <IconArrowLeft size={14} /> Back to Pipeline
      </button>

      {isLoading && <p className="panel__loading">Loading candidate…</p>}
      {error && <p className="error-banner">{error}</p>}

      {candidate && meta && (
        <section className="panel detail__panel-all">
          <div className="detail__header" style={{ background: meta.gradient }}>
            <span className="detail__avatar">{initialsOf(candidate.name)}</span>
            <div className="detail__header-info">
              <h2>{candidate.name}</h2>
              <p>
                {candidate.applied_role}
                {candidate.source ? ` · sourced via ${candidate.source}` : ""}
              </p>
            </div>
            <span className="detail__stage-tag">{candidate.stage}</span>
          </div>

          <div className="detail__body">
            {candidate.resume_details && (
              <p className="detail__resume">{candidate.resume_details}</p>
            )}

            <div className="detail__stepper">
              {PIPELINE_STAGES.filter((s) => s !== "Rejected").map((stage, i, arr) => {
                const stageMeta = STAGE_META[stage];
                const currentIndex = PIPELINE_STAGES.indexOf(candidate.stage);
                const isDone = PIPELINE_STAGES.indexOf(stage) < currentIndex;
                const isActive = stage === candidate.stage;
                const needsInterviewLog =
                  (stage === "Offer" || stage === "Hired") &&
                  candidate.interview_stages.length === 0 &&
                  !isDone &&
                  !isActive;
                return (
                  <div key={stage} className="detail__step">
                    <button
                      className={`detail__step-dot ${isActive ? "detail__step-dot--active" : ""} ${
                        isDone ? "detail__step-dot--done" : ""
                      } ${needsInterviewLog ? "detail__step-dot--locked" : ""}`}
                      style={isActive || isDone ? { background: stageMeta.gradient } : undefined}
                      onClick={() => handleMoveStage(stage)}
                      disabled={busy || needsInterviewLog}
                      title={
                        needsInterviewLog
                          ? "Log at least one interview stage first"
                          : `Move to ${stage}`
                      }
                    >
                      {isDone ? <IconCheckCircle size={13} /> : i + 1}
                    </button>
                    <span className={isActive ? "detail__step-label--active" : "detail__step-label"}>
                      {stage}
                    </span>
                    {i < arr.length - 1 && <span className="detail__step-line" />}
                  </div>
                );
              })}
              {!candidate.converted_emp_id && (
                <button
                  className={`detail__reject-btn ${
                    candidate.stage === "Rejected" ? "detail__reject-btn--active" : ""
                  }`}
                  onClick={() => handleMoveStage("Rejected")}
                  disabled={busy}
                >
                  {candidate.stage === "Rejected" ? "Rejected" : "Reject"}
                </button>
              )}
            </div>

            {candidate.stage === "Hired" && (
              <div className="detail__convert-banner">
                {candidate.converted_emp_id ? (
                  <span className="detail__converted-tag">
                    <IconUserCheck size={15} /> Converted to employee{" "}
                    <b>{candidate.converted_emp_id}</b>
                  </span>
                ) : (
                  <>
                    <span>
                      <IconUserCheck size={15} /> This candidate is hired — create their employee
                      record.
                    </span>
                    <button
                      className="c-toolbar__btn c-toolbar__btn--teal"
                      onClick={() => setShowConvert((v) => !v)}
                    >
                      Convert to Employee
                    </button>
                  </>
                )}
              </div>
            )}

            {showConvert && (
              <form className="detail__convert-form" onSubmit={handleConvert}>
                <label className="field">
                  <span className="field__label">New employee ID</span>
                  <input
                    className="field__input"
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-2045"
                  />
                </label>
                <label className="field">
                  <span className="field__label">Designation (optional)</span>
                  <input
                    className="field__input"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder={candidate.applied_role}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Join date</span>
                  <input
                    className="field__input"
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    required
                  />
                </label>
                <div className="modal__actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setShowConvert(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button-primary" disabled={busy}>
                    Confirm hire
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="detail__divider" />

          <div className="detail__body">
            <div className="detail__timeline-head">
              <h3>
                <IconClock size={16} /> Interview Timeline
              </h3>
              {!candidate.converted_emp_id && (
                <button
                  className="c-toolbar__btn c-toolbar__btn--amber"
                  onClick={() => setShowStageForm((v) => !v)}
                >
                  <IconPlus size={14} /> Log Stage
                </button>
              )}
            </div>

            {showStageForm && (
              <form className="detail__stage-form" onSubmit={handleAddStage}>
                <div className="field-row">
                  <label className="field">
                    <span className="field__label">Stage name</span>
                    <input
                      className="field__input"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                      placeholder="e.g. Technical Round 1"
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Interviewer ID</span>
                    <input
                      className="field__input"
                      value={interviewerId}
                      onChange={(e) => setInterviewerId(e.target.value)}
                      placeholder="Optional employee ID"
                    />
                  </label>
                </div>
                <label className="field">
                  <span className="field__label">Notes</span>
                  <textarea
                    className="field__input field__textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
                <div className="modal__actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setShowStageForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button-primary" disabled={busy}>
                    Save stage
                  </button>
                </div>
              </form>
            )}

            <ol className="detail__timeline">
              {candidate.interview_stages.length === 0 && (
                <p className="panel__loading">No interview stages logged yet.</p>
              )}
              {candidate.interview_stages.map((stage) => (
                <li className="tl-item" key={stage.stage_id}>
                  <span className="tl-item__dot" />
                  <div className="tl-item__body">
                    <div className="tl-item__header">
                      <strong>{stage.stage_name}</strong>
                      <span className="tl-item__time">
                        {parseServerTimestamp(stage.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {stage.interviewer_id && (
                      <span className="tl-item__interviewer">Interviewer: {stage.interviewer_id}</span>
                    )}
                    {stage.notes && <p className="tl-item__notes">{stage.notes}</p>}

                    {stage.scorecards.map((sc) => (
                      <div className="tl-item__scorecard" key={sc.scorecard_id}>
                        <IconStar size={13} />
                        {sc.score !== null && sc.score !== undefined && (
                          <b>{sc.score}/10</b>
                        )}
                        {sc.questions && <span>{sc.questions}</span>}
                      </div>
                    ))}

                    {stage.scorecards.length === 0 &&
                      (scorecardOpenFor === stage.stage_id ? (
                        <div className="tl-item__sc-form">
                          <input
                            className="field__input"
                            type="number"
                            step="0.5"
                            min={0}
                            max={10}
                            placeholder="Score /10"
                            value={scoreValue}
                            onChange={(e) => setScoreValue(e.target.value)}
                          />
                          <input
                            className="field__input"
                            placeholder="Questions asked / summary"
                            value={questionsValue}
                            onChange={(e) => setQuestionsValue(e.target.value)}
                          />
                          <button
                            className="button-primary"
                            disabled={busy}
                            onClick={() => handleAddScorecard(stage.stage_id)}
                          >
                            Save
                          </button>
                          <button
                            className="button-secondary"
                            onClick={() => setScorecardOpenFor(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="tl-item__add-sc"
                          onClick={() => setScorecardOpenFor(stage.stage_id)}
                        >
                          <IconStar size={12} /> Add scorecard
                        </button>
                      ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}