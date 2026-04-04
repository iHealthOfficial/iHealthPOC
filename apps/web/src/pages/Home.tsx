import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <h1>Clinical data intake</h1>
      <p className="lead">
        Upload documents, capture patient demographics and FHIR-aligned clinical
        facts (labs as Observation, vitals as Observation, diagnoses as
        Condition), and browse the product manual served from this repository.
      </p>
      <div className="card">
        <h2>Get started</h2>
        <p className="lead" style={{ marginBottom: "1rem" }}>
          Everything runs locally with SQLite and disk storage—no cloud spend for
          development.
        </p>
        <Link to="/upload" className="btn">
          Upload a file
        </Link>{" "}
        <Link to="/patient" className="btn btn-ghost">
          Enter patient data
        </Link>
      </div>
    </>
  );
}
