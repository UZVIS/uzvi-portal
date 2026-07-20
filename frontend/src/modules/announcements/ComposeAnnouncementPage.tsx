import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { createAnnouncement } from "./api";
import type { TargetType } from "./types";
import { IconArrowLeft, IconMegaphone, IconSend } from "./components/icons";
import "./ComposeAnnouncementPage.css";

export function ComposeAnnouncementPage() {
  const { employee } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("company_wide");
  const [targetValue, setTargetValue] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!employee) return null;

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
        posted_by: employee!.employee_id,
      });
      navigate("/announcements");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="compose-screen">
      <header className="compose-topbar">
        <button
          className="compose-topbar__back"
          onClick={() => navigate("/dashboard")}
        >
          <IconArrowLeft size={16} /> Back
        </button>
      </header>

      <div className="compose-page">
        <div className="compose-page__header">
          <span className="compose-page__icon">
            <IconMegaphone size={22} />
          </span>
          <div>
            <h1>New announcement</h1>
            <p>Post a notice to the company, a team, or a specific role.</p>
          </div>
        </div>

        <form className="compose-page__form" onSubmit={handleSubmit}>
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
              rows={6}
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

          <div className="compose-page__actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/announcements")}
            >
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              <IconSend size={14} /> {isSubmitting ? "Posting…" : "Post announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}