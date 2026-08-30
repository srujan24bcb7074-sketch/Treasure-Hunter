"use client";

import { useEffect, useState } from "react";

type Answer = "YES" | "NO";

type Question = {
  id: number;
  text: string;
};

type Selection = {
  questionId: number;
  question: string;
  answer: Answer;
};

function shuffleQuestions(questions: Question[]) {
  const shuffled = [...questions];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

const QUESTIONS: Question[] = [
  { id: 1, text: "Is the character male?" },
  { id: 2, text: "Can the character transform into different forms?" },
  { id: 3, text: "Is the character associated with a clan?" },
  { id: 4, text: "Does the character have a signature technique or special move?" },
  {
    id: 5,
    text: "Does the character possess a special power that ordinary humans don't normally have?",
  },
  {
    id: 6,
    text: "Has the character's appearance changed significantly throughout their journey?",
  },
  {
    id: 7,
    text: "Has the character eventually held an important position of leadership?",
  },
  { id: 8, text: "Is the character primarily known for fighting with a sword?" },
  { id: 9, text: "Is the character a member of a pirate crew?" },
  {
    id: 10,
    text: "Does the character rely primarily on firearms as their main form of combat?",
  },
  {
    id: 11,
    text: "Is the character primarily associated with using a mechanical or technological weapon?",
  },
  {
    id: 12,
    text: "Is the character primarily known for using magic spells as their main ability?",
  },
];

export default function Clue2() {
  const [questions] = useState<Question[]>(() => shuffleQuestions(QUESTIONS));
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [guess, setGuess] = useState("");
  const [guessing, setGuessing] = useState(false);
  const [guessMessage, setGuessMessage] = useState("");
  const [solved, setSolved] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/clue2", { method: "GET" });
        const data = await res.json();

        if (res.ok && Array.isArray(data.selections)) {
          setSelections(data.selections);
        } else if (!res.ok) {
          setError(data.error ?? "Unable to load your Clue 2 progress.");
        }
      } catch {
        setError("Connection error while loading Clue 2.");
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, []);

  async function selectQuestion(id: number) {
  if (
    loadingId !== null ||
    solved ||
    selections.some((item) => item.questionId === id) ||
    selections.length >= 5
  ) {
    return;
  }

  setLoadingId(id);
  setError("");
  setGuessMessage("");

  try {
    const res = await fetch("/api/clue2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Unable to reveal the answer.");
      return;
    }

    if (!data.answer) {
      setError("The answer was not returned by the server.");
      return;
    }

    // Add the newly revealed answer immediately.
    setSelections((current) => [
      ...current,
      {
        questionId: id,
        question:
          QUESTIONS.find((q) => q.id === id)?.text ?? "Unknown question",
        answer: data.answer,
      },
    ]);
  } catch (err) {
    console.error(err);
    setError("Connection error. Please try again.");
  } finally {
    setLoadingId(null);
  }
}

  async function submitGuess() {
    const trimmed = guess.trim();
    if (!trimmed || guessing || solved || selections.length < 5) return;

    setGuessing(true);
    setError("");
    setGuessMessage("");

    try {
      const res = await fetch("/api/clue2/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to check the guess.");
        return;
      }

      if (data.correct) {
        setSolved(true);
        setGuessMessage("THE SHADOW HAS BEEN IDENTIFIED.");
        setTimeout(() => {
          window.location.href = "/clue/3";
        }, 1600);
      } else {
        setGuessMessage("THE SHADOW REMAINS HIDDEN. TRY AGAIN.");
        setGuess("");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setGuessing(false);
    }
  }

  const selectedIds = new Set(selections.map((item) => item.questionId));

  return (
    <main className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">Clue 2 · Illuminate the Right Shadow</div>

        <h1 className="title">THE SHADOW AWAITS.</h1>

        <p className="body-copy">
          Twelve questions stand before you. Choose <strong>only five</strong>.
          Each chosen question will reveal one fragment of the hidden
          character&apos;s identity.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-400">QUESTIONS CHOSEN</span>
            <span className="text-2xl font-black text-white">
              {selections.length} / 5
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${(selections.length / 5) * 100}%` }}
            />
          </div>
        </div>

        {loadingHistory ? (
          <div className="mt-8 text-center text-zinc-400">
            REVEALING THE QUESTIONS...
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {questions.map((q) => {
              const selection = selections.find(
                (item) => item.questionId === q.id
              );
              const isSelected = selectedIds.has(q.id);
              const disabled =
                isSelected ||
                selections.length >= 5 ||
                loadingId !== null ||
                solved;

              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectQuestion(q.id)}
                  className={[
                    "w-full rounded-xl border p-4 text-left transition",
                    isSelected
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5",
                    disabled && !isSelected ? "cursor-not-allowed opacity-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-bold text-zinc-400">
                      {q.id}
                    </span>

                    <span className="flex-1 text-zinc-200">{q.text}</span>

                    {selection ? (
  <span className="shrink-0 rounded-lg border border-white/10 px-3 py-1 text-sm font-black tracking-widest text-white">
    {selection.answer}
  </span>
) : loadingId === q.id ? (
  <span className="shrink-0 text-xs tracking-widest text-zinc-400">
    REVEALING...
  </span>
) : null}

                    {loadingId === q.id && (
                      <span className="shrink-0 text-xs tracking-widest text-zinc-400">
                        REVEALING...
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="mt-5 text-center text-red-300">{error}</p>}

        {selections.length === 5 && !solved && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-7">
            <div className="text-xs tracking-[0.3em] text-zinc-500">
              FIVE FRAGMENTS HAVE BEEN REVEALED
            </div>

            <h2 className="mt-3 text-2xl font-black text-white">
              WHO IS THE SHADOW?
            </h2>

            <p className="mt-2 text-zinc-400">
              Study the answers and identify the hidden character. You have
              unlimited guesses.
            </p>

            <div className="mt-5 flex gap-3">
              <input
                className="input"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitGuess();
                }}
                placeholder="Enter the character's name"
                disabled={guessing}
              />

              <button
                className="button shrink-0"
                onClick={submitGuess}
                disabled={!guess.trim() || guessing}
              >
                {guessing ? "CHECKING..." : "SUBMIT"}
              </button>
            </div>

            {guessMessage && (
              <p className="mt-4 text-center font-bold tracking-wide text-white">
                {guessMessage}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
