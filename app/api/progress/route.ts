import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const team = await getCurrentTeam();

    if (!team) {
      return NextResponse.json(
        { error: "No active team session." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const stage = String(body.stage ?? "");
    const action = String(body.action ?? "");

    if (stage !== "CLUE_1" || action !== "COMPLETED") {
      return NextResponse.json(
        { error: "Invalid progress action." },
        { status: 400 }
      );
    }

    if (team.currentStage !== "CLUE_1") {
      return NextResponse.json(
        { error: "Clue 1 is not the current stage." },
        { status: 409 }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.stageProgress.updateMany({
        where: {
          teamId: team.id,
          stage: "CLUE_1",
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
          stage: "CLUE_2",
          status: "STARTED",
          startedAt: now,
        },
      }),

      prisma.team.update({
        where: { id: team.id },
        data: {
          currentStage: "CLUE_2",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      nextStage: "CLUE_2",
      completedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("PROGRESS ERROR:", error);

    return NextResponse.json(
      { error: "Unable to record progress." },
      { status: 500 }
    );
  }
}