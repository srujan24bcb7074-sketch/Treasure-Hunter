"use client";

import { useState } from "react";

export default function Clue1() {
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
  const normalized = answer.toLowerCase().replace(/\s+/g, "");

  if (normalized === "strawhat") {
    setMessage(
      "Correct. The first piece has been found. Search where hats gather. Only one carries the path forward."
    );

    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "CLUE_1",
        action: "COMPLETED",
      }),
    });

    if (!res.ok) {
      setMessage("The answer is correct, but the path could not be advanced.");
      return;
    }

    setTimeout(() => {
      window.location.href = "/clue/2";
    }, 1500);
  } else {
    setMessage("That answer does not unlock the path. Try again.");
  }
}

  return (
    <div className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">Clue 1 · The Missing Piece</div>
        <h1 className="title">THE MISSING PIECE</h1>

        <div className="body-copy space-y-3">
          <p>I bear the sun, and the sun bears me.</p>
          <p>I am not a crown, yet I mark a king.</p>
          <p>I am not a treasure, yet my worth is more than gold.</p>
          <p>To some I am hope, to others I am freedom.</p>
          <p>I have travelled across countless seas, and witnessed countless battles.</p>
          <p>Passed from one dreamer to another, I carry a will that never wavers.</p>
        </div>

        <div className="mt-8 flex gap-3">
          <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter your answer..." />
          <button className="button shrink-0" onClick={submit}>SUBMIT</button>
        </div>
        {message && <p className="mt-5 text-zinc-200">{message}</p>}
      </section>
    </div>
  );
}
