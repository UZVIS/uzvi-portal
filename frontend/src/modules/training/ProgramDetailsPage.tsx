import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";

import { useAuth } from "../../shared/auth/AuthContext";
import { Toast } from "../../shared/components/Toast";
import {
  getProgram,
  listMyEnrollments,
  createEnrollment,
  createUnit,
  deleteUnit,
  updateUnit,
  deleteProgram,
  completeUnit,
  deleteCompletion,
  formatProgramId,
  type TrainingProgram,
  type Enrollment,
} from "./api";
import { UnitList } from "./components/UnitList";
import "../shared-theme.css";
import "./ProgramDetailsPage.css";

const ADMIN_TIERS = new Set(["Admin/Leadership"]);

export default function ProgramDetailsPage() {
  const { programId } = useParams<{ programId: string }>();
  const { employee } = useAuth();
  const navigate = useNavigate();
  const programIdNum = Number(programId);
  const employeeId = employee?.employee_id;

  const isAdmin = employee ? ADMIN_TIERS.has(employee.access_tier) : false;

  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [myEnrollment, setMyEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!employeeId || !Number.isFinite(programIdNum)) return;
    setIsLoading(true);
    setError(null);
    try {
      const [prog, enrollments] = await Promise.all([
        getProgram(programIdNum, employeeId),
        listMyEnrollments(employeeId),
      ]);
      setProgram(prog);
      setMyEnrollment(enrollments.find((e) => e.program_id === programIdNum) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this program.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, programIdNum]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleEnroll() {
    if (!employee) return;
    try {
      await createEnrollment(programIdNum, employee.employee_id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll in this program.");
    }
  }

  async function handleAddUnit(name: string, sequence: number) {
    if (!employee) return;
    try {
      await createUnit(programIdNum, name, sequence, employee.employee_id);
      setSuccess(`Unit "${name}" was added.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the unit.");
    }
  }

  async function handleDeleteUnit(unitId: number) {
    if (!employee) return;
    if (!window.confirm("Delete this unit? This can't be undone.")) return;
    try {
      await deleteUnit(unitId, employee.employee_id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the unit.");
    }
  }

  async function handleUpdateUnit(unitId: number, name: string, sequence: number) {
    if (!employee) return;
    try {
      await updateUnit(unitId, { name, sequence }, employee.employee_id);
      setSuccess("Unit updated.");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the unit.");
    }
  }

  async function handleCompleteUnit(unitId: number, score?: number) {
    if (!employee || !myEnrollment) return;
    try {
      await completeUnit(myEnrollment.enrollment_id, unitId, employee.employee_id, score);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark that unit complete.");
    }
  }

  async function handleUndoCompletion(completionId: number) {
    if (!employee) return;
    try {
      await deleteCompletion(completionId, employee.employee_id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not undo that completion.");
    }
  }

  async function handleDeleteProgram() {
    if (!employee || !program) return;
    if (!window.confirm(`Delete "${program.name}"? This can't be undone.`)) return;
    try {
      await deleteProgram(programIdNum, employee.employee_id);
      navigate("/training");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this program.");
    }
  }

  if (isLoading) {
    return (
      <div className="directory-page uzvi-portal-theme">
        <p className="directory-row__muted">Loading...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="directory-page uzvi-portal-theme">
        {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
        <p className="directory-row__muted">That training program wasn't found.</p>
      </div>
    );
  }

  return (
    <div className="directory-page uzvi-portal-theme">
      <button type="button" className="button-secondary back-button" onClick={() => navigate("/training")}>
        <ArrowLeft size={14} /> Back to Training
      </button>

      <header className="directory-page__header">
        <div>
          <h1>{program.name}</h1>
          <p className="directory-row__id">{formatProgramId(program.program_id)}</p>
          <p className="directory-page__subtitle">
            {program.units.length} unit{program.units.length === 1 ? "" : "s"}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            className="button-secondary program-details__delete"
            onClick={handleDeleteProgram}
          >
            <Trash2 size={14} /> Delete program
          </button>
        )}
      </header>

      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      {success && <Toast message={success} kind="success" onDismiss={() => setSuccess(null)} />}

      {myEnrollment ? (
        <section className="directory-page__list">
          <h2 className="directory-form__title">Your progress</h2>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${myEnrollment.completion_pct}%` }} />
            <span className="progress-bar__label">
              {myEnrollment.completed_units} / {myEnrollment.total_units} (
              {Math.round(myEnrollment.completion_pct)}%)
            </span>
          </div>
        </section>
      ) : (
        <section className="directory-page__list">
          <div className="enroll-prompt">
            <p className="directory-row__muted">You're not enrolled in this program yet.</p>
            <button type="button" className="button-primary" onClick={handleEnroll}>
              Enroll
            </button>
          </div>
        </section>
      )}

      <section className="directory-page__list">
        <div className="directory-page__list-header">
          <h2>Units</h2>
        </div>

        {isAdmin && (
          <AddUnitForm
            onAdd={handleAddUnit}
            nextSequence={
              program.units.length > 0 ? Math.max(...program.units.map((u) => u.sequence)) + 1 : 1
            }
          />
        )}

        <UnitList
          units={program.units}
          enrollment={myEnrollment}
          isAdmin={isAdmin}
          onDeleteUnit={handleDeleteUnit}
          onCompleteUnit={handleCompleteUnit}
          onUndoCompletion={handleUndoCompletion}
          onUpdateUnit={handleUpdateUnit}
        />
      </section>
    </div>
  );
}

function AddUnitForm({
  onAdd,
  nextSequence,
}: {
  onAdd: (name: string, sequence: number) => void | Promise<void>;
  nextSequence: number;
}) {
  const [name, setName] = useState("");
  const [sequence, setSequence] = useState(String(nextSequence));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep the suggested order in sync as units are added - the admin can
  // still type over it, this is just a sensible starting point.
  useEffect(() => {
    setSequence(String(nextSequence));
  }, [nextSequence]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const seqNum = Number(sequence);
    if (!trimmedName || !Number.isFinite(seqNum)) return;
    setIsSubmitting(true);
    try {
      await onAdd(trimmedName, seqNum);
      setName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="template-builder__row" onSubmit={handleSubmit}>
      <input
        className="field__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Unit name"
        required
      />
      <input
        className="field__input unit-form__sequence"
        type="number"
        value={sequence}
        onChange={(e) => setSequence(e.target.value)}
        placeholder="Order (1, 2, 3...)"
        required
      />
      <button type="submit" className="button-primary" disabled={isSubmitting}>
        Add unit
      </button>
    </form>
  );
}
