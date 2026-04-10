import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { IconFileText, IconHome, IconUpload, IconUserPlus, IconUsers } from "./components/NavIcons";
import Home from "./pages/Home";
import Manual from "./pages/Manual";
import PatientEntry from "./pages/PatientEntry";
import PatientSummary from "./pages/PatientSummary";
import Patients from "./pages/Patients";
import Upload from "./pages/Upload";

function navTabClass(base: string) {
  return ({ isActive }: { isActive: boolean }) =>
    ["nav-tab", base, isActive ? "nav-tab--active" : ""].filter(Boolean).join(" ");
}

export default function App() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isPatientEntry = pathname === "/patient";
  const isPatientSummary = pathname.startsWith("/patient/summary/");

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
            <NavLink to="/patients" className={navTabClass("nav-tab--directory")}>
              <IconUsers className="nav-tab-icon" />
              <span>Patient Directory</span>
            </NavLink>
            <NavLink to="/patient" className={navTabClass("nav-tab--manual-entry")}>
              <IconUserPlus className="nav-tab-icon" />
              <span>Manual Patient Entry</span>
            </NavLink>
            <NavLink to="/manual" className={navTabClass("nav-tab--about")}>
              <IconFileText className="nav-tab-icon" />
              <span>About the Platform</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <main
        className={
          isHome || isPatientEntry || isPatientSummary ? "site-main site-main--flush" : "site-main site-main--sheet"
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patient/summary/:id" element={<PatientSummary />} />
          <Route path="/patient" element={<PatientEntry />} />
          <Route path="/manual" element={<Manual />} />
        </Routes>
      </main>
    </div>
  );
}
