import {
  ArrowLeft,
  Building2,
  Calendar,
  FolderPlus,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useEffect, useState } from "react";

import {
  getOpportunityById,
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
} from "../services/quoteService";

import type {
  Opportunity,
  QuoteScenario,
} from "../types/quote";

import ScenarioTable from "./ScenarioTable";
import ScenarioDialog from "./ScenarioDialog";
import ConfirmDialog from "./confirmDialog";

import { useAuth } from "../../../shared/auth/AuthContext";
import { toast } from "sonner";

export default function OpportunityDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [opportunity, setOpportunity] =
    useState<Opportunity | null>(null);

  const [scenarios, setScenarios] =
    useState<QuoteScenario[]>([]);

  const { employee } = useAuth();

  const [showScenarioDialog, setShowScenarioDialog] =
    useState(false);

  const [reload, setReload] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [selectedScenarioId, setSelectedScenarioId] =
    useState("");

  const [editingScenario, setEditingScenario] =
    useState<QuoteScenario | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const opportunityData =
          await getOpportunityById(id);

        setOpportunity(opportunityData);

        const scenarioData =
          await getScenarios(id);

        setScenarios(scenarioData);
      } catch (error) {
        console.error(error);
      }
    }

    load();
  }, [id, reload]);

  if (!opportunity) {
    return (
      <div className="opportunity-details">
        <p className="loading-text">
          Loading opportunity…
        </p>
      </div>
    );
  }

  const totalScenarios = scenarios.length;

  const totalQuotes = scenarios.filter(
    (s) => s.output_type === "quote"
  ).length;

  const totalTenders = scenarios.filter(
    (s) => s.output_type === "tender"
  ).length;

  const createdDateLabel = new Date().toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div className="opportunity-details">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        className="back-btn"
        onClick={() => navigate("/quotes")}
      >
        <ArrowLeft size={18} />
        <span>Back to Opportunities</span>
      </button>


      {/* =====================================================
          OPPORTUNITY HEADER
      ===================================================== */}

      <div className="details-card">

        <div className="details-header">

          <div className="details-header-left">

            <div className="opportunity-icon">
              <Building2 size={24} />
            </div>

            <div className="details-header-info">

              <h2>
                {opportunity.name}
              </h2>

              <div className="details-header-subtitle">

                <Building2 size={15} />

                <span>
                  {opportunity.client}
                </span>

                <span className="header-separator">
                  •
                </span>

                <Calendar size={15} />

                <span>
                  {createdDateLabel}
                </span>

              </div>

            </div>

          </div>


          {/* RIGHT SIDE */}

          <div className="details-header-right">

            <span className="details-id-label">
              Opportunity ID
            </span>

            <span className="details-id">
              {opportunity.opportunity_id}
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          OPPORTUNITY OVERVIEW
      ===================================================== */}

      <section className="opportunity-overview">

        <div className="overview-heading">

          <div>
            <h3>
              Opportunity Overview
            </h3>

            <p>
              Summary of this opportunity and its scenarios.
            </p>
          </div>

        </div>


        {/* SUMMARY */}

        <div className="summary-card">

          <div className="summary-item">
            <span className="summary-label">
              Opportunity
            </span>

            <span className="summary-value">
              {opportunity.name}
            </span>
          </div>


          <div className="summary-item">
            <span className="summary-label">
              Client
            </span>

            <span className="summary-value">
              {opportunity.client}
            </span>
          </div>


          <div className="summary-item">
            <span className="summary-label">
              Created
            </span>

            <span className="summary-value">
              {createdDateLabel}
            </span>
          </div>


          <div className="summary-item">
            <span className="summary-label">
              Scenarios
            </span>

            <span className="summary-number blue">
              {totalScenarios}
            </span>
          </div>


          <div className="summary-item">
            <span className="summary-label">
              Quotes Generated
            </span>

            <span className="summary-number orange">
              {totalQuotes}
            </span>
          </div>


          <div className="summary-item">
            <span className="summary-label">
              Tenders Generated
            </span>

            <span className="summary-number amber">
              {totalTenders}
            </span>
          </div>

        </div>

      </section>


      {/* =====================================================
          SCENARIOS
      ===================================================== */}

      <section className="scenarios-section">

       <div className="section-head-row">

  <div className="section-head-left">
    <div>
      <h3 className="section-title">
        Scenarios
        <span className="section-count">
          {scenarios.length}
        </span>
      </h3>

      <p className="section-description">
        Manage quote and tender scenarios.
      </p>
    </div>
  </div>

  <button
    className="add-btn"
    onClick={() => setShowScenarioDialog(true)}
  >
    <FolderPlus size={18} />
    New Scenario
  </button>

</div>


        {/* ===================================================
            SCENARIO TABLE
        =================================================== */}

        <div className="scenario-table-wrapper">

          <ScenarioTable
            scenarios={scenarios}
            onNewScenario={() =>
              setShowScenarioDialog(true)
            }

            onDeleteScenario={(scenarioId) => {
              setSelectedScenarioId(scenarioId);
              setShowDeleteDialog(true);
            }}

            onEditScenario={(scenario) => {
              setEditingScenario(scenario);
              setShowScenarioDialog(true);
            }}
          />

        </div>

      </section>


      {/* =====================================================
          CREATE / EDIT
      ===================================================== */}

      <ScenarioDialog
        isOpen={showScenarioDialog}
        scenario={editingScenario}

        onClose={() => {
          setShowScenarioDialog(false);
          setEditingScenario(null);
        }}

        onSave={async (data) => {
          if (!employee || !id) return;

          try {
            if (editingScenario) {

              await updateScenario(
                editingScenario.scenario_id,
                data
              );

              toast.success(
                "Scenario updated successfully."
              );

            } else {

              await createScenario({
                opportunity_id: id,
                created_by: employee.employee_id,
                ...data,
              });

              toast.success(
                "Scenario created successfully."
              );
            }

            setReload((prev) => !prev);

            setShowScenarioDialog(false);

            setEditingScenario(null);

          } catch {

            toast.error(
              editingScenario
                ? "Failed to update scenario."
                : "Failed to create scenario."
            );
          }
        }}
      />


      {/* =====================================================
          DELETE
      ===================================================== */}

      <ConfirmDialog
        isOpen={showDeleteDialog}

        title="Delete Scenario"

        message="Are you sure you want to delete this scenario?"

        onCancel={() =>
          setShowDeleteDialog(false)
        }

        onConfirm={async () => {
          try {

            await deleteScenario(
              selectedScenarioId
            );

            toast.success(
              "Scenario deleted."
            );

            setReload((prev) => !prev);

          } catch {

            toast.error(
              "Failed to delete scenario."
            );

          } finally {

            setShowDeleteDialog(false);

          }
        }}
      />

    </div>
  );
}