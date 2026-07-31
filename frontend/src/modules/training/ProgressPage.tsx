import { useEffect, useState } from "react";
import { trainingApi } from "./api";
import type {
  Progress,
  CohortProgress,
  TrainingProgram,
} from "./types";
import "./ProgressPage.css";

export default function ProgressPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [employeeProgress, setEmployeeProgress] = useState<Progress | null>(null);
  const [cohortProgress, setCohortProgress] = useState<CohortProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [cohortError, setCohortError] = useState("");

  const handleEmployeeProgress = async () => {
    if (!employeeId.trim()) {
      setEmployeeError("Employee ID is required.");
      return;
    }

    try {
      setLoading(true);
      setEmployeeError("");

      const data = await trainingApi.getEmployeeProgress(
        employeeId.trim()
      );

      setEmployeeProgress(data);
    } catch (err) {
      setEmployeeProgress(null);

      setEmployeeError(
        err instanceof Error
          ? err.message
          : "Failed to load employee progress."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCohortProgress = async () => {
    if (!selectedProgram) {
      setCohortError("Please select a program.");
      return;
    }

    try {
      setLoading(true);
      setCohortError("");

      const data = await trainingApi.getCohortProgress(
        Number(selectedProgram)
      );

      setCohortProgress(data);
    } catch (err) {
      setCohortProgress(null);

      setCohortError(
        err instanceof Error
          ? err.message
          : "Failed to load cohort progress."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadPrograms() {
      try {
        const data = await trainingApi.listPrograms();
        setPrograms(data);
      } catch (err) {
        setCohortError(
          err instanceof Error
            ? err.message
            : "Failed to load programs."
        );
      }
    }

    loadPrograms();
  }, []);

  return (
      <div className="progress-page">
        <div className="progress-header">
          <h2>Training Progress</h2>
          <p>
            Track employee and cohort training progress.
          </p>
        </div>

        <div className="progress-search-grid">

          {/* Employee Progress */}
          <div className="progress-card">
            <h3>Employee Progress</h3>

            <input
              type="text"
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value)
              }
            />

            <button
              onClick={handleEmployeeProgress}
              disabled={loading}
            >
              {loading ? "Loading..." : "View Progress"}
            </button>

            {employeeError && (
              <p className="form-error">
                {employeeError}
              </p>
            )}
          </div>

          {/* Cohort Progress */}
          <div className="progress-card">
            <h3>Cohort Progress</h3>

            <select
              value={selectedProgram}
              onChange={(e) =>
                setSelectedProgram(e.target.value)
              }
            >
              <option value="">
                Select Program
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

            <button
              onClick={handleCohortProgress}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "View Progress"}
            </button>

            {cohortError && (
              <p className="form-error">
                {cohortError}
              </p>
            )}
          </div>
        </div>

        {employeeProgress && (
          <div className="summary-card">
            <h3>Employee Progress</h3>

            <p className="summary-title">
              Employee ID:
              <strong>
                {" "}
                {employeeProgress.employee_id}
              </strong>
            </p>

            <div className="stats-grid">

              <div className="stat-card">
                <span>Completed Units</span>
                <h2>
                  {employeeProgress.completed_units}
                </h2>
              </div>

              <div className="stat-card">
                <span>Total Units</span>
                <h2>
                  {employeeProgress.total_units}
                </h2>
              </div>

              <div className="stat-card">
                <span>Completion</span>
                <h2>
                  {employeeProgress.completion_percentage}%
                </h2>
              </div>

            </div>
          </div>
        )}

        {cohortProgress && (
          <div className="summary-card">
            <h3>Cohort Progress</h3>

            <p className="summary-title">
              Program:
              <strong>
                {" "}
                {cohortProgress.program_name}
              </strong>
            </p>

            <div className="stats-grid">

              <div className="stat-card">
                <span>Total Enrollments</span>
                <h2>
                  {cohortProgress.total_enrollments}
                </h2>
              </div>

              <div className="stat-card">
                <span>Completed</span>
                <h2>
                  {cohortProgress.completed_enrollments}
                </h2>
              </div>

              <div className="stat-card">
                <span>Average Completion</span>
                <h2>
                  {cohortProgress.average_completion_percentage}%
                </h2>
              </div>

            </div>

            {cohortProgress.lagging_employees.length > 0 && (
              <div className="lagging-employees">
                <h4>Falling Behind Pace</h4>

                <ul>
                  {cohortProgress.lagging_employees.map((entry) => (
                    <li key={entry.employee_id}>
                      <strong>{entry.employee_id}</strong>
                      {" — "}
                      {entry.completion_percentage}% complete
                      {" "}
                      ({entry.points_behind_average} pts behind cohort average)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    );
  }