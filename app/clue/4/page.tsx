"use client";

import { useEffect, useState } from "react";

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  prompt: string;
  choices: Choice[];
  correct: string;
  success: string;
};

export default function Clue4() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(7);

  const [penaltySeconds, setPenaltySeconds] = useState(0);

  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [wrong, setWrong] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  async function loadQuestion() {
    try {
      const res = await fetch("/api/clue4", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to load Clue 4.");
        return;
      }

      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setPenaltySeconds(data.penaltySeconds ?? 0);
    } catch {
      setError("Connection error while loading Clue 4.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseAnswer(choiceId: string) {
    if (!question || answering || finished) {
      return;
    }

    setAnswering(true);
    setError("");
    setMessage("");
    setWrong(false);

    try {
      const res = await fetch("/api/clue4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
          choiceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to process your answer.");
        setAnswering(false);
        return;
      }

      /*
       * WRONG ANSWER
       * The question stays on screen.
       * A one-minute penalty is added.
       */
      if (!data.correct) {
        setWrong(true);
        setMessage(data.message);
        setPenaltySeconds(data.penaltySeconds ?? penaltySeconds);
        setAnswering(false);
        return;
      }

      /*
       * CORRECT ANSWER
       */
      setMessage(data.message ?? "CORRECT.");

      /*
       * FINAL QUESTION
       * The API has already changed the team's
       * currentStage from CLUE_4 to CLUE_5.
       */
      if (data.final) {
        setFinished(true);

        setTimeout(() => {
          window.location.href = "/clue/5";
        }, 2200);

        return;
      }

      /*
       * Move to the next question after a short delay.
       */
      setTimeout(() => {
        setQuestion(data.nextQuestion);
        setQuestionNumber(data.nextQuestionNumber);

        setMessage("");
        setWrong(false);
        setAnswering(false);
      }, 1400);
    } catch {
      setError("Connection error. Please try again.");
      setAnswering(false);
    }
  }

  const penaltyMinutes = Math.floor(penaltySeconds / 60);
  const penaltyRemainder = penaltySeconds % 60;

  return (
    <main className="hunt-shell">
      <section className="panel">
        {/* HEADER */}

        <div className="eyebrow">
          Clue 4 · The Investigator&apos;s Code
        </div>

        <h1 className="title">
          THE INVESTIGATOR IS WAITING.
        </h1>

        <p className="body-copy">
          Seven prompts. Seven fragments.
          <br />
          Decode what the investigator is trying to tell you.
        </p>

        {/* PROGRESS / PENALTY */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              PROGRESS
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {questionNumber} / {totalQuestions}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{
                  width: `${
                    (questionNumber / totalQuestions) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              PENALTY
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              +{penaltyMinutes}:
              {String(penaltyRemainder).padStart(2, "0")}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              Each incorrect answer adds one minute.
            </div>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
            <div className="text-sm tracking-[0.25em] text-zinc-400">
              THE INVESTIGATOR IS PREPARING YOUR PROMPT...
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mt-8 rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-red-300">
            {error}
          </div>
        )}

        {/* QUESTION */}

        {question && !loading && !finished && (
          <>
            <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-7">
              <div className="text-xs tracking-[0.3em] text-zinc-500">
                PROMPT {questionNumber}
              </div>

              <div className="mt-6 whitespace-pre-line text-lg leading-8 text-zinc-100">
                {question.prompt}
              </div>
            </div>

            {/* ANSWERS */}

            <div className="mt-6 grid gap-3">
              {question.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  disabled={answering}
                  onClick={() => chooseAnswer(choice.id)}
                  className={[
                    "w-full rounded-xl border p-5 text-left",
                    "transition duration-200",
                    "border-white/10 bg-black/20",
                    "hover:border-white/20 hover:bg-white/10",
                    "active:scale-[0.99]",
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
              ))}
            </div>
          </>
        )}

        {/* ANSWERING */}

        {answering && !finished && (
          <div className="mt-6 text-center text-xs tracking-[0.3em] text-zinc-500">
            THE INVESTIGATOR IS LISTENING...
          </div>
        )}

        {/* RESPONSE */}

        {message && !finished && (
          <div
            className={[
              "mt-7 whitespace-pre-line rounded-2xl border p-6",
              "text-center font-bold tracking-wide",
              wrong
                ? "border-red-400/20 bg-red-500/10 text-red-300"
                : "border-white/10 bg-white/5 text-white",
            ].join(" ")}
          >
            {message}
          </div>
        )}

        {/* FINISHED */}

        {finished && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
            <div className="text-xs tracking-[0.3em] text-zinc-500">
              INVESTIGATION COMPLETE
            </div>

            <h2 className="mt-4 text-3xl font-black text-white">
              FIND THE BLACK BOOK.
            </h2>

            <p className="mt-4 whitespace-pre-line text-zinc-400">
              {message}
            </p>

            <div className="mt-8 text-xs tracking-[0.3em] text-zinc-600">
              MOVING TO THE NEXT CLUE...
            </div>
          </div>
        )}
      </section>
    </main>
  );
}