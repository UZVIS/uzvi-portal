import Sidebar from "../../assets/components/Sidebar";
import Header from "../../assets/components/Header";

import OpportunityDetails from "../components/OpportunityDetails";

import "../styles/quote-dashboard.css";

export default function OpportunityDetailsPage() {
  return (
    <div className="dashboard-layout">
      {/* <Sidebar /> */}

      <div className="dashboard-page">
        {/* <Header /> */}

        <main className="dashboard-body">
          <OpportunityDetails />
        </main>
      </div>
    </div>
  );
}