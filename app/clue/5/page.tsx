"use client";

import { useEffect, useState } from "react";

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  question: string;
  choices: Choice[];
};

type ApiResponse = {
  complete?: boolean;
  won?: boolean;
  lost?: boolean;

  question?: Question;

  correct?: boolean;

  message?: string;
  location?: string;

  locations?: string[];

  correctCount?: number;
  wrongCount?: number;
  remainingAttempts?: number;

  nextQuestion?: Question;

  error?: string;
};

export default function Clue5() {
  const [question, setQuestion] = useState<Question | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  const [locations, setLocations] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const [complete, setComplete] = useState(false);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);

  const [pendingNextQuestion, setPendingNextQuestion] =
    useState<Question | null>(null);

  useEffect(() => {
    loadQuestion();
  }, []);

  async function loadQuestion() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/clue5", {
        method: "GET",
        cache: "no-store",
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to load Clue 5.");
        return;
      }

      setCorrectCount(data.correctCount ?? 0);
      setWrongCount(data.wrongCount ?? 0);
      setRemainingAttempts(data.remainingAttempts ?? 3);

      if (data.locations) {
        setLocations(data.locations);
      }

      if (data.complete) {
        setComplete(true);
        setWon(Boolean(data.won));
        setLost(Boolean(data.lost));
        return;
      }

      setQuestion(data.question ?? null);
    } catch {
      setError("Connection error while loading Clue 5.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseAnswer(choiceId: string) {
    if (!question || answering || complete) {
      return;
    }

    setAnswering(true);
    setError("");
    setMessage("");
    setLastCorrect(null);
    setPendingNextQuestion(null);

    try {
      const res = await fetch("/api/clue5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
          choiceId,
        }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to process your answer.");
        setAnswering(false);
        return;
      }

      setCorrectCount(data.correctCount ?? correctCount);
      setWrongCount(data.wrongCount ?? wrongCount);
      setRemainingAttempts(
        data.remainingAttempts ?? remainingAttempts
      );

      setLastCorrect(Boolean(data.correct));
      setMessage(data.message ?? "");

      if (data.locations) {
        setLocations(data.locations);
      }

      /*
       * Investigation finished.
       */
      if (data.complete) {
        setComplete(true);
        setWon(Boolean(data.won));
        setLost(Boolean(data.lost));
        setAnswering(false);
        return;
      }

      /*
       * Keep the next question hidden until the user
       * presses NEXT.
       */
      setPendingNextQuestion(data.nextQuestion ?? null);

      setAnswering(false);
    } catch {
      setError("Connection error. Please try again.");
      setAnswering(false);
    }
  }

  function nextQuestion() {
    if (!pendingNextQuestion) {
      return;
    }

    setQuestion(pendingNextQuestion);
    setPendingNextQuestion(null);

    setMessage("");
    setLastCorrect(null);
  }

  if (loading) {
    return (
      <main className="hunt-shell">
        <section className="panel">
          <div className="mt-20 text-center">
            <div className="eyebrow">
              Clue 5 · The Hidden Trail
            </div>

            <h1 className="title mt-4">
              THE TRAIL IS BEING REVEALED...
            </h1>

            <p className="body-copy mt-5">
              Somewhere in this room, three fragments are waiting.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * END SCREEN
   */
  if (complete) {
    return (
      <main className="hunt-shell">
        <section className="panel">
          <div className="eyebrow">
            Clue 5 · Investigation Complete
          </div>

          {won ? (
            <>
              <h1 className="title mt-4">
                THE TRAIL HAS BEEN REVEALED.
              </h1>

              <p className="body-copy mt-5">
                Three answers aligned.
                <br />
                The room now holds three places worth searching.
              </p>
            </>
          ) : (
            <>
              <h1 className="title mt-4">
                THE TRAIL ENDS HERE.
              </h1>

              <p className="body-copy mt-5">
                No attempts remain.
                <br />
                Now rely on yourself to figure out the mystery.
              </p>
            </>
          )}

          {locations.length > 0 && (
            <div className="mt-10 grid gap-4">
              {locations.map(
                (location: string, index: number) => (
                  <div
                    key={`${location}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/30 p-6"
                  >
                    <div className="text-xs tracking-[0.3em] text-zinc-500">
                      FRAGMENT {index + 1}
                    </div>

                    <p className="mt-3 text-lg leading-8 text-zinc-100">
                      {location}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-xs tracking-[0.3em] text-zinc-500">
              INVESTIGATION CLOSED
            </div>

            <h2 className="mt-4 text-2xl font-black text-white">
              HOPE FOR THE BEST.
            </h2>

            <p className="mt-3 text-zinc-400">
              Believe in the trail you have uncovered.
              <br />
              The final decision now rests beyond this page.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">
          Clue 5 · The Hidden Dragon
        </div>

        <h1 className="title mt-4">
          THREE SIGNALS.
        </h1>

        <p className="body-copy mt-5">
          Ten questions stand between you and the trail.
          <br />
          Three correct answers reveal three fragments.
          <br />
          Three mistakes end the investigation.
        </p>

        {/* SCORE */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              SIGNALS FOUND
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {correctCount} / 3
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              MISTAKES
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {wrongCount} / 3
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              ATTEMPTS LEFT
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {remainingAttempts}
            </div>
          </div>
        </div>

        {/* LOCATION FRAGMENTS */}
        {locations.length > 0 && (
          <div className="mt-8">
            <div className="text-xs tracking-[0.3em] text-zinc-500">
              DISCOVERED FRAGMENTS
            </div>

            <div className="mt-4 grid gap-3">
              {locations.map(
                (location: string, index: number) => (
                  <div
                    key={`${location}-${index}`}
                    className="rounded-xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="text-xs font-bold tracking-[0.25em] text-zinc-500">
                      FRAGMENT {index + 1}
                    </div>

                    <div className="mt-2 text-zinc-200">
                      {location}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-red-300">
            {error}
          </div>
        )}

        {/* QUESTION */}
        {question && (
          <div className="mt-10">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-7">
              <div className="text-xs tracking-[0.3em] text-zinc-500">
                QUESTION
              </div>

              <h2 className="mt-5 text-xl font-bold leading-8 text-white">
                {question.question}
              </h2>
            </div>

            <div className="mt-5 grid gap-3">
              {question.choices.map(
                (choice: Choice, index: number) => (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={answering || Boolean(pendingNextQuestion)}
                    onClick={() => chooseAnswer(choice.id)}
                    className={[
                      "w-full rounded-xl border p-5 text-left",
                      "transition duration-200",
                      "border-white/10 bg-black/20",
                      "hover:border-white/20 hover:bg-white/10",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-bold text-zinc-400">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span className="text-zinc-200">
                        {choice.text}
                      </span>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* RESPONSE */}
        {message && (
          <div
            className={[
              "mt-7 rounded-2xl border p-6 text-center",
              lastCorrect
                ? "border-white/10 bg-white/5 text-white"
                : "border-red-400/20 bg-red-500/10 text-red-300",
            ].join(" ")}
          >
            <p className="font-bold tracking-wide">
              {message}
            </p>

            {!lastCorrect && remainingAttempts > 0 && (
              <p className="mt-3 text-sm text-zinc-400">
                Choose a different question. This one will not return.
              </p>
            )}
          </div>
        )}

        {/* NEXT BUTTON */}
        {pendingNextQuestion && !complete && (
          <button
            type="button"
            onClick={nextQuestion}
            className="button mt-7 w-full"
          >
            NEXT
          </button>
        )}
      </section>
    </main>
  );
}