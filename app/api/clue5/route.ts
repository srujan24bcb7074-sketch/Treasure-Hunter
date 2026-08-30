import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  question: string;
  choices: Choice[];
  correct: string;
};

type AttemptRecord = {
  id: string;
  teamId: string;
  questionId: number;
  choiceId: string;
  correct: boolean;
  createdAt: Date;
};

const MAX_WRONG = 3;
const MAX_CORRECT = 3;

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is Goku's Saiyan name?",
    choices: [
      { id: "a", text: "Bardock" },
      { id: "b", text: "Kakarot" },
      { id: "c", text: "Raditz" },
      { id: "d", text: "Turles" },
    ],
    correct: "b",
  },
  {
    id: 2,
    question: "Who is Goku's brother?",
    choices: [
      { id: "a", text: "Nappa" },
      { id: "b", text: "Raditz" },
      { id: "c", text: "Turles" },
      { id: "d", text: "Bardock" },
    ],
    correct: "b",
  },
  {
    id: 3,
    question: "Which planet was Vegeta's original home world?",
    choices: [
      { id: "a", text: "Sadala" },
      { id: "b", text: "Plant" },
      { id: "c", text: "Planet Vegeta" },
      { id: "d", text: "Cereal" },
    ],
    correct: "c",
  },
  {
    id: 4,
    question: "Who created Cell?",
    choices: [
      { id: "a", text: "Dr. Myuu" },
      { id: "b", text: "Dr. Gero" },
      { id: "c", text: "Dr. Hedo" },
      { id: "d", text: "Dr. Brief" },
    ],
    correct: "b",
  },
  {
    id: 5,
    question: "Who ultimately defeated Kid Buu?",
    choices: [
      { id: "a", text: "Vegeta" },
      { id: "b", text: "Gohan" },
      { id: "c", text: "Goku" },
      { id: "d", text: "Uub" },
    ],
    correct: "c",
  },
  {
    id: 6,
    question: "Which technique is most closely associated with Master Roshi's teachings and later became Goku's signature attack?",
    choices: [
      { id: "a", text: "Final Flash" },
      { id: "b", text: "Galick Gun" },
      { id: "c", text: "Kamehameha" },
      { id: "d", text: "Masenko" },
    ],
    correct: "c",
  },
  {
    id: 7,
    question: "Who trained Gohan alongside Goku during their preparation for the Cell Games in the Hyperbolic Time Chamber?",
    choices: [
      { id: "a", text: "Piccolo" },
      { id: "b", text: "Vegeta" },
      { id: "c", text: "Goku" },
      { id: "d", text: "Kami" },
    ],
    correct: "c",
  },
  {
    id: 8,
    question: "Which description most accurately identifies Frieza's race?",
    choices: [
      { id: "a", text: "Frost Demon" },
      { id: "b", text: "Arcosian" },
      { id: "c", text: "Changeling" },
      { id: "d", text: "Frieza Race" },
    ],
    correct: "d",
  },
  {
    id: 9,
    question:
      "What is the fusion form created when Goku and Vegeta fuse using the Potara earrings?",
    choices: [
      { id: "a", text: "Gogeta" },
      { id: "b", text: "Vegito" },
      { id: "c", text: "Kefla" },
      { id: "d", text: "Gotenks" },
    ],
    correct: "b",
  },
  {
    id: 10,
    question: "Who is generally regarded as the strongest member of the Pride Troopers?",
    choices: [
      { id: "a", text: "Toppo" },
      { id: "b", text: "Dyspo" },
      { id: "c", text: "Jiren" },
      { id: "d", text: "Kahseral" },
    ],
    correct: "c",
  },
];

const LOCATIONS = [
  "THE FIRST SIGNAL — Beneath a sky-blue cap, where something ordinary conceals what you seek.",
  "THE SECOND SIGNAL — In the northwestern corner of the room, where the room keeps its quietest secret.",
  "THE THIRD SIGNAL — Within a grey bag, hidden among the things that appear to belong there.",
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getQuestionOrder(attempts: AttemptRecord[]): number[] {
  const answeredIds = new Set(
    attempts.map((attempt: AttemptRecord) => attempt.questionId)
  );

  const available = QUESTIONS
    .filter((question: Question) => !answeredIds.has(question.id))
    .map((question: Question) => question.id);

  return shuffle(available);
}

function getQuestionById(id: number): Question | undefined {
  return QUESTIONS.find((question: Question) => question.id === id);
}

function publicQuestion(question: Question | undefined) {
  if (!question) {
    return null;
  }

  return {
    id: question.id,
    question: question.question,
    choices: question.choices,
  };
}

function getStatus(attempts: AttemptRecord[]) {
  const correctCount = attempts.filter(
    (attempt: AttemptRecord) => attempt.correct
  ).length;

  const wrongCount = attempts.filter(
    (attempt: AttemptRecord) => !attempt.correct
  ).length;

  return {
    correctCount,
    wrongCount,
    complete: correctCount >= MAX_CORRECT || wrongCount >= MAX_WRONG,
    won: correctCount >= MAX_CORRECT,
    lost: wrongCount >= MAX_WRONG,
  };
}

function getRemainingAttempts(wrongCount: number): number {
  return Math.max(MAX_WRONG - wrongCount, 0);
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

    if (team.currentStage !== "CLUE_5") {
      return NextResponse.json(
        {
          error: "Clue 5 is not the current stage.",
          currentStage: team.currentStage,
        },
        { status: 409 }
      );
    }

    const attempts = (await prisma.clue5Attempt.findMany({
      where: {
        teamId: team.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as AttemptRecord[];

    const status = getStatus(attempts);

    if (status.complete) {
      return NextResponse.json({
        complete: true,
        won: status.won,
        lost: status.lost,
        correctCount: status.correctCount,
        wrongCount: status.wrongCount,
        remainingAttempts: getRemainingAttempts(status.wrongCount),
        locations: attempts
          .filter((attempt: AttemptRecord) => attempt.correct)
          .map(
            (_attempt: AttemptRecord, index: number) =>
              LOCATIONS[index] ?? null
          )
          .filter(Boolean),
      });
    }

    /*
     * We randomize the remaining unanswered questions.
     * Because answered question IDs are excluded, a question
     * can never be shown twice.
     */
    const remainingIds = getQuestionOrder(attempts);

    const nextQuestionId = remainingIds[0];

    const nextQuestion = getQuestionById(nextQuestionId);

    return NextResponse.json({
      complete: false,
      question: publicQuestion(nextQuestion),
      correctCount: status.correctCount,
      wrongCount: status.wrongCount,
      remainingAttempts: getRemainingAttempts(status.wrongCount),
      totalQuestions: QUESTIONS.length,
      answeredQuestions: attempts.length,
    });
  } catch (error) {
    console.error("CLUE 5 GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load Clue 5.",
      },
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

    if (team.currentStage !== "CLUE_5") {
      return NextResponse.json(
        {
          error: "Clue 5 is not the current stage.",
          currentStage: team.currentStage,
        },
        { status: 409 }
      );
    }

    const body = await req.json();

    const questionId = Number(body.questionId);
    const choiceId = String(body.choiceId ?? "");

    const question = getQuestionById(questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Invalid question." },
        { status: 400 }
      );
    }

    const choice = question.choices.find(
      (item: Choice) => item.id === choiceId
    );

    if (!choice) {
      return NextResponse.json(
        { error: "Invalid answer choice." },
        { status: 400 }
      );
    }

    const existingAttempts = (await prisma.clue5Attempt.findMany({
      where: {
        teamId: team.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as AttemptRecord[];

    const statusBefore = getStatus(existingAttempts);

    if (statusBefore.complete) {
      return NextResponse.json(
        {
          error: "This investigation has already ended.",
        },
        { status: 409 }
      );
    }

    const alreadyAnswered = existingAttempts.some(
      (attempt: AttemptRecord) => attempt.questionId === questionId
    );

    if (alreadyAnswered) {
      return NextResponse.json(
        {
          error: "That question has already been answered.",
        },
        { status: 409 }
      );
    }

    const correct = choiceId === question.correct;

    const attempt = await prisma.clue5Attempt.create({
      data: {
        teamId: team.id,
        questionId,
        choiceId,
        correct,
      },
    });

    const allAttempts = [
      ...existingAttempts,
      attempt as AttemptRecord,
    ];

    const statusAfter = getStatus(allAttempts);

    /*
     * CORRECT ANSWER
     */
    if (correct) {
      const locationIndex = statusAfter.correctCount - 1;
      const location = LOCATIONS[locationIndex];

      /*
       * Three correct answers = successful completion.
       */
      if (statusAfter.won) {
        return NextResponse.json({
          ok: true,
          correct: true,
          complete: true,
          won: true,
          lost: false,
          message:
            "THE SIGNAL IS COMPLETE. THREE ANSWERS ALIGN. THE HIDDEN TRAIL HAS BEEN REVEALED.",
          location,
          locations: allAttempts
            .filter((item: AttemptRecord) => item.correct)
            .map(
              (_item: AttemptRecord, index: number) =>
                LOCATIONS[index] ?? null
            )
            .filter(Boolean),
          correctCount: statusAfter.correctCount,
          wrongCount: statusAfter.wrongCount,
          remainingAttempts: getRemainingAttempts(
            statusAfter.wrongCount
          ),
        });
      }

      /*
       * Correct, but investigation continues.
       */
      const remainingIds = getQuestionOrder(allAttempts);
      const nextQuestion = getQuestionById(remainingIds[0]);

      return NextResponse.json({
        ok: true,
        correct: true,
        complete: false,
        won: false,
        lost: false,
        message: "CORRECT. ANOTHER FRAGMENT FALLS INTO PLACE.",
        location,
        correctCount: statusAfter.correctCount,
        wrongCount: statusAfter.wrongCount,
        remainingAttempts: getRemainingAttempts(
          statusAfter.wrongCount
        ),
        nextQuestion: publicQuestion(nextQuestion),
      });
    }

    /*
     * WRONG ANSWER
     */
    if (statusAfter.lost) {
      return NextResponse.json({
        ok: true,
        correct: false,
        complete: true,
        won: false,
        lost: true,
        message:
          "NO ATTEMPTS LEFT. NOW RELY ON YOURSELF TO FIGURE OUT THE MYSTERY.",
        correctCount: statusAfter.correctCount,
        wrongCount: statusAfter.wrongCount,
        remainingAttempts: 0,
        locations: allAttempts
          .filter((item: AttemptRecord) => item.correct)
          .map(
            (_item: AttemptRecord, index: number) =>
              LOCATIONS[index] ?? null
          )
          .filter(Boolean),
      });
    }

    const remainingAttempts = getRemainingAttempts(
      statusAfter.wrongCount
    );

    let message = "";

    if (remainingAttempts === 2) {
      message =
        "INCORRECT. YOU HAVE 2 ATTEMPTS LEFT. THE TRAIL REMAINS OPEN.";
    } else if (remainingAttempts === 1) {
      message =
        "INCORRECT. YOU HAVE 1 ATTEMPT LEFT. CHOOSE YOUR NEXT ANSWER CAREFULLY.";
    }

    /*
     * Wrong answers do NOT repeat the question.
     * A completely new unanswered question is supplied.
     */
    const remainingIds = getQuestionOrder(allAttempts);
    const nextQuestion = getQuestionById(remainingIds[0]);

    return NextResponse.json({
      ok: true,
      correct: false,
      complete: false,
      won: false,
      lost: false,
      message,
      correctCount: statusAfter.correctCount,
      wrongCount: statusAfter.wrongCount,
      remainingAttempts,
      nextQuestion: publicQuestion(nextQuestion),
    });
  } catch (error) {
    console.error("CLUE 5 POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to process the answer.",
      },
      { status: 500 }
    );
  }
}