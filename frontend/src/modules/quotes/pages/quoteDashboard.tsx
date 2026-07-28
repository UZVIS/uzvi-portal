import { useEffect, useState } from "react";

import Sidebar from "../../assets/components/Sidebar";
import Header from "../../assets/components/Header";

import OpportunityTable from "../components/opportunityTable";
import OpportunityDialog from "../components/opportunityDialog";
import QuoteDashboardCards from "../components/QuoteDashboardCards";

import {
  createOpportunity,
  getOpportunities,
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

  useEffect(() => {
    async function load() {
      try {
        const data = await getOpportunities();
        setOpportunities(data);
      } catch {
        toast.error("Failed to load opportunities.");
      }
    }

    load();
  }, [reload]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-body">
          <QuoteDashboardCards
            totalOpportunities={opportunities.length}
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