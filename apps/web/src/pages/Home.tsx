import { Link } from "react-router-dom";

function FeatureIconDb() {
  return (
    <div className="home-card-icon home-card-icon--teal" aria-hidden>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    </div>
  );
}

function FeatureIconDownload() {
  return (
    <div className="home-card-icon home-card-icon--blue" aria-hidden>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </div>
  );
}

function FeatureIconShield() {
  return (
    <div className="home-card-icon home-card-icon--cyan" aria-hidden>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  );
}

function CheckIcon({ tone }: { tone: "teal" | "blue" | "cyan" }) {
  return (
    <div className={`home-managed-check home-managed-check--${tone}`} aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1 className="home-heading-xl">Comprehensive Patient Data Management</h1>
          <p className="home-body home-hero-text">
            A secure, centralized platform designed to streamline patient record management, enabling healthcare
            providers to store, access, and share patient data efficiently while maintaining compliance with industry
            standards.
          </p>
          <div className="home-hero-actions">
            <Link to="/upload" className="btn">
              Upload
            </Link>
            <Link to="/patients" className="btn btn-ghost">
              Patient Directory
            </Link>
            <Link to="/patient" className="btn btn-ghost">
              Manual Patient Entry
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-features">
        <div className="home-section-inner home-features-grid">
          <article className="home-feature-card">
            <FeatureIconDb />
            <h2 className="home-heading-card">Secure Data Storage</h2>
            <p className="home-body">
              Patient records are stored securely with end-to-end encryption, ensuring data privacy and compliance with
              HIPAA regulations.
            </p>
          </article>
          <article className="home-feature-card">
            <FeatureIconDownload />
            <h2 className="home-heading-card">FHIR Format Export</h2>
            <p className="home-body">
              Export patient data in FHIR (Fast Healthcare Interoperability Resources) format for seamless integration
              with other healthcare systems.
            </p>
          </article>
          <article className="home-feature-card">
            <FeatureIconShield />
            <h2 className="home-heading-card">Compliance Ready</h2>
            <p className="home-body">
              Built with healthcare compliance in mind, supporting audit trails, access controls, and data retention
              policies.
            </p>
          </article>
        </div>
      </section>

      <section className="home-section home-managed">
        <div className="home-section-inner">
          <h2 className="home-heading-section">How Patient Data is Managed</h2>
          <ul className="home-managed-list">
            <li className="home-managed-card">
              <CheckIcon tone="teal" />
              <div>
                <h3 className="home-heading-row">Centralized Patient Records</h3>
                <p className="home-body">
                  All patient information including demographics, medical history, medications, allergies, and treatment
                  plans are stored in a unified, easily accessible database.
                </p>
              </div>
            </li>
            <li className="home-managed-card">
              <CheckIcon tone="blue" />
              <div>
                <h3 className="home-heading-row">Real-Time Data Access</h3>
                <p className="home-body">
                  Healthcare providers can access up-to-date patient information instantly, enabling faster
                  decision-making and improved patient care.
                </p>
              </div>
            </li>
            <li className="home-managed-card">
              <CheckIcon tone="cyan" />
              <div>
                <h3 className="home-heading-row">Interoperability via FHIR</h3>
                <p className="home-body">
                  Export patient data in FHIR-compliant format to share with external systems, laboratories,
                  specialists, and insurance providers with standardized data exchange.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
