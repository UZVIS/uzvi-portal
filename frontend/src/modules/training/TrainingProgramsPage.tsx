import { useEffect, useMemo, useState } from "react";
import { trainingApi } from "./api";
import type { TrainingProgram } from "./types";
import "./TrainingProgramsPage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { isTrainingAdmin } from "./roles";

export default function TrainingProgramsPage() {
  const { employee } = useAuth();
  // FR-LMS-01: only Admin/Leadership may define training programs.
  const admin = isTrainingAdmin(employee?.access_tier);

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [programName, setProgramName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const navigate = useNavigate();

  async function loadPrograms() {
  try {
    setLoading(true);

    const data =
      await trainingApi.listPrograms();

    setPrograms(data);
    setError("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load training programs."
    );
  } finally {
    setLoading(false);
  }
}

async function handleCreateProgram() {
  if (!programName.trim()) {
    setCreateError("Program name is required.");
    return;
  }
  if (programName.trim().length < 2) {
    setCreateError(
      "Program name must be at least 2 characters."
    );
    return;
  }
  try {
    setCreating(true);
    setCreateError("");

    await trainingApi.createProgram({
      name: programName.trim(),
    });

    setProgramName("");
    setShowCreateForm(false);

    await loadPrograms();
  } catch (err) {
    setCreateError(
      err instanceof Error
        ? err.message
        : "Failed to create program."
    );
  } finally {
    setCreating(false);
  }
}

useEffect(() => {
  loadPrograms();
}, []);

  const filteredPrograms = useMemo(() => {
    const value = search.toLowerCase();

    return programs.filter(
      (program) =>
        program.program_id.toString().includes(value) ||
        program.name.toLowerCase().includes(value)
    );
  }, [programs, search]);

  if (loading) {
    return (
      <div className="training-loading">
        Loading training programs...
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
    <div className="training-programs-page">

      <div className="search-container">
        <input
          type="text"
          placeholder="Search programs..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <div className="training-card">

        <div className="training-card-header">
          <div>
            <h3>Training Programs</h3>
            <span>
              {filteredPrograms.length} programs
            </span>
          </div>

          {admin && (
            <button
              className="create-program-button"
              onClick={() =>
                setShowCreateForm(!showCreateForm)
              }
            >
              {showCreateForm
                ? "Cancel"
                : "+ Create Program"}
            </button>
          )}
        </div>

        {admin && showCreateForm && (
  <div className="create-program-form">

    <input
      type="text"
      placeholder="Program name"
      value={programName}
      onChange={(e) => {
        setProgramName(e.target.value);
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

    <button onClick={handleCreateProgram} disabled={creating}>
      {creating ? "Saving..." : "Save"}
    </button>

  </div>
)}

        <div className="programs-table-header">

          <span>ID</span>

          <span>Program Name</span>

          <span>Action</span>

        </div>

        {filteredPrograms.length === 0 ? (

          <div className="empty-state">
            <h4>No programs found</h4>
            <p>
              Try a different search.
            </p>
          </div>

        ) : (

          filteredPrograms.map((program) => (

            <div
              className="programs-table-row"
              key={program.program_id}
            >

              <div>
                #{program.program_id}
              </div>

              <div>
                {program.name}
              </div>

              <div>
                <button className="manage-button" onClick={() => navigate(`/training/programs/${program.program_id}`)}>
                  {admin ? "Manage" : "View Units"}
                </button>
              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}