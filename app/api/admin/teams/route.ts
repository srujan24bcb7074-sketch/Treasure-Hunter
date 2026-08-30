import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAdmin(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return false;
  }

  const supplied =
    req.headers.get("x-admin-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return supplied === adminSecret;
}

function getPenaltySeconds(team: {
  clue4Attempts: { penaltySeconds: number }[];
}) {
  return team.clue4Attempts.reduce(
    (total, attempt) => total + attempt.penaltySeconds,
    0
  );
}

export async function GET(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const teams = await prisma.team.findMany({
      orderBy: {
        createdAt: "asc",
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
        clue4Attempts: {
          orderBy: {
            createdAt: "asc",
          },
        },
        clue4: {
          orderBy: {
            createdAt: "asc",
          },
        },
        clue5Attempts: {
          orderBy: {
            createdAt: "asc",
          },
        },
        clue5: {
          orderBy: {
            createdAt: "asc",
          },
        },
        adminEvents: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const now = new Date();

    const result = teams.map((team) => {
      const penaltySeconds = getPenaltySeconds(team);

      const firstProgress = team.progress[0];

      const startTime =
        firstProgress?.startedAt ??
        team.createdAt;

      const endTime =
        team.completedAt ??
        now;

      const elapsedSeconds = Math.max(
        0,
        Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000
        )
      );

      const adjustedSeconds =
        elapsedSeconds + penaltySeconds;

      const clue3Correct = team.clue3.filter(
        (attempt) => attempt.matched
      ).length;

      const clue3Wrong = team.clue3.filter(
        (attempt) => !attempt.matched
      ).length;

      const clue4Correct = team.clue4Attempts.filter(
        (attempt) => attempt.correct
      ).length;

      const clue4Wrong = team.clue4Attempts.filter(
        (attempt) => !attempt.correct
      ).length;

      const clue5Correct = team.clue5Attempts.filter(
        (attempt) => attempt.correct
      ).length;

      const clue5Wrong = team.clue5Attempts.filter(
        (attempt) => !attempt.correct
      ).length;

      return {
        id: team.id,
        teamName: team.teamName,
        status: team.status,
        currentStage: team.currentStage,

        members: team.members.map((member) => ({
          id: member.id,
          name: member.name,
        })),

        createdAt: team.createdAt,
        completedAt: team.completedAt,

        startTime,

        elapsedSeconds,
        penaltySeconds,
        adjustedSeconds,

        clue3: {
          total: team.clue3.length,
          correct: clue3Correct,
          wrong: clue3Wrong,
        },

        clue4: {
          total: team.clue4Attempts.length,
          correct: clue4Correct,
          wrong: clue4Wrong,
          penaltySeconds: team.clue4Attempts.reduce(
            (total, attempt) =>
              total + attempt.penaltySeconds,
            0
          ),
        },

        clue5: {
          total: team.clue5Attempts.length,
          correct: clue5Correct,
          wrong: clue5Wrong,
        },

        progress: team.progress.map((item) => ({
          id: item.id,
          stage: item.stage,
          status: item.status,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
        })),

        events: team.adminEvents.map((event) => ({
          id: event.id,
          type: event.type,
          message: event.message,
          metadata: event.metadata,
          createdAt: event.createdAt,
        })),
      };
    });

    result.sort(
      (a, b) =>
        a.adjustedSeconds - b.adjustedSeconds
    );

    return NextResponse.json({
      ok: true,
      teams: result,
      serverTime: now,
    });
  } catch (error) {
    console.error("ADMIN TEAMS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load admin data.",
      },
      {
        status: 500,
      }
    );
  }
}