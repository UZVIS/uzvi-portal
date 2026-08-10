import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trainingApi } from "./api";
import type { TrainingUnit } from "./types";
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
        </div>

        {sortedUnits.length === 0 ? (
          <div className="empty-state">
            <h4>No units found</h4>
            <p>
              This program doesn't have any
              training units yet.
            </p>
          </div>
        ) : (
          sortedUnits.map((unit) => (
            <div
              key={unit.unit_id}
              className="units-table-row"
            >
              <div>{unit.sequence}</div>

              <div>{unit.name}</div>
            </div>
          ))
        )}

      </div>

    </div>
  );
}