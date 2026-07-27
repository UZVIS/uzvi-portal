import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import { LoginPage } from "./shared/auth/LoginPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { AnnouncementsPage } from "./modules/announcements/AnnouncementsPage";
import UtilizationModulePage from "./modules/consultant_utilization/UtilizationModulePage";
import ExpenseClaimsModulePage from "./modules/expense_claims/ExpenseClaimsModulePage";
import { DirectoryPage } from "./modules/directory/DirectoryPage";
import { OnboardingPage } from "./modules/onboarding/OnboardingPage";
import { DocumentsPage } from "./modules/documents/DocumentsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DirectoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/directory"
            element={
              <ProtectedRoute>
                <DirectoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
