import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trainingApi } from "./api";
import type { Enrollment, TrainingUnit, UnitCompletion } from "./types";
import "./ProgramDetailsPage.css";
import { useAuth } from "../../shared/auth/AuthContext";
import { isTrainingAdmin } from "./roles";

export default function ProgramDetailsPage() {
  const navigate = useNavigate();
  const { programId } = useParams();
  const { employee } = useAuth();
  // FR-LMS-01: only Admin/Leadership may add units to a program.
  const admin = isTrainingAdmin(employee?.access_tier);
  const [units, setUnits] = useState<TrainingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [sequence, setSequence] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Unit completion is self-tracked here: opening a unit marks it complete
  // automatically, with a manual "Mark Complete" button next to each unit
  // as a fallback in case the automatic marking doesn't fire (e.g. a slow
  // network request). The button also doubles as an undo action, in case
  // a unit gets marked complete by accident.
  const [ownEnrollment, setOwnEnrollment] = useState<Enrollment | null>(null);
  const [completedUnits, setCompletedUnits] = useState<Map<number, number>>(new Map());
  const [completingUnitId, setCompletingUnitId] = useState<number | null>(null);
  const [completionError, setCompletionError] = useState("");

  async function loadUnits() {
    if (!programId) {
      return;
    }

    try {
      setLoading(true);

      const data = await trainingApi.listUnits(
        Number(programId)
      );

      setUnits(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load training units."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUnit() {
    if (!unitName.trim()) {
      setCreateError("Unit name is required.");
      return;
    }

    if (unitName.trim().length < 2) {
      setCreateError(
        "Unit name must be at least 2 characters."
      );
      return;
    }

    if (!sequence.trim()) {
      setCreateError("Sequence is required.");
      return;
    }

    const sequenceNumber = Number(sequence);

    if (
      Number.isNaN(sequenceNumber) ||
      sequenceNumber <= 0
    ) {
      setCreateError(
        "Sequence must be greater than 0."
      );
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      await trainingApi.createUnit(
        Number(programId),
        {
          name: unitName.trim(),
          sequence: sequenceNumber,
        }
      );

      setUnitName("");
      setSequence("");
      setShowCreateForm(false);

      await loadUnits();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create training unit."
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadUnits();
  }, [programId]);

  useEffect(() => {
    loadOwnCompletionState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, employee?.employee_id]);

  async function loadOwnCompletionState() {
    if (!programId || !employee?.employee_id || admin) {
      // Admin/Leadership defines training rather than taking it, so they
      // never have an enrollment or completions to track here.
      return;
    }

    try {
      const [enrollments, completions] = await Promise.all([
        trainingApi.listEnrollments(),
        trainingApi.listCompletions(),
      ]);

      const enrollment = enrollments.find(
        (item: Enrollment) =>
          item.program_id === Number(programId) &&
          item.employee_id === employee.employee_id
      );

      setOwnEnrollment(enrollment ?? null);

      if (enrollment) {
        const completedMap = new Map(
          completions
            .filter(
              (completion: UnitCompletion) =>
                completion.enrollment_id === enrollment.enrollment_id
            )
            .map((completion: UnitCompletion) => [
              completion.unit_id,
              completion.completion_id,
            ])
        );
        setCompletedUnits(completedMap);
      } else {
        setCompletedUnits(new Map());
      }
    } catch {
      // Non-fatal: the units list still renders even if completion status
      // can't be loaded right now.
    }
  }

  async function markUnitComplete(unit: TrainingUnit) {
    if (!ownEnrollment || completedUnits.has(unit.unit_id)) {
      return;
    }

    setCompletionError("");
    setCompletingUnitId(unit.unit_id);

    try {
      const completion = await trainingApi.completeUnit({
        enrollment_id: ownEnrollment.enrollment_id,
        unit_id: unit.unit_id,
      });

      setCompletedUnits((prev) => {
        const next = new Map(prev);
        next.set(unit.unit_id, completion.completion_id);
        return next;
      });
    } catch (err) {
      setCompletionError(
        err instanceof Error
          ? err.message
          : "Failed to mark unit complete."
      );
    } finally {
      setCompletingUnitId(null);
    }
  }

  // Fallback for an accidental completion — undoes it so the unit goes
  // back to "not completed".
  async function markUnitIncomplete(unit: TrainingUnit) {
    const completionId = completedUnits.get(unit.unit_id);

    if (!completionId) {
      return;
    }

    setCompletionError("");
    setCompletingUnitId(unit.unit_id);

    try {
      await trainingApi.deleteCompletion(completionId);

      setCompletedUnits((prev) => {
        const next = new Map(prev);
        next.delete(unit.unit_id);
        return next;
      });
    } catch (err) {
      setCompletionError(
        err instanceof Error
          ? err.message
          : "Failed to mark unit incomplete."
      );
    } finally {
      setCompletingUnitId(null);
    }
  }

  // Opening a unit that isn't completed yet is treated as completing the
  // lesson, so it's marked complete automatically. Once completed,
  // re-opening it does nothing on its own — undoing has to be a deliberate
  // click on the "Mark as Incomplete" button, not an accidental re-click
  // on the row.
  function handleOpenUnit(unit: TrainingUnit) {
    if (!completedUnits.has(unit.unit_id)) {
      markUnitComplete(unit);
    }
  }

  const sortedUnits = useMemo(() => {
    return [...units].sort(
      (a, b) => a.sequence - b.sequence
    );
  }, [units]);

  if (loading) {
    return (
      <div className="training-loading">
        Loading training units...
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-error">
        {error}
      </div>
    );
  }

  return (
    <div className="program-details-page">

      <button
        className="back-button"
        onClick={() => navigate("/training")}
      >
        ← Back
      </button>

      <h2>
        Program #{programId}
      </h2>

      <div className="training-card">

        <div className="training-card-header">
          <h3>Training Units</h3>
          {admin && (
            <button
              className="create-program-button"
              onClick={() =>
                setShowCreateForm(!showCreateForm)
              }
            >
              {showCreateForm
                ? "Cancel"
                : "+ Add Unit"}
            </button>
          )}
        </div>
        {admin && showCreateForm && (
          <div className="create-program-form">

            <input
              type="text"
              placeholder="Unit name"
              value={unitName}
              onChange={(e) => {
                setUnitName(e.target.value);

                if (createError) {
                  setCreateError("");
                }
              }}
            />

            <input
              type="number"
              placeholder="Sequence"
              value={sequence}
              onChange={(e) => {
                setSequence(e.target.value);

                if (createError) {
                  setCreateError("");
                }
              }}
            />

            {createError && (
              <p className="form-error">
                {createError}
              </p>
            )}

            <button
              onClick={handleCreateUnit}
              disabled={creating}
            >
              {creating
                ? "Saving..."
                : "Save"}
            </button>

          </div>
        )}

        <div className="units-table-header">
          <span>Order</span>
          <span>Title</span>
          {!admin && <span>Status</span>}
        </div>

        {completionError && (
          <p className="form-error">{completionError}</p>
        )}

        {sortedUnits.length === 0 ? (
          <div className="empty-state">
            <h4>No units found</h4>
            <p>
              This program doesn't have any
              training units yet.
            </p>
          </div>
        ) : (
          sortedUnits.map((unit) => {
            const isCompleted = completedUnits.has(unit.unit_id);
            const isCompleting = completingUnitId === unit.unit_id;

            return (
              <div
                key={unit.unit_id}
                className={
                  "units-table-row" +
                  (!admin && ownEnrollment ? " units-table-row-clickable" : "")
                }
                onClick={
                  !admin && ownEnrollment
                    ? () => handleOpenUnit(unit)
                    : undefined
                }
              >
                <div>{unit.sequence}</div>

                <div>{unit.name}</div>

                {!admin && (
                  <div
                    className="unit-status-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!ownEnrollment ? (
                      <span className="unit-status-muted">
                        Enroll to track
                      </span>
                    ) : (
                      <button
                        className={
                          "mark-complete-inline-button" +
                          (isCompleted ? " completed" : "")
                        }
                        onClick={() =>
                          isCompleted
                            ? markUnitIncomplete(unit)
                            : markUnitComplete(unit)
                        }
                        disabled={isCompleting}
                      >
                        {isCompleting
                          ? "Saving..."
                          : isCompleted
                          ? "✓ Mark as Incomplete"
                          : "Mark Complete"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

      </div>

    </div>
  );
}