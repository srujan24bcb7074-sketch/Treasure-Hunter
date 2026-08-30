import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const teamName = String(body.teamName ?? "").trim();

    const names = Array.isArray(body.names)
      ? body.names.map((name: unknown) => String(name).trim())
      : [];

    if (
      !teamName ||
      names.length < 1 ||
      names.length > 4 ||
      names.some((name: string) => !name)
    ) {
      return NextResponse.json(
        { error: "Enter a team name and every crew member name." },
        { status: 400 }
      );
    }

    const sessionToken = randomBytes(32).toString("hex");

    const team = await prisma.team.create({
      data: {
        teamName,
        sessionToken,
        currentStage: "CLUE_1",

        members: {
          create: names.map((name: string) => ({
            name,
          })),
        },

        progress: {
          create: {
            stage: "CLUE_1",
            status: "STARTED",
            startedAt: new Date(),
          },
        },
      },
    });

    const response = NextResponse.json({
      success: true,
      teamId: team.id,
    });

    response.cookies.set("hunt_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;

  } catch (error) {
    console.error("TEAM CREATION ERROR:", error);

    return NextResponse.json(
      {
        error:
          "The crew could not be created. Check the terminal for the database error.",
      },
      { status: 500 }
    );
  }
}