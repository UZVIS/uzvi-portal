import { useState } from "react";
import { Check, Pencil, Trash2, Undo2 } from "lucide-react";
import type { Enrollment, TrainingUnit } from "../api";

interface UnitListProps {
  units: TrainingUnit[];
  enrollment: Enrollment | null;
  isAdmin: boolean;
  onDeleteUnit: (unitId: number) => void;
  onCompleteUnit: (unitId: number, score?: number) => void;
  onUndoCompletion: (completionId: number) => void;
  onUpdateUnit: (unitId: number, name: string, sequence: number) => void | Promise<void>;
}

export function UnitList({
  units,
  enrollment,
  isAdmin,
  onDeleteUnit,
  onCompleteUnit,
  onUndoCompletion,
  onUpdateUnit,
}: UnitListProps) {
  const sorted = [...units].sort((a, b) => a.sequence - b.sequence);

  if (sorted.length === 0) {
    return <p className="directory-row__muted">No units yet.</p>;
  }

  return (
    <ul className="unit-list">
      {sorted.map((unit) => {
        const completion = enrollment?.completions.find((c) => c.unit_id === unit.unit_id);
        return (
          <UnitRow
            key={unit.unit_id}
            unit={unit}
            completion={completion}
            canComplete={!!enrollment}
            isAdmin={isAdmin}
            onDelete={() => onDeleteUnit(unit.unit_id)}
            onComplete={(score) => onCompleteUnit(unit.unit_id, score)}
            onUndo={() => completion && onUndoCompletion(completion.completion_id)}
            onUpdate={(name, sequence) => onUpdateUnit(unit.unit_id, name, sequence)}
          />
        );
      })}
    </ul>
  );
}

function UnitRow({
  unit,
  completion,
  canComplete,
  isAdmin,
  onDelete,
  onComplete,
  onUndo,
  onUpdate,
}: {
  unit: TrainingUnit;
  completion?: { completion_id: number; score: number | null };
  canComplete: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onComplete: (score?: number) => void;
  onUndo: () => void;
  onUpdate: (name: string, sequence: number) => void | Promise<void>;
}) {
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [score, setScore] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(unit.name);
  const [editSequence, setEditSequence] = useState(String(unit.sequence));
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function handleCompleteClick() {
    const trimmed = score.trim();
    const parsed = trimmed ? Number(trimmed) : undefined;
    const validScore = parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
    onComplete(validScore);
    setShowScoreInput(false);
    setScore("");
  }

  function startEdit() {
    setEditName(unit.name);
    setEditSequence(String(unit.sequence));
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    const trimmedName = editName.trim();
    const seqNum = Number(editSequence);
    if (!trimmedName || !Number.isFinite(seqNum)) return;
    setIsSavingEdit(true);
    try {
      await onUpdate(trimmedName, seqNum);
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  }

  if (isEditing) {
    return (
      <li className="unit-row unit-row--editing">
        <div className="unit-row__edit-form">
          <input
            className="field__input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Unit name"
            required
          />
          <input
            className="field__input unit-row__edit-sequence"
            type="number"
            value={editSequence}
            onChange={(e) => setEditSequence(e.target.value)}
            placeholder="Order"
            required
          />
          <button type="button" className="button-primary" onClick={handleSaveEdit} disabled={isSavingEdit}>
            Save
          </button>
          <button type="button" className="button-secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="unit-row">
      <div className="unit-row__main">
        <span className="unit-row__sequence">{unit.sequence}</span>
        <span className="unit-row__name">{unit.name}</span>
      </div>

      <div className="unit-row__actions">
        {completion ? (
          <>
            <span className="unit-row__done">
              <Check size={14} /> Completed
              {completion.score !== null && completion.score !== undefined && (
                <span className="unit-row__score">Score: {completion.score}</span>
              )}
            </span>
            <button type="button" className="unit-row__undo" onClick={onUndo}>
              <Undo2 size={13} /> Undo
            </button>
          </>
        ) : canComplete ? (
          showScoreInput ? (
            <div className="unit-row__score-input">
              <input
                className="field__input"
                type="number"
                min={0}
                max={100}
                placeholder="Score (optional)"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
              <button type="button" className="button-primary" onClick={handleCompleteClick}>
                Save
              </button>
              <button type="button" className="button-secondary" onClick={() => setShowScoreInput(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="button-secondary" onClick={() => setShowScoreInput(true)}>
              Mark complete
            </button>
          )
        ) : null}

        {isAdmin && (
          <>
            <button type="button" className="unit-row__edit" onClick={startEdit} title="Edit unit">
              <Pencil size={14} />
            </button>
            <button type="button" className="unit-row__delete" onClick={onDelete} title="Delete unit">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
