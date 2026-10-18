"use client";

import { FormEvent, useState } from "react";

const CONFIRMATION = "DELETE";

export function DeleteAccountPanel() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your account could not be deleted.");
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your account could not be deleted.");
      setLoading(false);
    }
  }

  return (
    <section className="panel mt-10 border-red-400/30 p-7 sm:p-8" aria-labelledby="delete-account-title">
      <h2 id="delete-account-title" className="text-xl font-semibold">Delete account</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Permanently removes your profile, photo, resume, posts, comments, likes, group messages, the groups you created and your profile-view history. This cannot be undone.{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-ink">What gets deleted</a>
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="secondary-button mt-6 !border-red-400/50 !text-red-300">
          Delete my account
        </button>
      ) : (
        <form onSubmit={submit} className="mt-6 max-w-md">
          <label htmlFor="delete-confirmation" className="field-label">
            Type {CONFIRMATION} to confirm
          </label>
          <input
            id="delete-confirmation"
            className="text-field"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            disabled={loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "delete-account-error" : undefined}
          />
          {error && <p id="delete-account-error" role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || confirmation !== CONFIRMATION}
              className="primary-button !bg-red-500 !bg-none !text-white disabled:opacity-50"
            >
              {loading ? "Deleting…" : "Permanently delete"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setConfirmation(""); setError(""); }} disabled={loading} className="secondary-button">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
