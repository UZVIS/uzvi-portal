import { useEffect, useMemo, useState } from "react";
import { trainingApi } from "./api";
import type {
  Enrollment,
  TrainingProgram,
} from "./types";
import "./EnrollmentPage.css";
import { useAuth } from "../../shared/auth/AuthContext";
import { isTrainingCohortViewer } from "./roles";

export default function EnrollmentPage() {
  const { employee } = useAuth();
  // Manager/Admin-Leadership/HR-Restricted can see and enroll anyone
  // (FR-LMS-05); a plain Employee only sees and manages their own enrollments.
  const cohortViewer = isTrainingCohortViewer(employee?.access_tier);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] =useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [
        enrollmentData,
        programData,
      ] = await Promise.all([
        trainingApi.listEnrollments(),
        trainingApi.listPrograms(),
      ]);

      setEnrollments(enrollmentData);
      setPrograms(programData);

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load enrollments."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEnrollment() {
    const targetEmployeeId = cohortViewer
      ? employeeId.trim()
      : employee?.employee_id ?? "";

    if (!targetEmployeeId) {
      setCreateError("Employee ID is required.");
      return;
    }

    if (!selectedProgram) {
      setCreateError("Please select a training program.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      await trainingApi.createEnrollment({
        employee_id: targetEmployeeId,
        program_id: Number(selectedProgram),
      });

      setEmployeeId("");
      setSelectedProgram("");
      setShowCreateForm(false);

      await loadData();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create enrollment."
      );
    } finally {
      setCreating(false);
    }
  }
  useEffect(() => {
    loadData();
  }, []);

  const visibleEnrollments = useMemo(() => {
    if (cohortViewer) {
      return enrollments;
    }
    return enrollments.filter(
      (enrollment) => enrollment.employee_id === employee?.employee_id
    );
  }, [enrollments, cohortViewer, employee?.employee_id]);

  if (loading) {
    return (
      <div className="training-loading">
        Loading enrollments...
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
    <div className="enrollment-page">

      <h2>Enrollments</h2>

      <div className="training-card">

        <div className="training-card-header">
          <h3>
            {cohortViewer
              ? `Total Enrollments: ${visibleEnrollments.length}`
              : `My Enrollments: ${visibleEnrollments.length}`}
          </h3>
          <button
            className="create-program-button"
            onClick={() =>
              setShowCreateForm(!showCreateForm)
            }
          >
            {showCreateForm
              ? "Cancel"
              : cohortViewer
              ? "+ Enroll Employee"
              : "+ Enroll Me"}
          </button>
        </div>
        {showCreateForm && (
          <div className="create-program-form">

            {cohortViewer && (
              <input
                type="text"
                placeholder="Employee ID"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);

                  if (createError) {
                    setCreateError("");
                  }
                }}
              />
            )}

            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);

                if (createError) {
                  setCreateError("");
                }
              }}
            >
              <option value="">
                Select a program
              </option>

              {programs.map((program) => (
                <option
                  key={program.program_id}
                  value={program.program_id}
                >
                  {program.name}
                </option>
              ))}
            </select>
            {createError && (
              <p className="form-error">
                {createError}
              </p>
            )}
            <button
              onClick={handleCreateEnrollment}
              disabled={creating}
            >
              {creating
                ? "Saving..."
                : "Save"}
            </button>
          </div>
        )}
        <div className="enrollment-table-header">
          {cohortViewer && <span>Employee ID</span>}
          <span>Program</span>
          <span>Enrolled At</span>
        </div>

        {visibleEnrollments.length === 0 ? (
          <div className="empty-state">
            <h4>No enrollments found</h4>
            {!cohortViewer && (
              <p>You haven't enrolled in any training programs yet.</p>
            )}
          </div>
        ) : (
          visibleEnrollments.map((enrollment) => (
            <div
              key={enrollment.enrollment_id}
              className="enrollment-table-row"
            >
              {cohortViewer && (
                <div>
                  {enrollment.employee_id}
                </div>
              )}

              <div>
                {programs.find(
                  (program) =>
                    program.program_id ===
                    enrollment.program_id
                )?.name ??
                  enrollment.program_id}
              </div>

              <div>
                {new Date(enrollment.enrolled_at).toLocaleString("en-IN", {dateStyle: "medium",timeStyle: "short",})}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )};