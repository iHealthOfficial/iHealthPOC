import { Link } from "react-router-dom";

const sections = [
  { id: "sign-in", title: "Sign in & roles" },
  { id: "upload", title: "Upload" },
  { id: "my-health", title: "My health data" },
  { id: "patients", title: "Patient Directory & entry" },
  { id: "consent", title: "Consent Portal" },
  { id: "feedback", title: "Feedback" },
  { id: "admin", title: "Admin" },
] as const;

export default function Manual() {
  return (
    <div className="platform-guide-page">
      <div className="platform-guide-inner">
        <header className="guide-hero">
          <h1 className="guide-hero-title">How to use this platform</h1>
          <p className="guide-hero-lead">
            Short guide to each area of iHealth Hub after you sign in. Use the list on the left to jump to a topic.
          </p>
        </header>

        <div className="guide-layout">
          <nav className="guide-toc" aria-label="On this page">
            <p className="guide-toc-label">On this page</p>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="guide-content">
            <section id="sign-in" className="guide-block">
              <h2 className="guide-block-title">Sign in & roles</h2>
              <p className="guide-block-text">
                Open the app and <strong>sign in</strong> or <strong>create an account</strong>. After login, you are taken to{" "}
                <strong>My health data</strong> (standard user) or the <strong>Admin</strong> dashboard (administrator accounts).
              </p>
              <p className="guide-block-text">
                <strong>Staff</strong> (and guests where enabled) can also open <strong>Patient Directory</strong> and{" "}
                <strong>Manual Patient Entry</strong> without linking a personal health record.
              </p>
            </section>

            <section id="upload" className="guide-block">
              <h2 className="guide-block-title">Upload</h2>
              <p className="guide-block-text">
                Use <Link to="/upload">Upload</Link> to add documents (for example PDFs or images) to the server. You can optionally
                attach a <strong>patient id</strong> (UUID) so the file is associated with a patient record.
              </p>
              <p className="guide-block-text">
                Each file is scanned locally when ClamAV is available, then text is extracted (OCR for images, embedded text for PDFs).
                Open <strong>Recent uploads</strong> to view status and extracted text.
              </p>
            </section>

            <section id="my-health" className="guide-block">
              <h2 className="guide-block-title">My health data</h2>
              <p className="guide-block-text">
                Signed-in users open <Link to="/my-health">My health data</Link> to link their account to a FHIR patient record using a{" "}
                <strong>patient UUID</strong> from their care team or administrator.
              </p>
              <p className="guide-block-text">
                Use the <strong>Add details</strong> tab for help finding your patient id. After linking, you can review your record
                summary according to your consent choices.
              </p>
            </section>

            <section id="patients" className="guide-block">
              <h2 className="guide-block-title">Patient Directory & Manual Patient Entry</h2>
              <p className="guide-block-text">
                <Link to="/patients">Patient Directory</Link> lists saved patients; open a row to view a read-only summary.
              </p>
              <p className="guide-block-text">
                <Link to="/patient">Manual Patient Entry</Link> is where staff enter or update clinical data (demographics, encounters,
                medications, and other FHIR-aligned sections), then save to the server.
              </p>
            </section>

            <section id="consent" className="guide-block">
              <h2 className="guide-block-title">Consent Portal</h2>
              <p className="guide-block-text">
                The <Link to="/consent">Consent Portal</Link> lets you choose which types of health data you allow the application to
                use when displaying your linked record. Preferences are saved to your account.
              </p>
            </section>

            <section id="feedback" className="guide-block">
              <h2 className="guide-block-title">Feedback</h2>
              <p className="guide-block-text">
                Signed-in users can use <Link to="/feedback">Feedback</Link> to send a <strong>bug report</strong> or{" "}
                <strong>suggestion</strong> with a title and description. Submissions are timestamped and associated with your account
                for the platform team.
              </p>
            </section>

            <section id="admin" className="guide-block">
              <h2 className="guide-block-title">Admin</h2>
              <p className="guide-block-text">
                Administrator accounts see <Link to="/admin">Admin</Link> for a dashboard summary and activity, plus notifications for
                user feedback. Access is limited to admin roles.
              </p>
            </section>

            <p className="guide-footer-note">
              For a marketing overview of the product, see <Link to="/home">Overview</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
