import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuth();
  if (isHydrating) {
    return (
      <div className="site-main site-main--sheet">
        <p className="lead">Loading…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Patient Directory + Manual Patient Entry: available to guests and admins.
 * Signed-in **user** role is redirected home (nav hides these entries).
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isHydrating } = useAuth();
  if (isHydrating) {
    return (
      <div className="site-main site-main--sheet">
        <p className="lead">Loading…</p>
      </div>
    );
  }
  if (isAuthenticated && user?.role === "user") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isHydrating } = useAuth();
  if (isHydrating) {
    return (
      <div className="site-main site-main--sheet">
        <p className="lead">Loading…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
