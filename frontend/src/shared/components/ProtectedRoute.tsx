import type {ReactElement} from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute({
  children,
}: {
  children: ReactElement;
}): ReactElement | null {
  const { employee, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }
  if (!employee) {
    return <Navigate to="/login" replace />;
  }
  return children;
}