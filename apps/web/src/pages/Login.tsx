import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import BubbleBackground from "../components/BubbleBackground";

type Mode = "login" | "signup";

/** Avoid relying on `type="email"` built‑in validation (mobile browsers can show “pattern” errors for some addresses). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isHydrating } = useAuth();

  useEffect(() => {
    if (!isHydrating && isAuthenticated) navigate("/", { replace: true });
  }, [isHydrating, isAuthenticated, navigate]);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (!password) {
      setMessage("Password is required.");
      return;
    }
    if (mode === "signup" && !confirmPassword) {
      setMessage("Confirm your password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password, displayName.trim() || undefined);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <BubbleBackground />
      <div className="auth-split">
        <aside className="auth-panel auth-panel--left" aria-label="Promotional area">
          <div className="auth-left-placeholder">
            <p className="auth-left-placeholder-label">Illustration</p>
            <p className="auth-left-placeholder-hint">Artwork coming later</p>
          </div>
        </aside>

        <div className="auth-panel auth-panel--right">
          <div className="auth-panel-inner">
            <div className="auth-brand-block">
              <h1 className="auth-title">iHealth Hub</h1>
              <p className="auth-subtitle">Welcome to iHealth Hub</p>
            </div>

            <div className="auth-mode-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`auth-mode-tab${mode === "login" ? " auth-mode-tab--active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={`auth-mode-tab${mode === "signup" ? " auth-mode-tab--active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                }}
              >
                Create account
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {mode === "signup" && (
                <label className="auth-field">
                  <span className="auth-label">Display name</span>
                  <input
                    className="auth-input"
                    type="text"
                    name="displayName"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              )}
              <label className="auth-field">
                <span className="auth-label">Email</span>
                <input
                  className="auth-input"
                  type="text"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="auth-field">
                <span className="auth-label">Password</span>
                <input
                  className="auth-input"
                  type="password"
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              {mode === "signup" && (
                <label className="auth-field">
                  <span className="auth-label">Confirm password</span>
                  <input
                    className="auth-input"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>
              )}

              {message && (
                <p className="auth-form-message auth-form-message--err" role="alert">
                  {message}
                </p>
              )}

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="auth-switch">
              {mode === "login" ? (
                <>
                  New to iHealth Hub?{" "}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setMode("signup");
                      setMessage(null);
                    }}
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setMode("login");
                      setMessage(null);
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <section className="auth-contact" aria-label="Contact us" />

            <p className="auth-back">
              <Link to="/home">← Platform overview</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
