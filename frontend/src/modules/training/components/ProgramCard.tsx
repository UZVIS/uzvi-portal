import { ChevronRight } from "lucide-react";
import type { Enrollment, TrainingProgram } from "../api";
import { formatProgramId } from "../api";

interface ProgramCardProps {
  program: TrainingProgram;
  enrollment?: Enrollment;
  onEnroll: () => void;
  onView: () => void;
}

export function ProgramCard({ program, enrollment, onEnroll, onView }: ProgramCardProps) {
  const unitCount = program.units.length;

  return (
    <div className="program-card">
      <div className="program-card__header">
        <div className="program-card__title-group">
          <h3 className="program-card__name">{program.name}</h3>
          <p className="directory-row__id program-card__id">{formatProgramId(program.program_id)}</p>
        </div>
        <button
          type="button"
          className="program-card__view-icon"
          onClick={onView}
          title="View details"
          aria-label="View program details"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="program-card__meta">
        {unitCount} unit{unitCount === 1 ? "" : "s"}
      </p>

      {enrollment ? (
        <div className="program-card__progress">
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${enrollment.completion_pct}%` }} />
            <span className="progress-bar__label">{Math.round(enrollment.completion_pct)}%</span>
          </div>
        </div>
      ) : (
        <button type="button" className="button-primary program-card__enroll" onClick={onEnroll}>
          Enroll
        </button>
      )}
    </div>
  );
}
