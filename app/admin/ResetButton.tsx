"use client";

import { useState } from "react";

export default function ResetButton() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resetTeams() {
    setError("");
    setMessage("");

    if (confirmation !== "RESET ALL TEAMS") {
      setError("Type exactly: RESET ALL TEAMS");
      return;
    }

    if (!resetKey.trim()) {
      setError("Enter the admin reset key.");
      return;
    }

    const confirmed = window.confirm(
      "FINAL WARNING: This will permanently delete all team and hunt data. Continue?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation,
          resetKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }

      setMessage(data.message ?? "Reset complete.");

      setConfirmation("");
      setResetKey("");
      setOpen(false);

      /*
       * Refresh the admin dashboard so the deleted teams
       * disappear immediately.
       */
      window.location.reload();
    } catch {
      setError("Connection error while resetting the teams.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-red-400/20 bg-red-500/5 p-6">
      <div className="text-xs font-bold tracking-[0.3em] text-red-300">
        DANGER ZONE
      </div>

      <h2 className="mt-2 text-2xl font-black text-white">
        RESET HUNT DATA
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
        This permanently removes all registered teams and their associated
        hunt data. Your Prisma tables, schema, and application code remain
        intact.
      </p>

      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError("");
            setMessage("");
          }}
          className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 font-bold text-red-200 transition hover:bg-red-500/20"
        >
          OPEN RESET CONTROLS
        </button>
      )}

      {open && (
        <div className="mt-6 rounded-xl border border-red-400/20 bg-black/30 p-5">
          <div className="text-sm font-bold text-red-200">
            This cannot be undone.
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Type <strong className="text-zinc-300">RESET ALL TEAMS</strong> to
            continue.
          </p>

          <input
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="RESET ALL TEAMS"
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-red-400/50"
            disabled={loading}
          />

          <p className="mt-4 text-sm text-zinc-500">
            Enter the private admin reset key.
          </p>

          <input
            type="password"
            value={resetKey}
            onChange={(event) => setResetKey(event.target.value)}
            placeholder="Admin reset key"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-red-400/50"
            disabled={loading}
          />

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-green-400/20 bg-green-500/10 p-4 text-sm text-green-300">
              {message}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetTeams}
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "RESETTING..." : "DELETE ALL TEAM DATA"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
                setResetKey("");
                setError("");
              }}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </section>
  );
}