import { useEffect, useMemo, useState } from "react";
import "./UnitCompletionPage.css";

import { trainingApi } from "./api";

import type {
  Enrollment,
  TrainingProgram,
  TrainingUnit,
  UnitCompletion,
} from "./types";
import { useAuth } from "../../shared/auth/AuthContext";
import { isTrainingAdmin, isTrainingCohortViewer } from "./roles";

export default function UnitCompletionPage() {
  const { employee } = useAuth();
  // Completion is always self-attested. Admin/Leadership defines and
  // oversees training rather than taking it, so they get an org-wide
  // read-only audit table only — no personal "Mark Complete" form.
  // Manager/HR-Restricted are still working employees who may have their
  // own assigned training, so they keep the self-service form *and* the
  // audit table (FR-LMS-05).
  const admin = isTrainingAdmin(employee?.access_tier);
  const cohortViewer = isTrainingCohortViewer(employee?.access_tier);
  const showSelfService = !admin;

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [units, setUnits] = useState<TrainingUnit[]>([]);
  const [allUnits, setAllUnits] = useState<TrainingUnit[]>([]);
  const [completions, setCompletions] = useState<UnitCompletion[]>([]);

  const [selectedEnrollment, setSelectedEnrollment] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [score, setScore] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ownEnrollments = useMemo(() => {
    return enrollments.filter(
      (enrollment) => enrollment.employee_id === employee?.employee_id
    );
  }, [enrollments, employee?.employee_id]);

  const ownCompletions = useMemo(() => {
    const ownEnrollmentIds = new Set(
      ownEnrollments.map((enrollment) => enrollment.enrollment_id)
    );
    return completions.filter((completion) =>
      ownEnrollmentIds.has(completion.enrollment_id)
    );
  }, [completions, ownEnrollments]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [
        enrollmentData,
        completionData,
        programData,
      ] = await Promise.all([
        trainingApi.listEnrollments(),
        trainingApi.listCompletions(),
        trainingApi.listPrograms(),
      ]);

      setEnrollments(enrollmentData);
      setCompletions(completionData);
      setPrograms(programData);

      // Load units for every program up front so unit names resolve
      // correctly in the org-wide audit table (and in "My Completed
      // Units") regardless of what's selected in the form above.
      const unitLists = await Promise.all(
        programData.map((program) =>
          trainingApi.listUnits(program.program_id)
        )
      );
      setAllUnits(unitLists.flat());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data."
      );
    }
  }

  async function handleEnrollmentChange(
    enrollmentId: string
  ) {
    setSelectedEnrollment(enrollmentId);
    setSelectedUnit("");

    if (!enrollmentId) {
      setUnits([]);
      return;
    }

    const enrollment = enrollments.find(
      (item) =>
        item.enrollment_id === Number(enrollmentId)
    );

    if (!enrollment) {
      return;
    }

    try {
      const unitData =
        await trainingApi.listUnits(
          enrollment.program_id
        );

      setUnits(unitData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load units."
      );
    }
  }

  async function handleCompleteUnit() {
    setError("");

    if (!selectedEnrollment) {
      setError("Please select an enrollment.");
      return;
    }

    if (!selectedUnit) {
      setError("Please select a training unit.");
      return;
    }

    if (
      score &&
      (Number(score) < 0 ||
        Number(score) > 100)
    ) {
      setError(
        "Score must be between 0 and 100."
      );
      return;
    }

    try {
      setLoading(true);

      await trainingApi.completeUnit({
        enrollment_id: Number(
          selectedEnrollment
        ),
        unit_id: Number(selectedUnit),
        score: score
          ? Number(score)
          : null,
      });

      const completionData =
        await trainingApi.listCompletions();

      setCompletions(completionData);

      setSelectedUnit("");
      setScore("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete unit."
      );
    } finally {
      setLoading(false);
    }
  }
    return (
    <div className="completion-page">
      <div className="completion-header">
        <h2>Unit Completion</h2>
        <p>
          {showSelfService
            ? "Mark your own training units as completed."
            : "Review training unit completions across the org."}
        </p>
      </div>

      {error && (
        <p className="form-error">{error}</p>
      )}

      {showSelfService && (
        <>
          <div className="completion-card">
            <div className="form-group">
              <label>Enrollment</label>

              <select
                value={selectedEnrollment}
                onChange={(e) =>
                  handleEnrollmentChange(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select Enrollment
                </option>

                {ownEnrollments.map((enrollment) => (
                  <option
                    key={enrollment.enrollment_id}
                    value={enrollment.enrollment_id}
                  >
                    {programs.find(
                      (program) =>
                        program.program_id ===
                        enrollment.program_id
                    )?.name ?? "Unknown Program"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Training Unit</label>

              <select
                value={selectedUnit}
                onChange={(e) =>
                  setSelectedUnit(e.target.value)
                }
                disabled={!selectedEnrollment}
              >
                <option value="">
                  Select Unit
                </option>

                {units.map((unit) => (
                  <option
                    key={unit.unit_id}
                    value={unit.unit_id}
                  >
                    {unit.sequence}. {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Score</label>

              <input
                type="number"
                min="0"
                max="100"
                placeholder="Optional"
                value={score}
                onChange={(e) =>
                  setScore(e.target.value)
                }
              />
            </div>

            <button
              className="complete-button"
              onClick={handleCompleteUnit}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Mark Complete"}
            </button>
          </div>

          <div className="completion-table-card">
            <h3>My Completed Units</h3>

            {ownCompletions.length === 0 ? (
              <p>No completed units found.</p>
            ) : (
              <table className="completion-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Score</th>
                    <th>Completed At</th>
                  </tr>
                </thead>

                <tbody>
                  {ownCompletions.map(
                    (completion) => {
                      const unit =
                        allUnits.find(
                          (item) =>
                            item.unit_id ===
                            completion.unit_id
                        );

                      return (
                        <tr
                          key={
                            completion.completion_id
                          }
                        >
                          <td>
                            {unit?.name ??
                              completion.unit_id}
                          </td>

                          <td>
                            {completion.score ??
                              "-"}
                          </td>

                          <td>
                            {new Date(
                              completion.completed_at
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {cohortViewer && (
        <div className="completion-table-card">
          <h3>All Completions (org-wide)</h3>
          <p className="completion-audit-note">
            Read-only. Manager/Admin-Leadership/HR-Restricted can see every
            employee's completions here for oversight. Completion is always
            self-attested — this view has no "Mark Complete" action.
          </p>

          {completions.length === 0 ? (
            <p>No completed units found.</p>
          ) : (
            <table className="completion-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Unit</th>
                  <th>Score</th>
                  <th>Completed At</th>
                </tr>
              </thead>

              <tbody>
                {completions.map((completion) => {
                  const enrollment = enrollments.find(
                    (item) =>
                      item.enrollment_id === completion.enrollment_id
                  );

                  const unit = allUnits.find(
                    (item) => item.unit_id === completion.unit_id
                  );

                  return (
                    <tr key={completion.completion_id}>
                      <td>
                        {enrollment?.employee_id ??
                          completion.enrollment_id}
                      </td>

                      <td>{unit?.name ?? completion.unit_id}</td>

                      <td>{completion.score ?? "-"}</td>

                      <td>
                        {new Date(
                          completion.completed_at
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}