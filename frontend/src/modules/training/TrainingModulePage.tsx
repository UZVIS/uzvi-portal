import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, Users } from "lucide-react";

import { useAuth } from "../../shared/auth/AuthContext";
import { Toast } from "../../shared/components/Toast";
import {
  listPrograms,
  listMyEnrollments,
  createProgram,
  createEnrollment,
  getCohortProgress,
  type TrainingProgram,
  type Enrollment,
  type CohortProgress,
} from "./api";
import { ProgramCard } from "./components/ProgramCard";
import { CreateProgramForm } from "./components/CreateProgramForm";
import { CohortTable } from "./components/CohortTable";
import "../shared-theme.css";
import "./TrainingModulePage.css";

// Only Admin/Leadership defines programs - matches FR-LMS-01 and the
// backend's require_admin dependency exactly.
const ADMIN_TIERS = new Set(["Admin/Leadership"]);
// Matches the backend's COHORT_VIEW_TIERS exactly (require_cohort_viewer).
const COHORT_VIEW_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);

type TrainingTab = "programs" | "cohort";

export default function TrainingModulePage() {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const employeeId = employee?.employee_id;
  const isAdmin = employee ? ADMIN_TIERS.has(employee.access_tier) : false;
  const isCohortViewer = employee ? COHORT_VIEW_TIERS.has(employee.access_tier) : false;

  // The page's main theme is creating and enrolling in programs, so that
  // stays the default view - Cohort progress is a separate, deliberate tab
  // rather than something stacked into the same scroll.
  const [activeTab, setActiveTab] = useState<TrainingTab>("programs");

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Map<number, Enrollment>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedCohortProgramId, setSelectedCohortProgramId] = useState<number | null>(null);
  const [cohort, setCohort] = useState<CohortProgress | null>(null);
  const [isCohortLoading, setIsCohortLoading] = useState(false);

  const loadAll = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [progs, enrollments] = await Promise.all([
        listPrograms(employeeId),
        listMyEnrollments(employeeId),
      ]);
      setPrograms(progs);
      setMyEnrollments(new Map(enrollments.map((e) => [e.program_id, e])));
      // Only fill in a default once - never clobber a selection the viewer
      // already made on a later reload (e.g. after creating a program).
      setSelectedCohortProgramId((prev) => prev ?? progs[0]?.program_id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load training programs.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Fetch cohort data on demand for just the one program in view - only
  // while the Cohort tab is actually open - rather than eagerly pulling
  // every program's cohort on every page load regardless of whether anyone
  // looks at it.
  useEffect(() => {
    if (activeTab !== "cohort" || !employeeId || !selectedCohortProgramId) {
      return;
    }
    let cancelled = false;
    setIsCohortLoading(true);
    getCohortProgress(selectedCohortProgramId, employeeId)
      .then((result) => {
        if (!cancelled) setCohort(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setCohort(null);
          setError(err instanceof Error ? err.message : "Could not load cohort progress.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsCohortLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, employeeId, selectedCohortProgramId]);

  async function handleCreateProgram(name: string) {
    if (!employee) return;
    try {
      await createProgram(name, employee.employee_id);
      setSuccess(`"${name}" was created.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the program.");
    }
  }

  async function handleEnroll(programId: number) {
    if (!employee) return;
    try {
      await createEnrollment(programId, employee.employee_id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll in this program.");
    }
  }

  return (
    <div className="directory-page uzvi-portal-theme">
      <header className="directory-page__header">
        <div>
          <h1>Training</h1>
          <p className="directory-page__subtitle">
            Structured learning programs - enroll, track your progress unit by unit, and see how your
            cohort is doing.
          </p>
        </div>
      </header>

      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      {success && <Toast message={success} kind="success" onDismiss={() => setSuccess(null)} />}

      {isCohortViewer && (
        <div className="training-tabs">
          <button
            type="button"
            className={`training-tabs__tab ${activeTab === "programs" ? "training-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab("programs")}
          >
            <GraduationCap size={15} />
            Programs
          </button>
          <button
            type="button"
            className={`training-tabs__tab ${activeTab === "cohort" ? "training-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab("cohort")}
          >
            <Users size={15} />
            Cohort progress
          </button>
        </div>
      )}

      {(!isCohortViewer || activeTab === "programs") && (
        <>
          {isAdmin && (
            <section className="directory-page__list">
              <h2 className="directory-form__title">
                <Plus size={16} className="training-icon-inline" />
                Create a program
              </h2>
              <CreateProgramForm onCreate={handleCreateProgram} />
            </section>
          )}

          <section className="directory-page__list">
            <div className="directory-page__list-header">
              <h2>
                <GraduationCap size={18} className="training-icon-inline" />
                Programs
              </h2>
            </div>

            {isLoading ? (
              <p className="directory-row__muted">Loading programs...</p>
            ) : programs.length === 0 ? (
              <p className="directory-row__muted">No training programs yet.</p>
            ) : (
              <div className="training-grid">
                {programs.map((program) => (
                  <ProgramCard
                    key={program.program_id}
                    program={program}
                    enrollment={myEnrollments.get(program.program_id)}
                    onEnroll={() => handleEnroll(program.program_id)}
                    onView={() => navigate(`/training/programs/${program.program_id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {isCohortViewer && activeTab === "cohort" && (
        <section className="directory-page__list">
          <div className="directory-page__list-header">
            <h2>
              <Users size={18} className="training-icon-inline" />
              Cohort progress
            </h2>
          </div>

          {isLoading ? (
            <p className="directory-row__muted">Loading...</p>
          ) : programs.length === 0 ? (
            <p className="directory-row__muted">No training programs yet.</p>
          ) : (
            <>
              <div className="field cohort-picker">
                <label className="field__label">Program</label>
                <select
                  className="field__input"
                  value={selectedCohortProgramId ?? ""}
                  onChange={(e) => setSelectedCohortProgramId(Number(e.target.value))}
                >
                  {programs.map((p) => (
                    <option key={p.program_id} value={p.program_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {isCohortLoading ? (
                <p className="directory-row__muted">Loading...</p>
              ) : cohort ? (
                <CohortTable cohort={cohort} />
              ) : (
                <p className="directory-row__muted">Could not load cohort progress for this program.</p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
