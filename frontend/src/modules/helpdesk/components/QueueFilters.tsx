import type { TicketCategory, TicketPriority, TicketStatus } from "../api";

const CATEGORIES: TicketCategory[] = ["HR", "IT", "Facilities", "Other"];
const PRIORITIES: TicketPriority[] = ["High", "Medium", "Low"];
const STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

interface QueueFiltersProps {
  category: TicketCategory | "";
  priority: TicketPriority | "";
  status: TicketStatus | "";
  minAgeHours: string;
  onCategoryChange: (v: TicketCategory | "") => void;
  onPriorityChange: (v: TicketPriority | "") => void;
  onStatusChange: (v: TicketStatus | "") => void;
  onMinAgeHoursChange: (v: string) => void;
  onClear: () => void;
}

export function QueueFilters({
  category,
  priority,
  status,
  minAgeHours,
  onCategoryChange,
  onPriorityChange,
  onStatusChange,
  onMinAgeHoursChange,
  onClear,
}: QueueFiltersProps) {
  const hasActiveFilters = !!(category || priority || status || minAgeHours);
  return (
    <div className="queue-filters">
      <select
        className="field__input"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as TicketCategory | "")}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className="field__input"
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TicketPriority | "")}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        className="field__input"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TicketStatus | "")}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        className="field__input queue-filters__age"
        type="number"
        min={0}
        placeholder="Min age (hours)"
        value={minAgeHours}
        onChange={(e) => onMinAgeHoursChange(e.target.value)}
      />
      <button
        type="button"
        className="button-secondary queue-filters__clear"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        Clear filters
      </button>
    </div>
  );
}
