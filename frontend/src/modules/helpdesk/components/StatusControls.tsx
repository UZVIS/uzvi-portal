import type { TicketStatus } from "../api";

// Mirrors ALLOWED_TRANSITIONS in the backend exactly - buttons only ever
// show a legal next move, so nobody can even attempt an illegal one.
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Open: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: ["In Progress", "Closed"],
  Closed: [],
};

interface StatusControlsProps {
  status: TicketStatus;
  onChange: (status: TicketStatus) => void;
}

export function StatusControls({ status, onChange }: StatusControlsProps) {
  const nextOptions = ALLOWED_TRANSITIONS[status];

  if (nextOptions.length === 0) {
    return <p className="directory-row__muted">This ticket is closed - no further changes are possible.</p>;
  }

  return (
    <div className="status-controls">
      {nextOptions.map((next) => (
        <button key={next} type="button" className="button-secondary" onClick={() => onChange(next)}>
          {status === "Resolved" && next === "In Progress" ? "Reopen" : `Move to ${next}`}
        </button>
      ))}
    </div>
  );
}
