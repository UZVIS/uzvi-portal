import { useState } from "react";
import type { Candidate } from "../api";
import { IconClose, IconTrash } from "./icons";

interface Props {
  candidate: Candidate;
  onClose: () => void;
  onConfirm: (candidateId: string) => Promise<void>;
}

export function DeleteCandidateModal({ candidate, onClose, onConfirm }: Props) {
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDelete() {
    setStatus("deleting");
    try {
      await onConfirm(candidate.candidate_id);
      onClose();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't delete this candidate.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>
            <span className="modal__title-icon modal__title-icon--danger">
              <IconTrash size={18} />
            </span>
            Remove Candidate
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        {status === "error" && <p className="error-banner">{errorMsg}</p>}

        <p className="modal__confirm-text">
          Remove <strong>{candidate.name}</strong> ({candidate.applied_role}) from the pipeline?
          This can't be undone.
        </p>

        <div className="modal__actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={handleDelete}
            disabled={status === "deleting"}
          >
            {status === "deleting" ? "Removing…" : "Remove candidate"}
          </button>
        </div>
      </div>
    </div>
  );
}