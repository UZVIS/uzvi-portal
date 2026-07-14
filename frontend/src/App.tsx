import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./shared/auth/AuthContext";
import { LoginPage } from "./shared/auth/LoginPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";

import ModuleDirectoryPage from "./modules/directory/ModuleDirectoryPage";
import ModulePlaceholderPage from "./modules/directory/ModulePlaceholderPage";
import { allModules } from "./modules/directory/modules.data";

import { AnnouncementsPage } from "./modules/announcements/AnnouncementsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<ModuleDirectoryPage />} />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {allModules
            .filter((module) => module.prefix !== "/announcements")
            .map((module) => (
              <Route
                key={module.id}
                path={module.prefix}
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage module={module} />
                  </ProtectedRoute>
                }
              />
            ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}