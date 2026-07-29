import type { ReactElement } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./ProtectedRoute.css";

function isTierAllowed(accessTier: string, allowedTiers: string[]): boolean {
  const tier = (accessTier || "").trim().toLowerCase();
  return allowedTiers.some((allowed) => {
    const a = allowed.trim().toLowerCase();
    // "Admin/Leadership" should also match the legacy "Admin" seed value,
    // and vice versa — same tier, inconsistent string in existing data.
    if (a.startsWith("admin") && tier.startsWith("admin")) return true;
    return tier === a;
  });
}

export function ProtectedRoute({
  children,
  allowedTiers,
}: {
  children: ReactElement;
  /** If provided, only employees whose access_tier matches one of these
   * are allowed to see this route at all — everyone else is redirected
   * away before the page ever renders. Omit for routes any logged-in
   * employee can view. */
  allowedTiers?: string[];
}): ReactElement | null {
  const { employee, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }
  if (!employee) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedTiers && !isTierAllowed(employee.access_tier, allowedTiers)) {
    return (
      <div className="access-denied">
        <div className="access-denied__card">
          <span className="access-denied__icon" aria-hidden="true">
            🔒
          </span>
          <h1>Access restricted</h1>
          <p>
            This area is limited to {allowedTiers.join(" or ")} accounts. Your account
            (<strong>{employee.access_tier}</strong>) doesn't have access.
          </p>
          <Link to="/" className="button-primary">
            Back to home
          </Link>
        </div>
      </div>
    );
  }
  return children;
}