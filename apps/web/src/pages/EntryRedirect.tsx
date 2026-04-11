import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * `/` entry: guests → sign-in; signed-in → admin dashboard or user health hub.
 */
export default function EntryRedirect() {
  const { isAuthenticated, isHydrating, user } = useAuth();
  if (isHydrating) {
    return (
      <div className="site-main site-main--sheet">
        <p className="lead">Loading…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/my-health" replace />;
}
