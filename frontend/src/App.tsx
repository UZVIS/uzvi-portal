import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./shared/auth/AuthContext";
import { LoginPage } from "./shared/auth/LoginPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";

import ModuleDirectoryPage from "./modules/directory/ModuleDirectoryPage";
import ModulePlaceholderPage from "./modules/directory/ModulePlaceholderPage";
import { allModules } from "./modules/directory/modules.data";

import { AnnouncementsPage } from "./modules/announcements/AnnouncementsPage";
import { assetRoutes } from "./modules/assets/routes";
import PendingReturnsPage from "./modules/assets/pages/pendingReturnsPage";
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
    path="/assets/pending-returns"
    element={<PendingReturnsPage />}
/>

          {assetRoutes}

          {allModules
            .filter((module) => module.prefix !== "/announcements" &&
    module.prefix !== "/assets"
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