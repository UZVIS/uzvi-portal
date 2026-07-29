import { Briefcase, Layers, FileText } from "lucide-react";

interface QuoteDashboardCardsProps {
  totalOpportunities: number;
  totalScenarios: number;
  totalQuotes: number;
}

export default function QuoteDashboardCards({
  totalOpportunities,
  totalScenarios,
  totalQuotes,
}: QuoteDashboardCardsProps) {
  return (
    <div className="dashboard-cards">

      <div className="dashboard-card">
        <div className="card-icon card-icon-orange">
          <Briefcase size={20} />
        </div>
        <div className="card-body">
          <h2>{totalOpportunities}</h2>
          <span className="card-title">Opportunities</span>
          <span className="card-caption">Active opportunities</span>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-icon card-icon-blue">
          <Layers size={20} />
        </div>
        <div className="card-body">
          <h2>{totalScenarios}</h2>
          <span className="card-title">Scenarios</span>
          <span className="card-caption">Scenarios created</span>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-icon card-icon-green">
          <FileText size={20} />
        </div>
        <div className="card-body">
          <h2>{totalQuotes}</h2>
          <span className="card-title">Quotes Generated</span>
          <span className="card-caption">Quotes generated</span>
        </div>
      </div>

    </div>
  );
}