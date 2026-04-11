import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  IconFileText,
  IconGrid,
  IconHeart,
  IconHome,
  IconMessageSquare,
  IconShield,
  IconUpload,
  IconUserPlus,
  IconUsers,
} from "./components/NavIcons";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import ConsentPortal from "./pages/ConsentPortal";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Manual from "./pages/Manual";
import Feedback from "./pages/Feedback";
import MyHealth from "./pages/MyHealth";
import PatientEntry from "./pages/PatientEntry";
import PatientSummary from "./pages/PatientSummary";
import Patients from "./pages/Patients";
import Upload from "./pages/Upload";
import { RequireAdmin, RequireAuth, RequireStaff } from "./routeGuards";

function navTabClass(base: string) {
  return ({ isActive }: { isActive: boolean }) =>
    ["nav-tab", base, isActive ? "nav-tab--active" : ""].filter(Boolean).join(" ");
}

function AppShell() {
  const { pathname } = useLocation();
  const { isAuthenticated, isHydrating, user, logout } = useAuth();
  const isHome = pathname === "/";
  const isPatientEntry = pathname === "/patient";
  const isPatientSummary = pathname.startsWith("/patient/summary/");
  const isConsent = pathname === "/consent";
  const isMyHealth = pathname === "/my-health";
  const isFeedback = pathname === "/feedback";

  const staffNav = !isAuthenticated || user?.role === "admin";

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            Patient Healthcare Platform
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <NavLink to="/" end className={navTabClass("nav-tab--home")}>
              <IconHome className="nav-tab-icon" />
              <span>Home</span>
            </NavLink>
            <NavLink to="/upload" className={navTabClass("nav-tab--upload")}>
              <IconUpload className="nav-tab-icon" />
              <span>Upload</span>
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/my-health" className={navTabClass("nav-tab--health")}>
                  <IconHeart className="nav-tab-icon" />
                  <span>My health data</span>
                </NavLink>
                <NavLink to="/feedback" className={navTabClass("nav-tab--feedback")}>
                  <IconMessageSquare className="nav-tab-icon" />
                  <span>Feedback</span>
                </NavLink>
              </>
            )}
            {staffNav && (
              <>
                <NavLink to="/patients" className={navTabClass("nav-tab--directory")}>
                  <IconUsers className="nav-tab-icon" />
                  <span>Patient Directory</span>
                </NavLink>
                <NavLink to="/patient" className={navTabClass("nav-tab--manual-entry")}>
                  <IconUserPlus className="nav-tab-icon" />
                  <span>Manual Patient Entry</span>
                </NavLink>
              </>
            )}
            <NavLink to="/consent" className={navTabClass("nav-tab--consent")}>
              <IconShield className="nav-tab-icon" />
              <span>Consent Portal</span>
            </NavLink>
            <NavLink to="/manual" className={navTabClass("nav-tab--about")}>
              <IconFileText className="nav-tab-icon" />
              <span>About the Platform</span>
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={navTabClass("nav-tab--admin")}>
                <IconGrid className="nav-tab-icon" />
                <span>Admin</span>
              </NavLink>
            )}
            {!isHydrating &&
              (isAuthenticated ? (
                <>
                  <span className="site-nav-user" title={user?.email}>
                    {user?.email}
                  </span>
                  <button type="button" className="nav-tab nav-tab--signout" onClick={() => logout()}>
                    Sign out
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={navTabClass("nav-tab--login")}>
                  <span>Sign in</span>
                </NavLink>
              ))}
          </nav>
        </div>
      </header>

      <main
        className={
          isHome || isPatientEntry || isPatientSummary || isConsent || isMyHealth || isFeedback
            ? "site-main site-main--flush"
            : "site-main site-main--sheet"
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route
            path="/my-health"
            element={
              <RequireAuth>
                <MyHealth />
              </RequireAuth>
            }
          />
          <Route
            path="/feedback"
            element={
              <RequireAuth>
                <Feedback />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/patients"
            element={
              <RequireStaff>
                <Patients />
              </RequireStaff>
            }
          />
          <Route path="/patient/summary/:id" element={<PatientSummary />} />
          <Route
            path="/patient"
            element={
              <RequireStaff>
                <PatientEntry />
              </RequireStaff>
            }
          />
          <Route path="/consent" element={<ConsentPortal />} />
          <Route path="/manual" element={<Manual />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </AuthProvider>
  );
}
