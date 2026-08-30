import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

const transitions = [
  { env: "QR2_TOKEN", currentStage: "CLUE_1", nextStage: "CLUE_2" as const },
  { env: "QR3_TOKEN", currentStage: "CLUE_2", nextStage: "CLUE_3" as const },
  { env: "QR4_TOKEN", currentStage: "CLUE_3", nextStage: "CLUE_4" as const },
  { env: "QR5_TOKEN", currentStage: "CLUE_4", nextStage: "CLUE_5" as const },
];

export async function POST(req: Request) {
  const team = await getCurrentTeam();
  if (!team) return NextResponse.json({ error: "No active team session." }, { status: 401 });

  const body = await req.json();
  const token = String(body.token ?? "").trim();
  const transition = transitions.find((item) => process.env[item.env] === token);

  if (!transition) return NextResponse.json({ error: "Unknown QR code." }, { status: 400 });

  if (team.currentStage !== transition.currentStage) {
    return NextResponse.json(
      { error: "This QR code is not the next step for your crew.", currentStage: team.currentStage },
      { status: 409 }
    );
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.stageProgress.updateMany({
      where: { teamId: team.id, stage: transition.currentStage as any, status: "STARTED" },
      data: { status: "COMPLETED", completedAt: now },
    }),
    prisma.stageProgress.create({
      data: { teamId: team.id, stage: transition.nextStage, status: "STARTED", startedAt: now },
    }),
    prisma.team.update({
      where: { id: team.id },
      data: { currentStage: transition.nextStage },
    }),
  ]);

  return NextResponse.json({ ok: true, nextStage: transition.nextStage, scannedAt: now.toISOString() });
}
