import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
params: Promise<{
teamId: string;
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

export default async function TeamRecordPage({
params,
}: PageProps) {
const { teamId } = await params;

const team = await prisma.team.findUnique({
where: {
id: teamId,
},
include: {
members: true,
progress: {
orderBy: {
startedAt: "asc",
},
},
clue2: {
orderBy: {
createdAt: "asc",
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
).length;

const clue4Correct = team.clue4Attempts.filter(
(attempt) => attempt.correct
).length;

const clue4Penalty = team.clue4Attempts.reduce(
(total, attempt) => total + attempt.penaltySeconds,
0
);

const clue5Wrong = team.clue5Attempts.filter(
(attempt) => !attempt.correct
).length;

const clue5Correct = team.clue5Attempts.filter(
(attempt) => attempt.correct
).length;

return ( <main className="min-h-screen px-4 py-8 md:px-8"> <div className="mx-auto max-w-7xl">


    {/* BACK */}

    <Link
      href="/admin"
      className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
    >
      ← BACK TO LIVE TEAMS
    </Link>

    {/* HEADER */}

    <div className="mt-8">
      <div className="eyebrow">
        Complete Team Record
      </div>

      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
            {team.teamName}
          </h1>

          <p className="mt-3 break-all text-sm text-zinc-500">
            Team ID: {team.id}
          </p>
        </div>

        <div
          className={`w-fit rounded-full border px-5 py-2 text-sm font-black ${statusClass(
            team.status
          )}`}
        >
          {team.status}
        </div>
      </div>
    </div>

    {/* OVERVIEW */}

    <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="text-xs tracking-[0.2em] text-zinc-600">
          CURRENT STAGE
        </div>

        <div className="mt-2 text-2xl font-black text-white">
          {stageLabel(team.currentStage)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="text-xs tracking-[0.2em] text-zinc-600">
          CREW MEMBERS
        </div>

        <div className="mt-2 text-2xl font-black text-white">
          {team.members.length}
        </div>
      </div>

      <div className="rounded-2xl border border-orange-400/10 bg-orange-400/5 p-6">
        <div className="text-xs tracking-[0.2em] text-zinc-600">
          CLUE 4 PENALTY
        </div>

        <div className="mt-2 text-2xl font-black text-orange-300">
          {clue4Penalty}s
        </div>
      </div>

      <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-6">
        <div className="text-xs tracking-[0.2em] text-zinc-600">
          CLUE 5 SCORE
        </div>

        <div className="mt-2 text-2xl font-black text-white">
          {clue5Correct}
        </div>
      </div>

    </section>

    {/* CREW */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        CREW MEMBERS
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.members.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="font-bold text-white">
              {member.name}
            </div>

            <div className="mt-1 break-all text-xs text-zinc-600">
              {member.id}
            </div>
          </div>
        ))}
      </div>

    </section>

    {/* STAGE PROGRESS */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        STAGE PROGRESS
      </h2>

      {team.progress.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No stage progress recorded.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {team.progress.map((progress) => (
            <div
              key={progress.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                <div>
                  <div className="font-black text-white">
                    {stageLabel(progress.stage)}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    Started:{" "}
                    {progress.startedAt.toLocaleString()}
                  </div>

                  {progress.completedAt && (
                    <div className="mt-1 text-xs text-zinc-500">
                      Completed:{" "}
                      {progress.completedAt.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="text-sm font-bold text-zinc-300">
                  {progress.status}
                </div>

              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* CLUE 2 */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        CLUE 2
      </h2>

      {team.clue2.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No Clue 2 records.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {team.clue2.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                SELECTION {index + 1}
              </div>

              <div className="mt-2 font-bold text-white">
                {item.question}
              </div>

              <div className="mt-3 text-sm text-zinc-400">
                Response:{" "}
                <span className="font-bold text-white">
                  {item.response}
                </span>
              </div>

              <div className="mt-2 text-xs text-zinc-600">
                {item.createdAt.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* CLUE 3 */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        CLUE 3
      </h2>

      {team.clue3.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No Clue 3 attempts.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {team.clue3.map((attempt, index) => (
            <div
              key={attempt.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-[0.2em] text-zinc-600">
                  ATTEMPT {index + 1}
                </span>

                <span
                  className={
                    attempt.matched
                      ? "font-bold text-green-300"
                      : "font-bold text-red-300"
                  }
                >
                  {attempt.matched ? "MATCHED" : "NOT MATCHED"}
                </span>
              </div>

              <div className="mt-3 break-all text-sm text-zinc-400">
                Image reference: {attempt.imageRef}
              </div>

              <div className="mt-2 text-xs text-zinc-600">
                {attempt.createdAt.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* CLUE 4 MESSAGES */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        CLUE 4 CONVERSATION
      </h2>

      {team.clue4.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No Clue 4 messages.
        </p>
      ) : (
        <div className="mt-5 space-y-4">

          {team.clue4.map((message, index) => (
            <div
              key={message.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                MESSAGE {index + 1}
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold tracking-[0.15em] text-orange-300">
                  TEAM
                </div>

                <div className="mt-2 whitespace-pre-wrap text-zinc-300">
                  {message.participantText}
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-bold tracking-[0.15em] text-blue-300">
                  RESPONSE
                </div>

                <div className="mt-2 whitespace-pre-wrap text-zinc-300">
                  {message.aiResponse}
                </div>
              </div>

              <div className="mt-4 text-xs text-zinc-600">
                {message.createdAt.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* CLUE 4 ATTEMPTS */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <h2 className="text-2xl font-black text-white">
            CLUE 4 ATTEMPTS
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Correct: {clue4Correct} · Wrong: {clue4Wrong} · Penalty: {clue4Penalty}s
          </p>
        </div>

      </div>

      {team.clue4Attempts.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No Clue 4 attempts.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {team.clue4Attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>
                  <div className="text-xs tracking-[0.2em] text-zinc-600">
                    ATTEMPT {index + 1}
                  </div>

                  <div className="mt-2 text-sm text-zinc-400">
                    Question ID:{" "}
                    <span className="font-bold text-white">
                      {attempt.questionId}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    Choice:{" "}
                    <span className="font-bold text-white">
                      {attempt.choiceId}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={
                      attempt.correct
                        ? "font-black text-green-300"
                        : "font-black text-red-300"
                    }
                  >
                    {attempt.correct ? "CORRECT" : "WRONG"}
                  </div>

                  <div className="mt-1 text-sm text-orange-300">
                    Penalty: {attempt.penaltySeconds}s
                  </div>
                </div>

              </div>

              <div className="mt-4 text-xs text-zinc-600">
                {attempt.createdAt.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* CLUE 5 */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        CLUE 5
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        Correct: {clue5Correct} · Wrong: {clue5Wrong}
      </p>

      {team.clue5Attempts.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No Clue 5 attempts.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {team.clue5Attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>
                  <div className="text-xs tracking-[0.2em] text-zinc-600">
                    QUESTION {index + 1}
                  </div>

                  <div className="mt-2 text-sm text-zinc-400">
                    Question ID:{" "}
                    <span className="font-bold text-white">
                      {attempt.questionId}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    Selected choice:{" "}
                    <span className="font-bold text-white">
                      {attempt.choiceId}
                    </span>
                  </div>
                </div>

                <div
                  className={
                    attempt.correct
                      ? "font-black text-green-300"
                      : "font-black text-red-300"
                  }
                >
                  {attempt.correct ? "CORRECT" : "WRONG"}
                </div>

              </div>

              <div className="mt-4 text-xs text-zinc-600">
                {attempt.createdAt.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* RAW CLUE 5 QUESTION RECORDS */}

    <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        CLUE 5 QUESTION RECORDS
      </h2>

      {team.clue5.length === 0 ? (
        <p className="mt-5 text-zinc-500">
          No Clue 5 question records.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {team.clue5.map((question, index) => (
            <div
              key={question.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-xs tracking-[0.2em] text-zinc-600">
                RECORD {index + 1}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">

                <div>
                  <div className="text-xs text-zinc-600">
                    QUESTION ID
                  </div>

                  <div className="mt-1 font-bold text-white">
                    {question.questionId}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    ANSWER
                  </div>

                  <div className="mt-1 font-bold text-white">
                    {question.answer}
                  </div>
                </div>

              </div>

              <div className="mt-3">
                <span
                  className={
                    question.correct
                      ? "font-bold text-green-300"
                      : "font-bold text-red-300"
                  }
                >
                  {question.correct ? "CORRECT" : "WRONG"}
                </span>
              </div>

              <div className="mt-3 text-xs text-zinc-600">
                {question.createdAt.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      )}

    </section>

    {/* ACCOUNT INFORMATION */}

    <section className="mt-8 mb-12 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">

      <h2 className="text-2xl font-black text-white">
        TEAM INFORMATION
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs tracking-[0.2em] text-zinc-600">
            SESSION TOKEN
          </div>

          <div className="mt-2 break-all font-mono text-sm text-zinc-400">
            {team.sessionToken}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs tracking-[0.2em] text-zinc-600">
            REGISTERED
          </div>

          <div className="mt-2 text-sm text-zinc-300">
            {team.createdAt.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs tracking-[0.2em] text-zinc-600">
            COMPLETED
          </div>

          <div className="mt-2 text-sm text-zinc-300">
            {team.completedAt
              ? team.completedAt.toLocaleString()
              : "Not completed"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs tracking-[0.2em] text-zinc-600">
            DATABASE ID
          </div>

          <div className="mt-2 break-all font-mono text-sm text-zinc-400">
            {team.id}
          </div>
        </div>

      </div>

    </section>

  </div>
</main>


);
}
