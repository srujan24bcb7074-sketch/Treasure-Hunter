import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

const ACCEPTED_ANSWERS = new Set([
  "naruto",
  "narutouzumaki",
]);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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

    if (team.currentStage !== "CLUE_2") {
      return NextResponse.json(
        { error: "Clue 2 is not the current stage." },
        { status: 409 }
      );
    }

    const selectedCount = await prisma.clue2Question.count({
      where: { teamId: team.id },
    });

    if (selectedCount < 5) {
      return NextResponse.json(
        { error: "You must select five questions first." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const guess = String(body.guess ?? "").trim();

    if (!guess) {
      return NextResponse.json(
        { error: "Enter the character's name." },
        { status: 400 }
      );
    }

    const correct = ACCEPTED_ANSWERS.has(normalize(guess));

    if (!correct) {
      return NextResponse.json({ correct: false });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.stageProgress.updateMany({
        where: {
          teamId: team.id,
          stage: "CLUE_2",
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
          stage: "CLUE_3",
          status: "STARTED",
          startedAt: now,
        },
      }),
      prisma.team.update({
        where: { id: team.id },
        data: { currentStage: "CLUE_3" },
      }),
    ]);

    return NextResponse.json({
      correct: true,
      nextStage: "CLUE_3",
    });
  } catch (error) {
    console.error("CLUE 2 GUESS ERROR:", error);
    return NextResponse.json(
      { error: "Unable to check the guess." },
      { status: 500 }
    );
  }
}
