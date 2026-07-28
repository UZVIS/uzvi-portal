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

import {
  useEffect,
  useState,
} from "react";

import {
  getOpportunityById,
  getScenarios,
} from "../services/quoteService";

import type {
  Opportunity,
  QuoteScenario,
} from "../types/quote";

import ScenarioTable from "./ScenarioTable";
import ScenarioDialog from "./ScenarioDialog";
import { useAuth } from "../../../shared/auth/AuthContext";

import { createScenario } from "../services/quoteService";

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

  const [reload, setReload] =
    useState(false);

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

  }, [id,reload]);

  if (!opportunity) {

    return (
      <div className="opportunity-details">
        <p className="loading-text">Loading opportunity…</p>
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

  const createdDateLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (

    <div className="opportunity-details">

      <button
        className="back-btn"
        onClick={() => navigate("/quotes")}
      >

        <ArrowLeft size={18} />

        Back to Opportunities

      </button>

      <div className="details-card">

        <div className="details-header">

          <div>

            <h2>

              {opportunity.name}

            </h2>

            <p>

              <Building2 size={16} />

              {opportunity.client}

            </p>

            <p>

              <Calendar size={16} />

              {createdDateLabel}

            </p>

            <div className="details-id">
              {opportunity.opportunity_id}
            </div>

          </div>

           

        </div>

      </div>

      {/* Summary card */}
      <div className="summary-card">

        <div className="summary-item">
          <span className="summary-label">Opportunity Name</span>
          <span className="summary-value">{opportunity.name}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Client Name</span>
          <span className="summary-value">{opportunity.client}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Opportunity ID</span>
          <span className="summary-value summary-value-muted">
            {opportunity.opportunity_id}
          </span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Created Date</span>
          <span className="summary-value">{createdDateLabel}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Total Scenarios</span>
          <span className="summary-value">{totalScenarios}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Total Quotes Generated</span>
          <span className="summary-value">{totalQuotes}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Total Tender Views</span>
          <span className="summary-value">{totalTenders}</span>
        </div>

      </div>

      <div className="section-head-row">
        <h3 className="section-title">
          Scenarios <span className="section-count">({scenarios.length})</span>
        </h3>

        <button
          className="add-btn"
          onClick={() =>
            setShowScenarioDialog(true)
          }
        >
          <FolderPlus size={18} />
          New Scenario
        </button>
      </div>

      <ScenarioTable
        scenarios={scenarios}
        onNewScenario={() => setShowScenarioDialog(true)}
      />

    <ScenarioDialog
    isOpen={showScenarioDialog}
    onClose={() =>
        setShowScenarioDialog(false)
    }
    onSave={async (data) => {

        if (!employee || !id) return;

        try {

            await createScenario({

                opportunity_id: id,

                created_by: employee.employee_id,

                ...data,

            });

            toast.success(
                "Scenario created successfully."
            );

            setReload(prev => !prev);

            setShowScenarioDialog(false);

        } catch {

            toast.error(
                "Failed to create scenario."
            );

        }

    }}
/>

    </div>

  );

}