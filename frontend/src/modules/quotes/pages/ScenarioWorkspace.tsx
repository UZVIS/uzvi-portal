import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ScenarioComparisonDialog from "../components/ScenarioComparisonDialog";
import Sidebar from "../../assets/components/Sidebar";
import Header from "../../assets/components/Header";

import CostSummaryCards from "../components/CostSummaryCards";
import LineItemsTable from "../components/LineItemsTable";
import OutputTabs from "../components/OutputTabs";
import AddLineItemDialog from "../components/AddLineItemDialog"
import { deleteScenario } from "../services/quoteService";
import {
    addLineItem,
    updateLineItem,
    deleteLineItem,
     getScenarios,
    getScenarioById,
     compareScenarios,
    
} from "../services/quoteService";
import type {
    QuoteScenario,
    CostLineItem,
} from "../types/quote";
import ConfirmDialog from "../components/confirmDialog"
import "../styles/quote-dashboard.css";
import ScenarioDialog from "../components/ScenarioDialog";
import { updateScenario } from "../services/quoteService";
export default function ScenarioWorkspace() {

    const { scenarioId } = useParams();

    const navigate = useNavigate();

    const [scenario, setScenario] =
        useState<QuoteScenario | null>(null);

    const [reload, setReload] =
        useState(false);

    const [showLineItemDialog, setShowLineItemDialog] =
        useState(false);

    const [editingLineItem, setEditingLineItem] =
        useState<CostLineItem | null>(null);

    const [showDeleteLineItemDialog, setShowDeleteLineItemDialog] =
         useState(false);

    const [selectedLineItemId, setSelectedLineItemId] =
         useState("");
    const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

    const [showEditDialog, setShowEditDialog] =
    useState(false);

    const [showComparison, setShowComparison] =
  useState(false);

const [scenarios, setScenarios] =
  useState<QuoteScenario[]>([]);

    useEffect(() => {

        async function loadScenario() {

            if (!scenarioId) return;

            try {

                const data =
                    await getScenarioById(scenarioId);

                setScenario(data);

            } catch {

                toast.error(
                    "Failed to load scenario."
                );

            }

        }

        loadScenario();

    }, [scenarioId, reload]);

    if (!scenario) {

        return <p>Loading...</p>;

    }
    const openComparison = async () => {
  if (!scenario?.opportunity_id) {
    toast.error("Opportunity information not available.");
    return;
  }

  try {
    const data = await getScenarios(
      scenario.opportunity_id
    );

    if (data.length < 2) {
      toast.error(
        "At least two scenarios are required for comparison."
      );
      return;
    }

    setScenarios(data);
    setShowComparison(true);

  } catch {
    toast.error(
      "Failed to load scenarios."
    );
  }
};

    return (

        <div className="dashboard-layout">

            {/* <Sidebar /> */}

            <div className="dashboard-page">

                {/* <Header /> */}

                <main className="dashboard-body">

                    <button
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={18} />
                        Back to Opportunity
                    </button>

                    <div className="ws-header-card">

                        <div>

                            <div className="ws-title-row">

                                <h1 className="ws-title">
                                    {scenario.name}
                                </h1>

                                <span className="badge badge-quote">
                                    {scenario.output_type}
                                </span>

                                <span className="status-badge draft">
                                    Draft
                                </span>

                            </div>

                            <div className="ws-sub">
                                Scenario ID: {scenario.scenario_id}
                            </div>

                            <div className="ws-facts">

                                <span className="ws-margin-chip">

                                    <TrendingUp size={13} />

                                    Target Margin{" "}
                                    {(scenario.target_margin * 100).toFixed(0)}%

                                </span>

                            </div>

                        </div>

                        <div className="ws-header-actions">

    <button
        className="btn-secondary"
        onClick={openComparison}
    >
        <TrendingUp size={15} />
        Compare Scenarios
    </button>

    <button
        className="btn-secondary"
        onClick={() =>
            setShowEditDialog(true)
        }
    >
        <Pencil size={15} />
        Edit Scenario
    </button>

    <button
        className="btn-danger-outline"
        onClick={() =>
            setShowDeleteDialog(true)
        }
    >
        <Trash2 size={15} />
        Delete Scenario
    </button>

</div>

                    </div>

                    <CostSummaryCards
                        scenario={scenario}
                    />

                   <div className="workspace-grid">

   <LineItemsTable
    scenarioId={scenario.scenario_id}
    lineItems={scenario.line_items}
    onAddLineItem={() => {

        setEditingLineItem(null);

        setShowLineItemDialog(true);

    }}
    onEditLineItem={(item) => {
        console.log("Clicked Edit:", item);
        setEditingLineItem(item);

        setShowLineItemDialog(true);

    }}
    onDeleteLineItem={(id) => {

        setSelectedLineItemId(id);

        setShowDeleteLineItemDialog(true);

    }}
/>

</div>

                    <OutputTabs
                        scenarioId={scenario.scenario_id}
                         reload={reload}
                    />

                    <AddLineItemDialog
    isOpen={showLineItemDialog}
    initialData={editingLineItem}
    onClose={() => {

        setShowLineItemDialog(false);

        setEditingLineItem(null);

    }}
    onSave={async (data) => {

        try {

            if (editingLineItem) {

                await updateLineItem(
                    editingLineItem.line_item_id,
                    data
                );

                toast.success(
                    "Line item updated successfully."
                );

            } else {

                await addLineItem(
                    scenario.scenario_id,
                    data
                );

                toast.success(
                    "Line item added successfully."
                );

            }

            setReload(prev => !prev);

            setShowLineItemDialog(false);

            setEditingLineItem(null);

        } catch {

            toast.error(
                editingLineItem
                    ? "Failed to update line item."
                    : "Failed to add line item."
            );

        }

    }}
/>


                    <ConfirmDialog
    isOpen={showDeleteDialog}
    title="Delete Scenario"
    message="Are you sure you want to delete this scenario?"
    confirmLabel="Delete"
    cancelLabel="Cancel"
    onCancel={() =>
        setShowDeleteDialog(false)
    }
    onConfirm={async () => {

        try {

            await deleteScenario(
                scenario.scenario_id
            );

            toast.success(
                "Scenario deleted."
            );

            navigate(-1);

        } catch {

            toast.error(
                "Failed to delete scenario."
            );

        } finally {

            setShowDeleteDialog(false);

        }

    }}
/>
<ConfirmDialog
    isOpen={showDeleteLineItemDialog}
    title="Delete Line Item"
    message="Are you sure you want to delete this line item?"
    confirmLabel="Delete"
    cancelLabel="Cancel"
    onCancel={() =>
        setShowDeleteLineItemDialog(false)
    }
    onConfirm={async () => {

        try {

            await deleteLineItem(
                selectedLineItemId
            );

            toast.success(
                "Line item deleted."
            );

            setReload(prev => !prev);

        } catch {

            toast.error(
                "Failed to delete line item."
            );

        } finally {

            setShowDeleteLineItemDialog(false);

        }

    }}
/>
<ScenarioDialog
  isOpen={showEditDialog}
  scenario={scenario}
  onClose={() =>
    setShowEditDialog(false)
  }
  onSave={async (data) => {

    try {

      await updateScenario(
        scenario.scenario_id,
        data
      );

      toast.success(
        "Scenario updated successfully."
      );

      setReload(prev => !prev);

      setShowEditDialog(false);

    } catch {

      toast.error(
        "Failed to update scenario."
      );

    }

  }}
/>
<ScenarioComparisonDialog
    isOpen={showComparison}
    scenarios={scenarios}
    currentScenarioId={scenario.scenario_id}
    onClose={() => setShowComparison(false)}
    onCompare={async (scenarioIds) => {
        return await compareScenarios(
            scenario.opportunity_id,
            scenarioIds
        );
    }}
/>


                    {/* Export functionality will be added later as per FRD */}

                </main>

            </div>

        </div>

    );

}