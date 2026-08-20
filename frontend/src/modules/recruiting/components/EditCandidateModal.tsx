import { useState } from "react";
import { PIPELINE_STAGES } from "../api";
import type { Candidate, CandidateStage, CandidateUpdateInput } from "../api";
import { IconClose, IconEdit } from "./icons";

interface Props {
  candidate: Candidate;
  onClose: () => void;
  onSave: (candidateId: string, input: CandidateUpdateInput) => Promise<void>;
}

export function EditCandidateModal({ candidate, onClose, onSave }: Props) {
  const [name, setName] = useState(candidate.name);
  const [appliedRole, setAppliedRole] = useState(candidate.applied_role);
  const [source, setSource] = useState(candidate.source ?? "");
  const [resumeDetails, setResumeDetails] = useState(candidate.resume_details ?? "");
  const [aadharNumber, setAadharNumber] = useState(candidate.aadhar_number ?? "");
  const [stage, setStage] = useState<CandidateStage>(candidate.stage);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !appliedRole.trim()) {
      setStatus("error");
      setErrorMsg("Name and applied role are required.");
      return;
    }
    setStatus("saving");
    try {
      await onSave(candidate.candidate_id, {
        name: name.trim(),
        applied_role: appliedRole.trim(),
        source: source.trim(),
        resume_details: resumeDetails.trim(),
        aadhar_number: aadharNumber.trim(),
        stage,
      });
      onClose();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't update this candidate.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>
            <span className="modal__title-icon">
              <IconEdit size={18} />
            </span>
            Edit Candidate
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        {status === "error" && <p className="error-banner">{errorMsg}</p>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Full name</span>
            <input
              className="field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Nair"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Applied role</span>
            <input
              className="field__input"
              value={appliedRole}
              onChange={(e) => setAppliedRole(e.target.value)}
              placeholder="e.g. Senior Consultant"
            />
          </label>

          <label className="field">
            <span className="field__label">Source</span>
            <input
              className="field__input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Referral, LinkedIn, Careers Page"
            />
          </label>

          <label className="field">
            <span className="field__label">Stage</span>
            <select
              className="field__input"
              value={stage}
              onChange={(e) => setStage(e.target.value as CandidateStage)}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Resume summary</span>
            <textarea
              className="field__input field__textarea"
              rows={3}
              value={resumeDetails}
              onChange={(e) => setResumeDetails(e.target.value)}
              placeholder="Short summary used for interview prep"
            />
          </label>

          <label className="field">
            <span className="field__label">Aadhar number</span>
            <input
              className="field__input"
              value={aadharNumber}
              onChange={(e) => setAadharNumber(e.target.value)}
              placeholder="e.g. 1234 5678 9012 (used for duplicate detection)"
              inputMode="numeric"
            />
          </label>

          <div className="modal__actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}