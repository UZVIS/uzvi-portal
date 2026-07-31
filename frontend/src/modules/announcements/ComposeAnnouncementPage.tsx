import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { createAnnouncement } from "./api";
import type { TargetType } from "./types";
import { IconSend } from "./components/icons";
import "./ComposeAnnouncementPage.css";

interface ComposeAnnouncementPageProps {
  onPosted?: () => void;
}

export function ComposeAnnouncementPage({ onPosted }: ComposeAnnouncementPageProps = {}) {
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
      if (onPosted) {
        onPosted();
      } else {
        navigate("/announcements");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="compose-page">
      <div className="compose-card">
        <div className="compose-header">
          <h2>New Announcement</h2>
          <p>Post a notice to the company, a team, or a specific role.</p>
        </div>

        <form className="compose-form" onSubmit={handleSubmit}>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Diwali office closure"
                autoFocus
              />
            </div>

            <div className="form-group full-width">
              <label>Body</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Details for everyone reading this…"
              />
            </div>

            <div className="form-group">
              <label>Audience</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
              >
                <option value="company_wide">Company-wide</option>
                <option value="team">Specific team</option>
                <option value="role">Specific role</option>
              </select>
            </div>

            {targetType !== "company_wide" && (
              <div className="form-group">
                <label>{targetType === "team" ? "Team ID" : "Role"}</label>
                <input
                  type="text"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={targetType === "team" ? "T1" : "Manager"}
                />
              </div>
            )}

            <div className="form-group">
              <label>Expires (optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={requiresAck}
                  onChange={(e) => setRequiresAck(e.target.checked)}
                />
                <span>Requires acknowledgment</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => (onPosted ? onPosted() : navigate("/announcements"))}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              <IconSend size={14} /> {isSubmitting ? "Posting…" : "Post announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}