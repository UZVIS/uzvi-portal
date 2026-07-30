import { Route } from "react-router-dom";
import { ProtectedRoute } from "../../shared/components/ProtectedRoute";

import QuoteDashboard from "./pages/quoteDashboard";
import OpportunityDetailsPage from "./pages/OpportunityDetailsPage";
import ScenarioWorkspace from "./pages/ScenarioWorkspace";
export const quoteRoutes = (
  <>
    <Route
      path="/quotes"
      element={
        <ProtectedRoute>
          <QuoteDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/quotes/opportunity/:id"
      element={
        <ProtectedRoute>
          <OpportunityDetailsPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/quotes/scenario/:scenarioId"
      element={
        <ProtectedRoute>
          <ScenarioWorkspace />
        </ProtectedRoute>
      }
    />
  </>
);