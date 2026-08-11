import { useEffect, useState } from "react";

import OpportunityTable from "../components/opportunityTable";
import OpportunityDialog from "../components/opportunityDialog";
import QuoteDashboardCards from "../components/QuoteDashboardCards";

import {
  createOpportunity,
  getOpportunities,
  getScenarios,
} from "../services/quoteService";

import type { Opportunity } from "../types/quote";

import { toast } from "sonner";

import "../styles/quote-dashboard.css";

export default function QuoteDashboard() {
  const [showOpportunityDialog, setShowOpportunityDialog] =
    useState(false);

  const [reload, setReload] = useState(false);

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([]);

  const [totalScenarios, setTotalScenarios] = useState(0);

  const [totalQuotes, setTotalQuotes] = useState(0);

  const [totalTenders, setTotalTenders] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOpportunities();

        let scenarioCount = 0;
        let quoteCount = 0;
        let tenderCount = 0;

        const updatedOpportunities = await Promise.all(
          data.map(async (opportunity) => {
            const scenarios = await getScenarios(
              opportunity.opportunity_id
            );

            scenarioCount += scenarios.length;

            quoteCount += scenarios.filter(
              (s) => s.output_type === "quote"
            ).length;

            tenderCount += scenarios.filter(
              (s) => s.output_type === "tender"
            ).length;

            return {
              ...opportunity,
              scenarioCount: scenarios.length,
            };
          })
        );

        setOpportunities(updatedOpportunities);

        setTotalScenarios(scenarioCount);

        setTotalQuotes(quoteCount);

        setTotalTenders(tenderCount);
      } catch {
        toast.error("Failed to load opportunities.");
      }
    }

    load();
  }, [reload]);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-page">
        <main className="dashboard-body">

          <QuoteDashboardCards
            totalOpportunities={opportunities.length}
            totalScenarios={totalScenarios}
            totalQuotes={totalQuotes}
            totalTenders={totalTenders}
          />

          <OpportunityTable
            opportunities={opportunities}
            onAddOpportunity={() =>
              setShowOpportunityDialog(true)
            }
          />

          <OpportunityDialog
            isOpen={showOpportunityDialog}
            onClose={() =>
              setShowOpportunityDialog(false)
            }
            onSave={async (data) => {
              try {
                await createOpportunity(data);

                toast.success(
                  "Opportunity created successfully."
                );

                setReload((prev) => !prev);

                setShowOpportunityDialog(false);
              } catch {
                toast.error(
                  "Failed to create opportunity."
                );
              }
            }}
          />

        </main>
      </div>
    </div>
  );
}