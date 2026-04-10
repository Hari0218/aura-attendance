import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStorage } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();

  if (!authStorage.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
