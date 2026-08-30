"use client";

import { useEffect, useMemo, useState } from "react";

type Tile = {
  id: string;
  src: string;
};

type Attempt = {
  imageRef: string;
  matched: boolean;
};

const TILES: Tile[] = [
  { id: "tile-01", src: "/clue3/tile-01.jpeg" },
  { id: "tile-02", src: "/clue3/tile-02.jpeg" },
  { id: "tile-03", src: "/clue3/tile-03.jpeg" },
  { id: "tile-04", src: "/clue3/tile-04.jpeg" },
  { id: "tile-05", src: "/clue3/tile-05.jpeg" },
  { id: "tile-06", src: "/clue3/tile-06.jpeg" },
  { id: "tile-07", src: "/clue3/tile-07.jpeg" },
  { id: "tile-08", src: "/clue3/tile-08.jpeg" },
  { id: "tile-09", src: "/clue3/tile-09.jpeg" },
];

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function Clue3() {
  const shuffledTiles = useMemo(() => shuffle(TILES), []);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadClue3() {
      try {
        const res = await fetch("/api/clue3");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Unable to load Clue 3.");
          return;
        }

        setAttempts(data.attempts ?? []);
        setPenaltySeconds(data.penaltySeconds ?? 0);
        setElapsedSeconds(data.effectiveElapsedSeconds ?? 0);
      } catch {
        setError("Connection error while loading Clue 3.");
      } finally {
        setLoading(false);
      }
    }

    loadClue3();
  }, []);

  useEffect(() => {
    if (loading || completed) return;

    const timer = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, completed]);

  async function chooseTile(tileId: string) {
    if (
      selectedTile ||
      completed ||
      attempts.some((attempt) => attempt.imageRef === tileId)
    ) {
      return;
    }

    setSelectedTile(tileId);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/clue3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageRef: tileId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to process that tile.");
        setSelectedTile(null);
        return;
      }

      const newAttempt: Attempt = {
        imageRef: tileId,
        matched: Boolean(data.matched),
      };

      setAttempts((current) => [...current, newAttempt]);
      setPenaltySeconds(data.penaltySeconds ?? 0);
      setElapsedSeconds(data.effectiveElapsedSeconds ?? 0);

      if (data.matched) {
        setCompleted(true);
        setMessage("THE IMPOSTER HAS BEEN FOUND.");

        setTimeout(() => {
          window.location.href = "/clue/4";
        }, 1600);
      } else {
        setMessage("WRONG TILE — +1:00 PENALTY.");
        setSelectedTile(null);
      }
    } catch {
      setError("Connection error. Please try again.");
      setSelectedTile(null);
    }
  }

  const wrongAttempts = attempts.filter(
    (attempt) => !attempt.matched
  ).length;

  if (loading) {
    return (
      <main className="hunt-shell">
        <section className="panel">
          <div className="text-center text-zinc-400">
            LOADING THE NEXT TRIAL...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">
          Clue 3 · The Eye of the Imposter
        </div>

        <h1 className="title">FIND THE FALSE ONE.</h1>

        <p className="body-copy">
          Eight images belong. One does not. Find the anomaly.
          Choose carefully — every wrong choice adds one minute.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.3em] text-zinc-500">
              EFFECTIVE TIME
            </div>

            <div className="mt-2 text-3xl font-black tracking-wider text-white">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs tracking-[0.3em] text-zinc-500">
              PENALTY
            </div>

            <div className="mt-2 text-3xl font-black tracking-wider text-white">
              +{Math.floor(penaltySeconds / 60)}:00
            </div>

            <div className="mt-1 text-xs text-zinc-500">
              {wrongAttempts} wrong {wrongAttempts === 1 ? "choice" : "choices"}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {shuffledTiles.map((tile, index) => {
            const attempt = attempts.find(
              (item) => item.imageRef === tile.id
            );

            const isLoading = selectedTile === tile.id;
            const isWrong = attempt && !attempt.matched;

            return (
              <button
                key={tile.id}
                type="button"
                disabled={
                  completed ||
                  Boolean(attempt) ||
                  selectedTile !== null
                }
                onClick={() => chooseTile(tile.id)}
                className={[
                  "group relative aspect-square overflow-hidden rounded-2xl border transition",
                  isWrong
                    ? "border-red-400/50 opacity-60"
                    : "border-white/10 hover:border-white/40",
                  isLoading ? "opacity-60" : "",
                ].join(" ")}
              >
                <img
                  src={tile.src}
                  alt={`Visual clue ${index + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-left text-xs tracking-widest text-white">
                  {isLoading
                    ? "CHECKING..."
                    : isWrong
                    ? "PENALTY"
                    : `IMAGE ${String(index + 1).padStart(2, "0")}`}
                </div>
              </button>
            );
          })}
        </div>

        {message && (
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5 text-center font-bold tracking-widest text-white">
            {message}
          </div>
        )}

        {error && (
          <p className="mt-5 text-center text-red-300">
            {error}
          </p>
        )}

        {!completed && (
          <p className="mt-8 text-center text-xs tracking-[0.25em] text-zinc-500">
            WRONG IMAGE = +1:00
          </p>
        )}
      </section>
    </main>
  );
}