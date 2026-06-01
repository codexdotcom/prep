import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string(),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  timeSpent: z.number().min(0),
  isFlagged: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const validated = answerSchema.parse(body);

    // Verify session belongs to user
    const testSession = await db.testSession.findFirst({
      where: { id: sessionId, userId: session.user.id, status: "IN_PROGRESS" },
    });

    if (!testSession) {
      return NextResponse.json({ error: "Session not found or already completed" }, { status: 404 });
    }

    // Get correct answer
    const question = await db.question.findUnique({
      where: { id: validated.questionId },
      select: { correctOption: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = validated.selectedOption
      ? validated.selectedOption === question.correctOption
      : null;

    // Upsert response (allow changing answers)
    const response = await db.questionResponse.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId: validated.questionId,
        },
      },
      update: {
        selectedOption: validated.selectedOption,
        isCorrect,
        timeSpent: validated.timeSpent,
        isFlagged: validated.isFlagged,
        answeredAt: new Date(),
      },
      create: {
        sessionId,
        questionId: validated.questionId,
        userId: session.user.id,
        selectedOption: validated.selectedOption,
        isCorrect,
        timeSpent: validated.timeSpent,
        isFlagged: validated.isFlagged,
      },
    });

    return NextResponse.json({ saved: true, isCorrect });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Answer error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}