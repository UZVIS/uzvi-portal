import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCards from "../components/DashboardCards";
import SearchBar from "../components/SearchBar";
import AssetTable from "../components/AssetTable";

import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-layout">

      {/* Sidebar */}

      <Sidebar />

      {/* Right Side */}

      <div className="dashboard-page">

        {/* Fixed Header */}

        <Header />

        {/* Scrollable Body */}

        <main className="dashboard-body">

          {/* <div className="dashboard-header">
    <h2>Welcome back, Admin User</h2>
    <p>Here's what's happening with your assets today.</p>
</div> */}

          <DashboardCards />

          <SearchBar />

          <AssetTable />

        </main>

      </div>

    </div>
  );
}