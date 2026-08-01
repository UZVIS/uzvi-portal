import { Route } from "react-router-dom";
import { ProtectedRoute } from "../../shared/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PendingReturnsPage from "./pages/pendingReturnsPage"

export const assetRoutes = (
  <>
    <Route
      path="/assets"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/assets/pending-returns"
      element={
        <ProtectedRoute>
          <PendingReturnsPage />
        </ProtectedRoute>
      }
    />
  </>
);