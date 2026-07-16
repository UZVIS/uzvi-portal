import {type FormEvent, useState } from "react";
import { createAnnouncement } from "../api";
import type {TargetType} from "../types";

interface Props {
  postedBy: string;
  onClose: () => void;
  onPosted: () => void;
}

export function ComposeAnnouncementModal({ postedBy, onClose, onPosted }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("company_wide");
  const [targetValue, setTargetValue] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setError("Title and body are both required.");
      return;
    }
    if (targetType !== "company_wide" && !targetValue.trim()) {
      setError(
        targetType === "team"
          ? "Enter the team ID this announcement is for."
          : "Enter the role this announcement is for."
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        target_type: targetType,
        target_value: targetType === "company_wide" ? undefined : targetValue.trim(),
        requires_ack: requiresAck,
        expiry_date: expiryDate || undefined,
        posted_by: postedBy,
      });
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>New announcement</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Title</span>
            <input
              className="field__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Diwali office closure"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Body</span>
            <textarea
              className="field__input field__textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Details for everyone reading this…"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Audience</span>
              <select
                className="field__input"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
              >
                <option value="company_wide">Company-wide</option>
                <option value="team">Specific team</option>
                <option value="role">Specific role</option>
              </select>
            </label>

            {targetType !== "company_wide" && (
              <label className="field">
                <span className="field__label">
                  {targetType === "team" ? "Team ID" : "Role"}
                </span>
                <input
                  className="field__input"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={targetType === "team" ? "T1" : "Manager"}
                />
              </label>
            )}
          </div>

          <div className="field-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
              />
              <span>Requires acknowledgment</span>
            </label>

            <label className="field">
              <span className="field__label">Expires (optional)</span>
              <input
                type="date"
                className="field__input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}

          <div className="modal__actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? "Posting…" : "Post announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}