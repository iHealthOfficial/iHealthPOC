import { FormEvent, useState } from "react";
import { api } from "../api";

type FeedbackKind = "bug" | "suggestion";

export default function Feedback() {
  const [kind, setKind] = useState<FeedbackKind>("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [successAt, setSuccessAt] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccessAt(null);
    const t = title.trim();
    const d = description.trim();
    if (!t) {
      setErr("Title is required.");
      return;
    }
    if (!d) {
      setErr("Description is required.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api<{ createdAt?: string }>("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ kind, title: t, description: d }),
      });
      setSuccessAt(data.createdAt ?? new Date().toISOString());
      setTitle("");
      setDescription("");
    } catch (x) {
      let msg = x instanceof Error ? x.message : "Something went wrong";
      try {
        const j = JSON.parse(msg) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        /* plain text */
      }
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="feedback-page">
      <div className="feedback-inner">
        <h1 className="feedback-title">Feedback</h1>
        <p className="feedback-lead">
          Report a bug or share a suggestion. Your message is stored with your account and a timestamp for the platform team.
        </p>

        <form className="feedback-form" onSubmit={handleSubmit} noValidate>
          <div className="feedback-kind" role="group" aria-labelledby="feedback-kind-label">
            <p id="feedback-kind-label" className="feedback-kind-legend">
              Type
            </p>
            <label className="feedback-kind-option">
              <input
                type="radio"
                name="kind"
                value="suggestion"
                checked={kind === "suggestion"}
                onChange={() => setKind("suggestion")}
                disabled={submitting}
              />
              <span>Suggestion</span>
            </label>
            <label className="feedback-kind-option">
              <input
                type="radio"
                name="kind"
                value="bug"
                checked={kind === "bug"}
                onChange={() => setKind("bug")}
                disabled={submitting}
              />
              <span>Bug report</span>
            </label>
          </div>

          <label className="feedback-field">
            <span className="feedback-label">Title</span>
            <input
              className="feedback-input"
              type="text"
              name="title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              disabled={submitting}
              autoComplete="off"
            />
          </label>

          <label className="feedback-field">
            <span className="feedback-label">Description</span>
            <textarea
              className="feedback-textarea"
              name="description"
              rows={6}
              maxLength={8000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, steps to reproduce, or ideas…"
              disabled={submitting}
            />
          </label>

          {err && (
            <p className="feedback-err" role="alert">
              {err}
            </p>
          )}
          {successAt && (
            <p className="feedback-success" role="status">
              Thank you. Submitted at{" "}
              <time dateTime={successAt}>
                {new Date(successAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
              .
            </p>
          )}

          <button type="submit" className="btn feedback-submit" disabled={submitting}>
            {submitting ? "Sending…" : "Submit feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
