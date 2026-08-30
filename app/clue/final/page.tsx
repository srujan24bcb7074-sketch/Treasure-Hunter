"use client";

import { useEffect, useState } from "react";

export default function FinalPage() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((current) => {
        if (current.length >= 3) return "";
        return current + ".";
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="hunt-shell min-h-screen">
      <section className="panel flex min-h-[75vh] flex-col items-center justify-center text-center">
        <div className="eyebrow">
          Investigation Complete
        </div>

        <h1 className="title mt-6">
          THE PROCEDURE IS COMPLETE.
        </h1>

        <div className="mt-10 max-w-2xl">
          <p className="text-lg leading-8 text-zinc-300">
            You have followed the clues.
            <br />
            You have uncovered what was hidden.
            <br />
            You have done what was asked of you.
          </p>

          <div className="my-10 h-px bg-white/10" />

          <p className="text-xl font-semibold leading-9 text-white">
            Hope for the best.
            <br />
            Believe in what you have done.
          </p>

          <p className="mt-8 text-base leading-7 text-zinc-500">
            The investigation is now out of your hands.
            <br />
            The final verdict belongs to the investigators.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-black/30 px-8 py-6">
          <div className="text-xs tracking-[0.3em] text-zinc-600">
            AWAITING VERDICT
          </div>

          <div className="mt-4 text-sm tracking-[0.2em] text-zinc-400">
            THE OTHER SIDE IS WATCHING{dots}
          </div>
        </div>

        <p className="mt-10 text-xs tracking-[0.25em] text-zinc-700">
          DO NOT LEAVE THIS PAGE
        </p>
      </section>
    </main>
  );
}