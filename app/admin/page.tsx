import Link from "next/link";
import ResetButton from "./ResetButton";
import DeclareWinnerButton from "./DeclareWinnerButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function stageLabel(stage: string) {
  switch (stage) {
    case "WELCOME":
      return "Welcome";
    case "REGISTRATION":
      return "Registration";
    case "CLUE_1":
      return "Clue 1";
    case "CLUE_2":
      return "Clue 2";
    case "CLUE_3":
      return "Clue 3";
    case "CLUE_4":
      return "Clue 4";
    case "CLUE_5":
      return "Clue 5";
    case "AWAITING_ADMIN":
      return "Awaiting Admin";
    case "WINNER":
      return "Winner";
    default:
      return stage;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "AWAITING_ADMIN":
      return "Awaiting Admin";
    case "WINNER":
      return "Winner";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "WINNER":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";

    case "AWAITING_ADMIN":
      return "border-orange-400/30 bg-orange-400/10 text-orange-300";

    case "ACTIVE":
      return "border-green-400/20 bg-green-400/10 text-green-300";

    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

function stageClass(stage: string) {
  if (stage === "WINNER") {
    return "text-yellow-300";
  }

  if (stage === "AWAITING_ADMIN") {
    return "text-orange-300";
  }

  return "text-white";
}

export default async function AdminPage() {
  const teams = await prisma.team.findMany({
    orderBy: {
      createdAt: "asc",
    },
    include: {
      members: true,
      progress: true,
      clue4Attempts: true,
      clue5Attempts: true,
    },
  });

  const activeTeams = teams.filter(
    (team) => team.status === "ACTIVE"
  );

  const awaitingTeams = teams.filter(
    (team) => team.status === "AWAITING_ADMIN"
  );

  const winnerTeams = teams.filter(
    (team) => team.status === "WINNER"
  );

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <div className="eyebrow">
            Control Center
          </div>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-6xl">
            LIVE TEAMS
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Monitor every team competing in the treasure hunt.
            All team progress is recorded independently.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="mb-8 grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              TOTAL TEAMS
            </div>

            <div className="mt-2 text-4xl font-black text-white">
              {teams.length}
            </div>
          </div>

          <div className="rounded-2xl border border-green-400/10 bg-green-400/5 p-6">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              ACTIVE
            </div>

            <div className="mt-2 text-4xl font-black text-green-300">
              {activeTeams.length}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-400/10 bg-orange-400/5 p-6">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              AWAITING ADMIN
            </div>

            <div className="mt-2 text-4xl font-black text-orange-300">
              {awaitingTeams.length}
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-6">
            <div className="text-xs tracking-[0.25em] text-zinc-500">
              WINNER
            </div>

            <div className="mt-2 text-4xl font-black text-yellow-300">
              {winnerTeams.length}
            </div>
          </div>

        </div>

        {/* NO TEAMS */}

        {teams.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center">
            <div className="text-2xl font-black text-white">
              NO TEAMS YET
            </div>

            <p className="mt-3 text-zinc-500">
              Teams will appear here as soon as they register.
            </p>
          </div>
        )}

        {/* TEAMS */}

        <div className="space-y-5">

          {teams.map((team) => {
            const clue4Wrong = team.clue4Attempts.filter(
              (attempt) => !attempt.correct
            ).length;

            const clue4Penalty = team.clue4Attempts.reduce(
              (total, attempt) =>
                total + attempt.penaltySeconds,
              0
            );

            const clue5Correct = team.clue5Attempts.filter(
              (attempt) => attempt.correct
            ).length;

            const clue5Wrong = team.clue5Attempts.filter(
              (attempt) => !attempt.correct
            ).length;

            return (
              <div
                key={team.id}
                className="rounded-3xl border border-white/10 bg-black/25 p-6 md:p-8"
              >

                {/* TEAM HEADER */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div>
                    <div className="text-xs tracking-[0.3em] text-zinc-600">
                      TEAM
                    </div>

                    <h2 className="mt-1 text-3xl font-black text-white">
                      {team.teamName}
                    </h2>

                    <div className="mt-2 text-sm text-zinc-500">
                      ID: {team.id}
                    </div>
                  </div>

                  <div
                    className={`w-fit rounded-full border px-4 py-2 text-sm font-bold ${statusClass(
                      team.status
                    )}`}
                  >
                    {statusLabel(team.status)}
                  </div>

                </div>

                {/* MAIN INFORMATION */}

                <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs tracking-[0.2em] text-zinc-600">
                      CURRENT STAGE
                    </div>

                    <div
                      className={`mt-2 text-lg font-black ${stageClass(
                        team.currentStage
                      )}`}
                    >
                      {stageLabel(team.currentStage)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs tracking-[0.2em] text-zinc-600">
                      MEMBERS
                    </div>

                    <div className="mt-2 text-lg font-black text-white">
                      {team.members.length}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs tracking-[0.2em] text-zinc-600">
                      CLUE 4 PENALTY
                    </div>

                    <div className="mt-2 text-lg font-black text-orange-300">
                      {clue4Penalty}s
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs tracking-[0.2em] text-zinc-600">
                      CLUE 5 SCORE
                    </div>

                    <div className="mt-2 text-lg font-black text-white">
                      {clue5Correct} correct
                    </div>
                  </div>

                </div>

                {/* MEMBERS */}

                <div className="mt-6">

                  <div className="text-xs tracking-[0.25em] text-zinc-600">
                    CREW
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {team.members.map((member) => (
                      <span
                        key={member.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300"
                      >
                        {member.name}
                      </span>
                    ))}

                  </div>

                </div>

                {/* STATS */}

                <div className="mt-6 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-xl bg-white/[0.03] p-4">
                    <div className="text-xs text-zinc-600">
                      CLUE 4 WRONG
                    </div>

                    <div className="mt-1 font-bold text-zinc-300">
                      {clue4Wrong}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] p-4">
                    <div className="text-xs text-zinc-600">
                      CLUE 5 CORRECT
                    </div>

                    <div className="mt-1 font-bold text-green-300">
                      {clue5Correct}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] p-4">
                    <div className="text-xs text-zinc-600">
                      CLUE 5 WRONG
                    </div>

                    <div className="mt-1 font-bold text-red-300">
                      {clue5Wrong}
                    </div>
                  </div>

                </div>

                {/* TIME */}

                <div className="mt-6 border-t border-white/10 pt-5 text-sm text-zinc-500">
                  Registered:{" "}
                  {team.createdAt.toLocaleString()}
                </div>

                {team.completedAt && (
                  <div className="mt-2 text-sm text-zinc-500">
                    Completed:{" "}
                    {team.completedAt.toLocaleString()}
                  </div>
                )}

                {/* DETAILS */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">

  <Link
    href={`/admin/team/${team.id}`}
    className="inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
  >
    VIEW COMPLETE TEAM RECORD →
  </Link>

  {team.status === "WINNER" ? (
    <DeclareWinnerButton
      teamId={team.id}
      teamName={team.teamName}
      disabled
    />
  ) : (
    <DeclareWinnerButton
      teamId={team.id}
      teamName={team.teamName}
    />
  )}

</div>

              </div>
            );
          })}

        </div>
        <ResetButton />

      </div>
    </main>
  );
}