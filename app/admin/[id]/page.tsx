import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function AdminTeamPage({
  params,
}: PageProps) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: {
      id,
    },

    include: {
      members: true,

      progress: {
        orderBy: {
          startedAt: "asc",
        },
      },

      clue3: {
        orderBy: {
          createdAt: "asc",
        },
      },

      clue4: {
        orderBy: {
          createdAt: "asc",
        },
      },

      clue4Attempts: {
        orderBy: {
          createdAt: "asc",
        },
      },

      clue5: {
        orderBy: {
          createdAt: "asc",
        },
      },

      clue5Attempts: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const clue4Wrong = team.clue4Attempts.filter(
    (attempt) => !attempt.correct
  );

  const clue4Correct = team.clue4Attempts.filter(
    (attempt) => attempt.correct
  );

  const clue4Penalty = team.clue4Attempts.reduce(
    (total, attempt) =>
      total + attempt.penaltySeconds,
    0
  );

  const clue5Wrong = team.clue5Attempts.filter(
    (attempt) => !attempt.correct
  );

  const clue5Correct = team.clue5Attempts.filter(
    (attempt) => attempt.correct
  );

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <Link
          href="/admin"
          className="text-sm font-bold text-zinc-500 hover:text-white"
        >
          ← BACK TO ALL TEAMS
        </Link>

        {/* HEADER */}

        <div className="mt-8">

          <div className="eyebrow">
            Team Investigation Record
          </div>

          <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">
            {team.teamName}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3">

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
              {team.status}
            </span>

            <span className="rounded-full border border-orange-400/20 bg-orange-400/5 px-4 py-2 text-sm text-orange-300">
              {stageLabel(team.currentStage)}
            </span>

          </div>

        </div>

        {/* TEAM INFO */}

        <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <h2 className="text-xl font-black text-white">
            TEAM INFORMATION
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                TEAM ID
              </div>

              <div className="mt-2 break-all text-sm text-zinc-300">
                {team.id}
              </div>
            </div>

            <div>
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                SESSION TOKEN
              </div>

              <div className="mt-2 break-all text-sm text-zinc-300">
                {team.sessionToken}
              </div>
            </div>

            <div>
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                REGISTERED
              </div>

              <div className="mt-2 text-sm text-zinc-300">
                {team.createdAt.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                COMPLETED
              </div>

              <div className="mt-2 text-sm text-zinc-300">
                {team.completedAt
                  ? team.completedAt.toLocaleString()
                  : "Not completed"}
              </div>
            </div>

          </div>

        </section>

        {/* MEMBERS */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <h2 className="text-xl font-black text-white">
            CREW MEMBERS
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {team.members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="text-xs text-zinc-600">
                  MEMBER
                </div>

                <div className="mt-1 font-bold text-white">
                  {member.name}
                </div>
              </div>
            ))}

          </div>

        </section>

        {/* STAGE HISTORY */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <h2 className="text-xl font-black text-white">
            STAGE HISTORY
          </h2>

          <div className="mt-5 space-y-3">

            {team.progress.map((progress) => (
              <div
                key={progress.id}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
              >

                <div>
                  <div className="font-bold text-white">
                    {stageLabel(progress.stage)}
                  </div>

                  <div className="text-xs text-zinc-600">
                    Started:{" "}
                    {progress.startedAt.toLocaleString()}
                  </div>
                </div>

                <div className="text-sm text-zinc-400">
                  {progress.status}
                </div>

              </div>
            ))}

          </div>

        </section>

        {/* CLUE 3 */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <h2 className="text-xl font-black text-white">
            CLUE 3 ATTEMPTS
          </h2>

          <div className="mt-5 space-y-3">

            {team.clue3.length === 0 ? (
              <p className="text-zinc-600">
                No Clue 3 attempts recorded.
              </p>
            ) : (
              team.clue3.map((attempt) => (
                <div
                  key={attempt.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <div className="text-xs text-zinc-600">
                        IMAGE REF
                      </div>

                      <div className="mt-1 text-sm text-zinc-300">
                        {attempt.imageRef}
                      </div>
                    </div>

                    <div
                      className={
                        attempt.matched
                          ? "font-bold text-green-300"
                          : "font-bold text-red-300"
                      }
                    >
                      {attempt.matched
                        ? "MATCHED"
                        : "NOT MATCHED"}
                    </div>

                  </div>
                </div>
              ))
            )}

          </div>

        </section>

        {/* CLUE 4 */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <h2 className="text-xl font-black text-white">
              CLUE 4
            </h2>

            <div className="text-sm font-bold text-orange-300">
              Penalty: {clue4Penalty} seconds
            </div>

          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-600">
                TOTAL ANSWERS
              </div>

              <div className="mt-1 text-2xl font-black text-white">
                {team.clue4Attempts.length}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-600">
                CORRECT
              </div>

              <div className="mt-1 text-2xl font-black text-green-300">
                {clue4Correct.length}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-600">
                WRONG
              </div>

              <div className="mt-1 text-2xl font-black text-red-300">
                {clue4Wrong.length}
              </div>
            </div>

          </div>

          <div className="mt-6 space-y-3">

            {team.clue4Attempts.length === 0 ? (
              <p className="text-zinc-600">
                No Clue 4 answers recorded.
              </p>
            ) : (
              team.clue4Attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between">

                    <div className="text-sm text-zinc-500">
                      Attempt {index + 1}
                    </div>

                    <div
                      className={
                        attempt.correct
                          ? "font-bold text-green-300"
                          : "font-bold text-red-300"
                      }
                    >
                      {attempt.correct
                        ? "CORRECT"
                        : "WRONG"}
                    </div>

                  </div>

                  <div className="mt-3 text-sm text-zinc-400">
                    Question: {attempt.questionId}
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    Choice: {attempt.choiceId}
                  </div>

                  {attempt.penaltySeconds > 0 && (
                    <div className="mt-1 text-sm text-orange-300">
                      Penalty: {attempt.penaltySeconds}s
                    </div>
                  )}

                  <div className="mt-2 text-xs text-zinc-600">
                    {attempt.createdAt.toLocaleString()}
                  </div>

                </div>
              ))
            )}

          </div>

        </section>

        {/* CLUE 4 CONVERSATION */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <h2 className="text-xl font-black text-white">
            CLUE 4 INVESTIGATOR CONVERSATION
          </h2>

          <div className="mt-5 space-y-4">

            {team.clue4.length === 0 ? (
              <p className="text-zinc-600">
                No conversation recorded.
              </p>
            ) : (
              team.clue4.map((message) => (
                <div
                  key={message.id}
                  className="space-y-3"
                >

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs tracking-[0.2em] text-zinc-600">
                      PARTICIPANT
                    </div>

                    <div className="mt-2 whitespace-pre-line text-zinc-300">
                      {message.participantText}
                    </div>
                  </div>

                  <div className="rounded-xl border border-orange-400/10 bg-orange-400/[0.03] p-4">
                    <div className="text-xs tracking-[0.2em] text-orange-400/50">
                      INVESTIGATOR
                    </div>

                    <div className="mt-2 whitespace-pre-line text-zinc-300">
                      {message.aiResponse}
                    </div>
                  </div>

                </div>
              ))
            )}

          </div>

        </section>

        {/* CLUE 5 */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

          <h2 className="text-xl font-black text-white">
            CLUE 5 — DRAGON BALL INVESTIGATION
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-600">
                TOTAL ANSWERS
              </div>

              <div className="mt-1 text-2xl font-black text-white">
                {team.clue5Attempts.length}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-600">
                CORRECT
              </div>

              <div className="mt-1 text-2xl font-black text-green-300">
                {clue5Correct.length}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-600">
                WRONG
              </div>

              <div className="mt-1 text-2xl font-black text-red-300">
                {clue5Wrong.length}
              </div>
            </div>

          </div>

          <div className="mt-6 space-y-3">

            {team.clue5Attempts.length === 0 ? (
              <p className="text-zinc-600">
                No Clue 5 answers recorded.
              </p>
            ) : (
              team.clue5Attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >

                  <div className="flex items-center justify-between">

                    <div className="text-sm text-zinc-500">
                      Question {index + 1}
                    </div>

                    <div
                      className={
                        attempt.correct
                          ? "font-bold text-green-300"
                          : "font-bold text-red-300"
                      }
                    >
                      {attempt.correct
                        ? "CORRECT"
                        : "WRONG"}
                    </div>

                  </div>

                  <div className="mt-3 text-sm text-zinc-400">
                    Question ID: {attempt.questionId}
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    Choice: {attempt.choiceId}
                  </div>

                  <div className="mt-2 text-xs text-zinc-600">
                    {attempt.createdAt.toLocaleString()}
                  </div>

                </div>
              ))
            )}

          </div>

        </section>

      </div>
    </main>
  );
}