"use client";

import { useEffect, useState, type ReactNode } from "react";

type HuntStatus = "WINNER" | "OTHER" | null;

type HuntStatusGuardProps = {
children: ReactNode;
};

const CHECK_INTERVAL = 3000;

export default function HuntStatusGuard({
children,
}: HuntStatusGuardProps) {
const [huntStatus, setHuntStatus] = useState<HuntStatus>(null);

useEffect(() => {
let cancelled = false;


async function checkStatus() {
  try {
    const response = await fetch("/api/session", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    if (cancelled) {
      return;
    }

    /*
     * The existing session response should contain the current team.
     * We only need its status here.
     */
    const status = data?.team?.status ?? data?.status;

    if (status === "WINNER") {
      setHuntStatus("WINNER");
    } else if (status) {
      setHuntStatus("OTHER");
    }
  } catch {
    // Keep the current hunt page if a status check temporarily fails.
  }
}

checkStatus();

const interval = window.setInterval(
  checkStatus,
  CHECK_INTERVAL
);

return () => {
  cancelled = true;
  window.clearInterval(interval);
};


}, []);

if (huntStatus === "WINNER") {
return <WinnerPage />;
}

if (huntStatus === "OTHER") {
return <MotivationPage />;
}

return <>{children}</>;
}

function WinnerPage() {
return ( <main className="hunt-shell"> <section className="panel text-center">


    <div className="eyebrow">
      The Hunt Is Yours
    </div>

    <h1 className="title">
      YOU FOUND IT.
    </h1>

    <div className="body-copy mx-auto max-w-2xl">
      <p className="mb-5 text-xl font-bold text-white">
        Congratulations, hunters.
      </p>

      <p className="mb-5">
        You followed the trail when the path was hidden,
        solved what others could not, and reached the end
        of a mystery that was never meant to be easy.
      </p>

      <p className="mb-5">
        The treasure was unknown to existence,
        yet somehow known to the universe.
      </p>

      <p className="mb-8 text-2xl font-black text-white">
        And now...
        <br />
        it belongs to you.
      </p>

      <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-6">
        <div className="text-sm font-black tracking-[0.25em] text-yellow-300">
          CONGRATULATIONS
        </div>

        <p className="mt-3 text-zinc-300">
          You are the champions of the treasure hunt.
        </p>
      </div>

    </div>
  </section>
</main>


);
}

function MotivationPage() {
return ( <main className="hunt-shell"> <section className="panel text-center">


    <div className="eyebrow">
      The Story Continues
    </div>

    <h1 className="title">
      KEEP MOVING.
    </h1>

    <div className="body-copy mx-auto max-w-2xl">

      <p className="mb-6 text-xl font-bold text-white">
        Another team may have reached the end.
        <br />
        But your journey was never theirs.
      </p>

      <p className="mb-6">
        Every clue you solved mattered.
        Every wrong turn became part of your story.
        Every step brought you further than where you began.
      </p>

      <blockquote className="my-8 rounded-2xl border border-orange-400/20 bg-orange-400/5 p-6">
        <p className="text-xl font-bold italic text-orange-200">
          “The strongest hunters are not those who never
          lose their way, but those who keep walking when
          the path disappears.”
        </p>
      </blockquote>

      <p className="text-lg font-black text-white">
        Your story may not have ended the way you expected.
      </p>

      <p className="mt-3">
        But remember...
      </p>

      <p className="mt-5 text-2xl font-black text-white">
        A true hunter does not stop
        <br />
        simply because someone arrived first.
      </p>

    </div>
  </section>
</main>


);
}
