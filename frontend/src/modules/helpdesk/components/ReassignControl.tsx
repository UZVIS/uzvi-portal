import { useEffect, useState } from "react";
import { listActiveEmployees, type Employee } from "../../directory/api";

// Matches the backend's PRIVILEGED_TIERS - only these tiers can actually
// handle a ticket, so the picker is pre-filtered to avoid a guaranteed
// server-side rejection.
const PRIVILEGED_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);

interface ReassignControlProps {
  currentAssignee: string | null;
  viewerId?: string;
  onReassign: (employeeId: string) => void | Promise<void>;
}

export function ReassignControl({ currentAssignee, viewerId, onReassign }: ReassignControlProps) {
  const [candidates, setCandidates] = useState<Employee[]>([]);
  const [selected, setSelected] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listActiveEmployees()
      .then((all) => setCandidates(all.filter((e) => PRIVILEGED_TIERS.has(e.access_tier))))
      .catch(() => setCandidates([]));
  }, []);

  async function handleReassign() {
    if (!selected || selected === currentAssignee) return;
    setIsSubmitting(true);
    try {
      await onReassign(selected);
      setSelected("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="reassign-control-wrapper">
      {viewerId && viewerId !== currentAssignee && (
        <button
          type="button"
          className="button-secondary reassign-control__self"
          onClick={() => onReassign(viewerId)}
          disabled={isSubmitting}
        >
          Assign to me
        </button>
      )}
      <div className="reassign-control">
        <select className="field__input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Reassign to...</option>
          {candidates.map((c) => {
            const labels: string[] = [];
            if (c.employee_id === viewerId) labels.push("you");
            if (c.employee_id === currentAssignee) labels.push("current");
            const suffix = labels.length ? ` - ${labels.join(", ")}` : "";
            return (
              <option key={c.employee_id} value={c.employee_id}>
                {c.name} ({c.access_tier}){suffix}
              </option>
            );
          })}
        </select>
        <button
          type="button"
          className="button-secondary"
          onClick={handleReassign}
          disabled={!selected || selected === currentAssignee || isSubmitting}
        >
          Reassign
        </button>
      </div>
    </div>
  );
}
