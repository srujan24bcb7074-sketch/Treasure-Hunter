"use client";

import { useState } from "react";

type DeclareWinnerButtonProps = {
  teamId: string;
  teamName: string;
  disabled?: boolean;
};

export default function DeclareWinnerButton({
  teamId,
  teamName,
  disabled = false,
}: DeclareWinnerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState("");

  async function declareWinner() {
    const confirmed = window.confirm(
      `Declare "${teamName}" as the winner?\n\nThis will mark this team as WINNER.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to declare winner.");
      }

      setDeclared(true);

      window.location.reload();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to declare winner."
      );
    } finally {
      setLoading(false);
    }
  }

  if (declared || disabled) {
    return (
      <div className="inline-flex rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300">
        WINNER
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={declareWinner}
        disabled={loading}
        className="inline-flex rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "DECLARING..." : "DECLARE WINNER"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}