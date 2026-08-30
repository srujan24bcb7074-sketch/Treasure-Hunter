import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

const MAX_SELECTIONS = 5;

const QUESTIONS: Record<
  number,
  { text: string; answer: "YES" | "NO" }
> = {
  1: {
    text: "Is the character male?",
    answer: "YES",
  },
  2: {
    text: "Can the character transform into different forms?",
    answer: "YES",
  },
  3: {
    text: "Is the character associated with a clan?",
    answer: "YES",
  },
  4: {
    text: "Does the character have a signature technique or special move?",
    answer: "YES",
  },
  5: {
    text: "Does the character possess a special power that ordinary humans don't normally have?",
    answer: "YES",
  },
  6: {
    text: "Has the character's appearance changed significantly throughout their journey?",
    answer: "YES",
  },
  7: {
    text: "Has the character eventually held an important position of leadership?",
    answer: "YES",
  },
  8: {
    text: "Is the character primarily known for fighting with a sword?",
    answer: "NO",
  },
  9: {
    text: "Is the character a member of a pirate crew?",
    answer: "NO",
  },
  10: {
    text: "Does the character rely primarily on firearms as their main form of combat?",
    answer: "NO",
  },
  11: {
    text: "Is the character primarily associated with using a mechanical or technological weapon?",
    answer: "NO",
  },
  12: {
    text: "Is the character primarily known for using magic spells as their main ability?",
    answer: "NO",
  },
};

function publicSelections(items: any[]) {
  return items.map((item) => ({
    questionId: item.questionId,
    question: item.question,
    answer: item.response as "YES" | "NO",
  }));
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

    if (team.currentStage !== "CLUE_2") {
      return NextResponse.json(
        { error: "Clue 2 is not the current stage." },
        { status: 409 }
      );
    }

    const existing = await prisma.clue2Question.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      selections: publicSelections(existing),
      count: existing.length,
      maxSelections: MAX_SELECTIONS,
    });
  } catch (error) {
    console.error("CLUE 2 GET ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load Clue 2 progress." },
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

    if (team.currentStage !== "CLUE_2") {
      return NextResponse.json(
        { error: "Clue 2 is not the current stage." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const questionId = Number(body.questionId);
    const selectedQuestion = QUESTIONS[questionId];

    if (!Number.isInteger(questionId) || !selectedQuestion) {
      return NextResponse.json(
        { error: "Invalid question." },
        { status: 400 }
      );
    }

    const existing = await prisma.clue2Question.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "asc" },
    });

    if (
      existing.some(
        (item) => item.question === selectedQuestion.text
      )
    ) {
      return NextResponse.json(
        { error: "That question has already been selected." },
        { status: 409 }
      );
    }

    if (existing.length >= MAX_SELECTIONS) {
      return NextResponse.json(
        {
          error: "You have already selected all five questions.",
          selections: publicSelections(existing),
        },
        { status: 409 }
      );
    }

    await prisma.clue2Question.create({
      data: {
        teamId: team.id,
        question: selectedQuestion.text,
        response: selectedQuestion.answer,
        valid: true,
      },
    });

    const updated = await prisma.clue2Question.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      ok: true,
      answer: selectedQuestion.answer,
      selections: publicSelections(updated),
      count: updated.length,
      maxSelections: MAX_SELECTIONS,
      finished: updated.length === MAX_SELECTIONS,
    });
  } catch (error) {
    console.error("CLUE 2 ERROR:", error);

    return NextResponse.json(
      { error: "Unable to reveal the answer." },
      { status: 500 }
    );
  }
}