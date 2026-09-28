import { useState, type FormEvent } from "react";
import type { TicketComment } from "../api";

// System-generated activity entries always follow this exact phrasing from
// the backend ("Status changed...", "Reassigned from...") - used here only
// to distinguish them visually from real human replies, not to parse them.
function isSystemEntry(comment: string): boolean {
  return comment.startsWith("Status changed from") || comment.startsWith("Reassigned from");
}

interface CommentThreadProps {
  comments: TicketComment[];
  canComment: boolean;
  onAddComment: (comment: string) => void | Promise<void>;
}

export function CommentThread({ comments, canComment, onAddComment }: CommentThreadProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onAddComment(trimmed);
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="comment-thread">
      {sorted.length === 0 ? (
        <p className="directory-row__muted">No activity yet.</p>
      ) : (
        <ul className="comment-thread__list">
          {sorted.map((c) =>
            isSystemEntry(c.comment) ? (
              <li key={c.comment_id} className="comment-thread__system">
                {c.comment}
              </li>
            ) : (
              <li key={c.comment_id} className="comment-thread__item">
                <div className="comment-thread__item-header">
                  <span className="comment-thread__author">{c.author_id}</span>
                  <span className="comment-thread__time">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="comment-thread__text">{c.comment}</p>
              </li>
            )
          )}
        </ul>
      )}

      {canComment && (
        <form className="comment-thread__form" onSubmit={handleSubmit}>
          <textarea
            className="field__input field__textarea"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            required
          />
          <button type="submit" className="button-primary" disabled={isSubmitting || !text.trim()}>
            Comment
          </button>
        </form>
      )}
    </div>
  );
}
