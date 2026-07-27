import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

import { AuthProvider } from "./shared/auth/AuthContext";
import { LoginPage } from "./shared/auth/LoginPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";

import { AnnouncementsPage } from "./modules/announcements/AnnouncementsPage";
import { ComposeAnnouncementPage } from "./modules/announcements/ComposeAnnouncementPage";
import { AcknowledgmentsOverviewPage } from "./modules/announcements/AcknowledgmentsOverviewPage";
import { AnnouncementsDashboardPage } from "./modules/dashboard/AnnouncementsDashboardPage";
import UtilizationModulePage from "./modules/consultant_utilization/UtilizationModulePage";
import ExpenseClaimsModulePage from "./modules/expense_claims/ExpenseClaimsModulePage";
import HelpdeskModulePage from "./modules/helpdesk/HelpdeskModulePage";
import TicketDetailsPage from "./modules/helpdesk/TicketDetailsPage";
import RecruitingModulePage from "./modules/recruiting/RecruitingModulePage";
import { RecruitingHomePage } from "./modules/recruiting/RecruitingHomePage";
import { PipelineFunnelPage } from "./modules/recruiting/PipelineFunnelPage";
import { SourcingPage } from "./modules/recruiting/SourcingPage";
import { CandidatePipelinePage } from "./modules/recruiting/CandidatePipelinePage";
import { DuplicatesPage } from "./modules/recruiting/DuplicatesPage";
import { CandidateDetailPage } from "./modules/recruiting/CandidateDetailPage";

function HomePage() {
  return (
    <div>
      <h1>UZVI Employee Portal</h1>
      <ul>
        <li><Link to="/dashboard">Announcements</Link></li>
        <li><Link to="/utilization">Consultant Utilization</Link></li>
        <li><Link to="/expenses">Expense Claims</Link></li>
        <li><Link to="/helpdesk">Helpdesk</Link></li>
        <li><Link to="/recruiting">Recruiting / Candidate Pipeline </Link></li>

      </ul>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AnnouncementsDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements/new"
            element={
              <ProtectedRoute>
                <ComposeAnnouncementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements/acknowledgments"
            element={
              <ProtectedRoute>
                <AcknowledgmentsOverviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/utilization"
            element={
              <ProtectedRoute>
                <UtilizationModulePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpenseClaimsModulePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/helpdesk"
            element={
              <ProtectedRoute>
                <HelpdeskModulePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/helpdesk/tickets/:ticketId"
            element={
              <ProtectedRoute>
                <TicketDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiting"
            element={
              <ProtectedRoute allowedTiers={["Admin/Leadership", "HR-Restricted"]}>
                <RecruitingModulePage />
              </ProtectedRoute>
            }
          >
            <Route index element={<RecruitingHomePage />} />
            <Route path="funnel" element={<PipelineFunnelPage />} />
            <Route path="sourcing" element={<SourcingPage />} />
            <Route path="pipeline" element={<CandidatePipelinePage />} />
            <Route path="duplicates" element={<DuplicatesPage />} />
            <Route path="candidates/:candidateId" element={<CandidateDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}