import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import Sidebar from "../../assets/components/Sidebar";
import Header from "../../assets/components/Header";

import CostSummaryCards from "../components/CostSummaryCards";
import LineItemsTable from "../components/LineItemsTable";
import OutputTabs from "../components/OutputTabs";
import AddLineItemDialog from "../components/AddLineItemDialog";

import {
    addLineItem,
    getScenarioById,
} from "../services/quoteService";

import type {
    QuoteScenario,
} from "../types/quote";

import "../styles/quote-dashboard.css";

export default function ScenarioWorkspace() {

    const { scenarioId } = useParams();

    const navigate = useNavigate();

    const [scenario, setScenario] =
        useState<QuoteScenario | null>(null);

    const [reload, setReload] =
        useState(false);

    const [showLineItemDialog, setShowLineItemDialog] =
        useState(false);

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

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-page">

                <Header />

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

                            <button className="btn-secondary">

                                <Pencil size={15} />

                                Edit Scenario

                            </button>

                            <button className="btn-danger-outline">

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
        onAddLineItem={() =>
            setShowLineItemDialog(true)
        }
    />

</div>

                    <OutputTabs
                        scenarioId={scenario.scenario_id}
                    />

                    <AddLineItemDialog
                        isOpen={showLineItemDialog}
                        onClose={() =>
                            setShowLineItemDialog(false)
                        }
                        onSave={async (data) => {

                            try {

                                await addLineItem(
                                    scenario.scenario_id,
                                    data
                                );

                                toast.success(
                                    "Line item added successfully."
                                );

                                setReload(prev => !prev);

                                setShowLineItemDialog(false);

                            } catch {

                                toast.error(
                                    "Failed to add line item."
                                );

                            }

                        }}
                    />

                    {/* Export functionality will be added later as per FRD */}

                </main>

            </div>

        </div>

    );

}