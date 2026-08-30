import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CONFIRMATION_TEXT = "RESET ALL TEAMS";

export async function POST(req: Request) {
  try {
    /*
     * Safety check.
     *
     * Set ADMIN_RESET_KEY in your .env file.
     *
     * Example:
     * ADMIN_RESET_KEY="your-private-reset-key"
     */
    const configuredKey = process.env.ADMIN_RESET_KEY;

    if (!configuredKey) {
      return NextResponse.json(
        {
          error:
            "Admin reset is disabled because ADMIN_RESET_KEY is not configured.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();

    const confirmation = String(body.confirmation ?? "");
    const resetKey = String(body.resetKey ?? "");

    if (confirmation !== CONFIRMATION_TEXT) {
      return NextResponse.json(
        {
          error: `You must type exactly: ${CONFIRMATION_TEXT}`,
        },
        { status: 400 }
      );
    }

    if (resetKey !== configuredKey) {
      return NextResponse.json(
        {
          error: "Invalid admin reset key.",
        },
        { status: 403 }
      );
    }

    /*
     * Count before deletion so the admin gets a useful result.
     */
    const teamCount = await prisma.team.count();

    /*
     * Team has cascading relations to:
     *
     * CrewMember
     * StageProgress
     * Clue2Question
     * Clue3Attempt
     * Clue4Message
     * Clue4Attempt
     * Clue5Question
     * Clue5Attempt
     * AdminEvent
     *
     * Therefore deleting the Team records clears the associated
     * hunt data while leaving all Prisma tables and schema intact.
     */
    await prisma.team.deleteMany({});

    return NextResponse.json({
      ok: true,
      deletedTeams: teamCount,
      message: `Successfully cleared ${teamCount} team(s) and their associated hunt data.`,
    });
  } catch (error) {
    console.error("ADMIN RESET ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to reset team data.",
      },
      { status: 500 }
    );
  }
}