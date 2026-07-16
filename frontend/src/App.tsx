import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import { LoginPage } from "./shared/auth/LoginPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import ModuleDirectoryPage from "./modules/directory_dashboard/ModuleDirectoryPage";
import ModulePlaceholderPage from "./modules/directory_dashboard/ModulePlaceholderPage";
import { allModules } from "./modules/directory_dashboard/modules.data";
import { AnnouncementsPage } from "./modules/announcements/AnnouncementsPage";
import UtilizationModulePage from "./modules/consultant_utilization/UtilizationModulePage";
import ExpenseClaimsModulePage from "./modules/expense_claims/ExpenseClaimsModulePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModuleDirectoryPage />} />
          <Route path="/login" element={<LoginPage />} />
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
          {allModules
            .filter(
              (module) =>
                !["/announcements", "/utilization", "/expenses"].includes(
                  module.prefix
                )
            )
            .map((module) => (
              <Route
                key={module.id}
                path={module.prefix}
                element={<ModulePlaceholderPage module={module} />}
              />
            ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
