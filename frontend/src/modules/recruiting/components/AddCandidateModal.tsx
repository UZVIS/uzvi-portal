import { useState } from "react";
import { genId, type CandidateInput } from "../api";
import { IconClose, IconSparkles } from "./icons";

interface Props {
  onClose: () => void;
  onCreate: (input: CandidateInput) => Promise<void>;
}

export function AddCandidateModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [appliedRole, setAppliedRole] = useState("");
  const [source, setSource] = useState("");
  const [resumeDetails, setResumeDetails] = useState("");
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
      await onCreate({
        candidate_id: genId("CAND"),
        name: name.trim(),
        applied_role: appliedRole.trim(),
        source: source.trim() || undefined,
        resume_details: resumeDetails.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't add this candidate.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>
            <span className="modal__title-icon">
              <IconSparkles size={18} />
            </span>
            New Candidate
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
            <span className="field__label">Resume summary</span>
            <textarea
              className="field__input field__textarea"
              rows={3}
              value={resumeDetails}
              onChange={(e) => setResumeDetails(e.target.value)}
              placeholder="Short summary used for interview prep and duplicate detection"
            />
          </label>

          <div className="modal__actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={status === "saving"}>
              {status === "saving" ? "Adding…" : "Add candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}