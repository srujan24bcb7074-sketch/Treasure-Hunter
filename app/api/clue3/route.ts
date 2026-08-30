import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

const TILE_IDS = [
  "tile-01",
  "tile-02",
  "tile-03",
  "tile-04",
  "tile-05",
  "tile-06",
  "tile-07",
  "tile-08",
  "tile-09",
];

// The AI-generated image is the target.
// Keep this value server-side.
const CORRECT_TILE = "tile-09";

const PENALTY_SECONDS = 60;

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours > 0 ? String(hours).padStart(2, "0") : null,
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(":");
}

export async function GET() {
  try {
    const team = await getCurrentTeam();

    if (!team) {
      return NextResponse.json(
        { error: "No active team session." },
        { status: 401 }
      );
    }

    if (team.currentStage !== "CLUE_3") {
      return NextResponse.json(
        {
          error: "Clue 3 is not the current stage.",
          currentStage: team.currentStage,
        },
        { status: 409 }
      );
    }

    const attempts = await prisma.clue3Attempt.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "asc" },
    });

    const penaltySeconds =
      attempts.filter((attempt) => !attempt.matched).length *
      PENALTY_SECONDS;

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - team.createdAt.getTime()) / 1000)
    );

    const effectiveElapsedSeconds = elapsedSeconds + penaltySeconds;

    return NextResponse.json({
      attempts: attempts.map((attempt) => ({
        imageRef: attempt.imageRef,
        matched: attempt.matched,
      })),
      penaltySeconds,
      penaltyMinutes: penaltySeconds / 60,
      elapsedSeconds,
      effectiveElapsedSeconds,
      elapsed: formatSeconds(effectiveElapsedSeconds),
      tiles: TILE_IDS,
    });
  } catch (error) {
    console.error("CLUE 3 GET ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load Clue 3." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const team = await getCurrentTeam();

    if (!team) {
      return NextResponse.json(
        { error: "No active team session." },
        { status: 401 }
      );
    }

    if (team.currentStage !== "CLUE_3") {
      return NextResponse.json(
        {
          error: "Clue 3 is not the current stage.",
          currentStage: team.currentStage,
        },
        { status: 409 }
      );
    }

    const body = await req.json();
    const imageRef = String(body.imageRef ?? "").trim();

    if (!TILE_IDS.includes(imageRef)) {
      return NextResponse.json(
        { error: "Invalid tile." },
        { status: 400 }
      );
    }

    const previousAttempts = await prisma.clue3Attempt.findMany({
      where: { teamId: team.id },
    });

    const alreadyAttempted = previousAttempts.some(
      (attempt) => attempt.imageRef === imageRef
    );

    if (alreadyAttempted) {
      return NextResponse.json(
        { error: "That tile has already been selected." },
        { status: 409 }
      );
    }

    const matched = imageRef === CORRECT_TILE;

    await prisma.clue3Attempt.create({
      data: {
        teamId: team.id,
        imageRef,
        matched,
      },
    });

    const penaltySeconds =
      previousAttempts.filter((attempt) => !attempt.matched).length *
        PENALTY_SECONDS +
      (matched ? 0 : PENALTY_SECONDS);

    if (matched) {
      const now = new Date();

      await prisma.$transaction([
        prisma.stageProgress.updateMany({
          where: {
            teamId: team.id,
            stage: "CLUE_3",
            status: "STARTED",
          },
          data: {
            status: "COMPLETED",
            completedAt: now,
          },
        }),

        prisma.stageProgress.create({
          data: {
            teamId: team.id,
            stage: "CLUE_4",
            status: "STARTED",
            startedAt: now,
          },
        }),

        prisma.team.update({
          where: { id: team.id },
          data: {
            currentStage: "CLUE_4",
          },
        }),
      ]);
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - team.createdAt.getTime()) / 1000)
    );

    const effectiveElapsedSeconds =
      elapsedSeconds + penaltySeconds;

    return NextResponse.json({
      ok: true,
      matched,
      penaltySeconds,
      penaltyMinutes: penaltySeconds / 60,
      elapsedSeconds,
      effectiveElapsedSeconds,
      elapsed: formatSeconds(effectiveElapsedSeconds),
      nextStage: matched ? "CLUE_4" : "CLUE_3",
    });
  } catch (error) {
    console.error("CLUE 3 POST ERROR:", error);

    return NextResponse.json(
      { error: "Unable to process the tile." },
      { status: 500 }
    );
  }
}