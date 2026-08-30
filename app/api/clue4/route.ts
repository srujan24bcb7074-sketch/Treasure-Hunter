import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeam } from "@/lib/session";

const PENALTY_SECONDS = 60;

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  prompt: string;
  choices: Choice[];
  correct: string;
  success: string;
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: `I hold what a mouth can speak,
yet I have no voice.
I remember what a mind may forget.
What am I?`,
    choices: [
      { id: "mirror", text: "A mirror" },
      { id: "book", text: "A book" },
      { id: "key", text: "A key" },
      { id: "clock", text: "A clock" },
    ],
    correct: "book",
    success: "Good. You understand the vessel.",
  },

  {
    id: 2,
    prompt: `A name written once can disappear.
A name written here can remain.

What matters more —
the hand that writes,
or the place that receives it?`,
    choices: [
      { id: "hand", text: "The hand" },
      { id: "place", text: "The place" },
      { id: "both", text: "Both equally" },
      { id: "neither", text: "Neither" },
    ],
    correct: "place",
    success: "You are looking at the container, not the writer.",
  },

  {
    id: 3,
    prompt: `The object is not valuable because of
what it is made from.

Its value comes from what it can contain.

What does it need?`,
    choices: [
      { id: "photograph", text: "A photograph" },
      { id: "name", text: "A name" },
      { id: "lock", text: "A lock" },
      { id: "mirror", text: "A mirror" },
    ],
    correct: "name",
    success: "Words leave traces. Names leave deeper ones.",
  },

  {
    id: 4,
    prompt: `Imagine a shelf of a hundred books.

You have no title.
You have no author.

You have only one instruction:

FIND THE DARK ONE.

What would you search first?`,
    choices: [
      { id: "size", text: "Size" },
      { id: "color", text: "Color" },
      { id: "age", text: "Age" },
      { id: "pages", text: "Number of pages" },
    ],
    correct: "color",
    success: "Now you are beginning to see the pattern.",
  },

  {
    id: 5,
    prompt: `Not white enough to disappear.
Not red enough to warn.
Not bright enough to attract the eye.

Which absence of light are you looking for?`,
    choices: [
      { id: "grey", text: "Grey" },
      { id: "blue", text: "Blue" },
      { id: "black", text: "Black" },
      { id: "brown", text: "Brown" },
    ],
    correct: "black",
    success: "The color is no longer a mystery.",
  },

  {
    id: 6,
    prompt: `You have the container.

You have the mark.

You have the thing that must be placed inside it.

What remains?`,
    choices: [
      { id: "find", text: "Find it" },
      { id: "hide", text: "Hide it" },
      { id: "burn", text: "Burn it" },
      { id: "forget", text: "Forget it" },
    ],
    correct: "find",
    success: "Then stop searching the screen.",
  },

  {
    id: 7,
    prompt: `THE FINAL PROMPT

BLACK
BOOK
NAME
FIND

Rearrange the instruction.`,
    choices: [
      {
        id: "find-black-book",
        text: "FIND THE BLACK BOOK",
      },
      {
        id: "black-find-book",
        text: "BLACK FIND BOOK",
      },
      {
        id: "book-black-find",
        text: "BOOK BLACK FIND",
      },
      {
        id: "find-book-black",
        text: "FIND THE BOOK BLACK",
      },
    ],
    correct: "find-black-book",
    success: "Then you know what you are looking for.",
  },
];

function getQuestion(id: number) {
  return QUESTIONS.find((question) => question.id === id);
}

/**
 * Gets all Clue 4 attempts for the current team.
 */
async function getAttempts(teamId: string) {
  return prisma.clue4Attempt.findMany({
    where: {
      teamId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Determines the current question.
 *
 * IMPORTANT:
 * A wrong answer does NOT advance the question.
 *
 * Therefore only questions with a successful/correct
 * attempt count as completed.
 */
function getCurrentQuestionNumber(
  attempts: Array<{
    questionId: number;
    correct: boolean;
  }>
) {
  const completedQuestions = new Set(
    attempts
      .filter((attempt) => attempt.correct)
      .map((attempt) => attempt.questionId)
  );

  const nextQuestion = QUESTIONS.find(
    (question) => !completedQuestions.has(question.id)
  );

  return nextQuestion?.id ?? QUESTIONS.length;
}

/**
 * Calculates the total penalty accumulated during Clue 4.
 */
function getPenaltySeconds(
  attempts: Array<{
    penaltySeconds: number;
  }>
) {
  return attempts.reduce(
    (total, attempt) => total + attempt.penaltySeconds,
    0
  );
}

export async function GET() {
  try {
    const team = await getCurrentTeam();

    if (!team) {
      return NextResponse.json(
        {
          error: "No active team session.",
        },
        {
          status: 401,
        }
      );
    }

    if (team.currentStage !== "CLUE_4") {
      return NextResponse.json(
        {
          error: "Clue 4 is not the current stage.",
          currentStage: team.currentStage,
        },
        {
          status: 409,
        }
      );
    }

    const attempts = await getAttempts(team.id);

    const currentQuestionNumber =
      getCurrentQuestionNumber(attempts);

    const question = getQuestion(currentQuestionNumber);

    if (!question) {
      return NextResponse.json(
        {
          error: "Unable to determine the current question.",
        },
        {
          status: 500,
        }
      );
    }

    const penaltySeconds = getPenaltySeconds(attempts);

    return NextResponse.json({
      question,
      questionNumber: currentQuestionNumber,
      totalQuestions: QUESTIONS.length,
      penaltySeconds,
    });
  } catch (error) {
    console.error("CLUE 4 GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load Clue 4.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const team = await getCurrentTeam();

    if (!team) {
      return NextResponse.json(
        {
          error: "No active team session.",
        },
        {
          status: 401,
        }
      );
    }

    if (team.currentStage !== "CLUE_4") {
      return NextResponse.json(
        {
          error: "Clue 4 is not the current stage.",
          currentStage: team.currentStage,
        },
        {
          status: 409,
        }
      );
    }

    const body = await req.json();

    const questionId = Number(body.questionId);
    const choiceId = String(body.choiceId ?? "");

    const question = getQuestion(questionId);

    if (!question) {
      return NextResponse.json(
        {
          error: "Invalid question.",
        },
        {
          status: 400,
        }
      );
    }

    const choice = question.choices.find(
      (item) => item.id === choiceId
    );

    if (!choice) {
      return NextResponse.json(
        {
          error: "Invalid choice.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Get the real progress from Clue4Attempt.
     *
     * We deliberately do NOT use StageProgress.attempts.
     */
    const attempts = await getAttempts(team.id);

    const expectedQuestion =
      getCurrentQuestionNumber(attempts);

    /*
     * Prevent answering an old question or jumping
     * ahead by manually changing the request.
     */
    if (questionId !== expectedQuestion) {
      return NextResponse.json(
        {
          error: "That is not the current question.",
          expectedQuestion,
          receivedQuestion: questionId,
        },
        {
          status: 409,
        }
      );
    }

    const correct = choiceId === question.correct;

    /*
     * WRONG ANSWER
     *
     * Record the attempt.
     *
     * The important part:
     * correct = false
     * penaltySeconds = 60
     *
     * Because it is NOT correct, the next GET/POST
     * will still return this same question.
     */
    if (!correct) {
      await prisma.clue4Attempt.create({
        data: {
          teamId: team.id,
          questionId,
          choiceId,
          correct: false,
          penaltySeconds: PENALTY_SECONDS,
        },
      });

      const newPenaltySeconds =
        getPenaltySeconds(attempts) +
        PENALTY_SECONDS;

      return NextResponse.json({
        ok: true,
        correct: false,
        final: false,
        penaltySeconds: newPenaltySeconds,
        message:
          "+1:00 PENALTY. THE INVESTIGATION CONTINUES.",
      });
    }

    /*
     * CORRECT ANSWER
     *
     * Record it with zero penalty.
     */
    await prisma.clue4Attempt.create({
      data: {
        teamId: team.id,
        questionId,
        choiceId,
        correct: true,
        penaltySeconds: 0,
      },
    });

    /*
     * Q1 -> Q6
     *
     * Advance to the next question.
     */
    if (questionId < QUESTIONS.length) {
      const nextQuestion = getQuestion(
        questionId + 1
      );

      if (!nextQuestion) {
        return NextResponse.json(
          {
            error:
              "Unable to load the next question.",
          },
          {
            status: 500,
          }
        );
      }

      const updatedAttempts = [
        ...attempts,
        {
          questionId,
          correct: true,
          penaltySeconds: 0,
        },
      ];

      return NextResponse.json({
        ok: true,
        correct: true,
        final: false,
        message: question.success,
        nextQuestion,
        nextQuestionNumber: nextQuestion.id,
        penaltySeconds:
          getPenaltySeconds(updatedAttempts),
      });
    }

    /*
     * Q7 CORRECT
     *
     * Clue 4 is complete.
     *
     * Move the team to Clue 5.
     */
    const progress = await prisma.stageProgress.findFirst({
      where: {
        teamId: team.id,
        stage: "CLUE_4",
        status: "STARTED",
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (!progress) {
      return NextResponse.json(
        {
          error: "Clue 4 progress was not found.",
        },
        {
          status: 409,
        }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.stageProgress.update({
        where: {
          id: progress.id,
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      }),

      prisma.stageProgress.create({
        data: {
          teamId: team.id,
          stage: "CLUE_5",
          status: "STARTED",
          startedAt: now,
        },
      }),

      prisma.team.update({
        where: {
          id: team.id,
        },
        data: {
          currentStage: "CLUE_5",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      correct: true,
      final: true,
      message:
        "THE CODE IS COMPLETE. FIND THE BLACK BOOK.",
      nextStage: "CLUE_5",
    });
  } catch (error) {
    console.error("CLUE 4 POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to process the answer.",
      },
      {
        status: 500,
      }
    );
  }
}