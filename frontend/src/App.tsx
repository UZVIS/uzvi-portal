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

function HomePage() {
  return (
    <div>
      <h1>UZVI Employee Portal</h1>
      <ul>
        <li><Link to="/announcements">Announcements</Link></li>
        <li><Link to="/utilization">Consultant Utilization</Link></li>
        <li><Link to="/expenses">Expense Claims</Link></li>
        <li><Link to="/helpdesk">Helpdesk</Link></li>
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

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}