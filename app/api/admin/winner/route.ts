import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const teamId = String(body.teamId ?? "");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required." },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 }
      );
    }

    if (team.status === "WINNER") {
      return NextResponse.json({
        ok: true,
        message: `${team.teamName} is already the winner.`,
      });
    }

    const now = new Date();

    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        status: "WINNER",
        currentStage: "WINNER",
        completedAt: team.completedAt ?? now,
      },
    });

    return NextResponse.json({
      ok: true,
      team: {
        id: updatedTeam.id,
        teamName: updatedTeam.teamName,
        status: updatedTeam.status,
        currentStage: updatedTeam.currentStage,
      },
      message: `${updatedTeam.teamName} has been declared the winner.`,
    });
  } catch (error) {
    console.error("DECLARE WINNER ERROR:", error);

    return NextResponse.json(
      { error: "Unable to declare winner." },
      { status: 500 }
    );
  }
}