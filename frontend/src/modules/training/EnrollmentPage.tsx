import { useEffect, useState } from "react";
import { trainingApi } from "./api";
import type {
  Enrollment,
  TrainingProgram,
} from "./types";
import "./EnrollmentPage.css";

export default function EnrollmentPage() {
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
    if (!employeeId.trim()) {
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
        employee_id: employeeId.trim(),
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
            Total Enrollments: {enrollments.length}
          </h3>
          <button
            className="create-program-button"
            onClick={() =>
              setShowCreateForm(!showCreateForm)
            }
          >
            {showCreateForm
              ? "Cancel"
              : "+ Enroll Employee"}
          </button>
        </div>
        {showCreateForm && (
          <div className="create-program-form">

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
        <div className="table-header">
          <span>Employee ID</span>
          <span>Program</span>
          <span>Enrolled At</span>
        </div>

        {enrollments.length === 0 ? (
          <div className="empty-state">
            <h4>No enrollments found</h4>
          </div>
        ) : (
          enrollments.map((enrollment) => (
            <div
              key={enrollment.enrollment_id}
              className="training-item"
            >
              <div>
                {enrollment.employee_id}
              </div>

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