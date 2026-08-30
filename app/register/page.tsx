"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [count, setCount] = useState(2);
  const [teamName, setTeamName] = useState("");
  const [names, setNames] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function resizeNames(n: number) {
    setCount(n);
    setNames((old) => Array.from({ length: n }, (_, i) => old[i] ?? ""));
  }

  async function submit() {
    setError("");
    if (!teamName.trim() || names.some((n) => !n.trim())) {
      setError("Enter a team name and every crew member name.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName, names }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Unable to create team.");
      setLoading(false);
      return;
    }

    //localStorage.setItem("hunt_session", data.sessionToken);
    router.push("/clue/1");
  }

  return (
    <div className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">Crew Registration</div>
        <h1 className="text-4xl font-black mt-2 mb-8">WHO WILL TAKE THE HUNT?</h1>

        <label className="block mb-5">
          <span className="block mb-2 text-sm text-zinc-300">Team name</span>
          <input className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        </label>

        <label className="block mb-6">
          <span className="block mb-2 text-sm text-zinc-300">Number of crew members</span>
          <select className="select" value={count} onChange={(e) => resizeNames(Number(e.target.value))}>
            {[1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <div className="grid gap-4">
          {names.map((name, i) => (
            <label key={i}>
              <span className="block mb-2 text-sm text-zinc-300">Crew Member {i + 1}</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setNames((old) => old.map((v, j) => j === i ? e.target.value : v))}
              />
            </label>
          ))}
        </div>

        {error && <p className="mt-5 text-red-300">{error}</p>}

        <button className="button mt-8" disabled={loading} onClick={submit}>
          {loading ? "CREATING CREW..." : "ENTER THE HUNT"}
        </button>
      </section>
    </div>
  );
}
