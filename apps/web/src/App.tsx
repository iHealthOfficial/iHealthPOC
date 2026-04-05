import { Link, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Manual from "./pages/Manual";
import PatientEntry from "./pages/PatientEntry";
import Patients from "./pages/Patients";
import Upload from "./pages/Upload";

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "active" : undefined;
}

export default function App() {
  return (
    <div className="layout">
      <header className="nav">
        <Link to="/" className="brand">
          <span>i</span>Health
        </Link>
        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        <NavLink to="/upload" className={navClass}>
          Upload
        </NavLink>
        <NavLink to="/patients" className={navClass}>
          Patients
        </NavLink>
        <NavLink to="/patient" className={navClass}>
          Patient entry
        </NavLink>
        <NavLink to="/manual" className={navClass}>
          Manual
        </NavLink>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patient" element={<PatientEntry />} />
        <Route path="/manual" element={<Manual />} />
      </Routes>
    </div>
  );
}
