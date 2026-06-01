import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateAIResponse,
  buildQuestionContext,
  EXPLANATION_SYSTEM_PROMPT,
} from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId, studentAnswer } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    const question = await db.question.findUnique({
      where: { id: questionId },
      include: { topic: { select: { name: true } } },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // If we already have a stored explanation and student got it right, return it
    if (question.explanation && studentAnswer === question.correctOption) {
      return NextResponse.json({
        explanation: question.explanation,
        source: "stored",
        isCorrect: true,
      });
    }

    // Generate AI explanation
    const context = buildQuestionContext(question);
    const studentContext = studentAnswer
      ? `\nThe student selected: ${studentAnswer} (${studentAnswer === question.correctOption ? "CORRECT" : "INCORRECT"})`
      : "";

    const { text, error } = await generateAIResponse(
      EXPLANATION_SYSTEM_PROMPT,
      [
        {
          role: "user",
          content: `Explain this JAMB question:

${context}${studentContext}

${
  studentAnswer && studentAnswer !== question.correctOption
    ? `The student chose ${studentAnswer}. Address why they might have picked this and where the reasoning went wrong.`
    : "Provide a complete explanation."
}`,
        },
      ],
      800
    );

    if (error) {
      // Fall back to stored explanation
      if (question.explanation) {
        return NextResponse.json({
          explanation: question.explanation,
          source: "stored",
          isCorrect: studentAnswer === question.correctOption,
        });
      }
      return NextResponse.json({ error }, { status: 503 });
    }

    // Store the explanation if we don't have one
    if (!question.explanation && text) {
      await db.question.update({
        where: { id: questionId },
        data: { explanation: text },
      }).catch(() => {});
    }

    return NextResponse.json({
      explanation: text,
      source: "ai",
      isCorrect: studentAnswer ? studentAnswer === question.correctOption : null,
      correctOption: question.correctOption,
    });
  } catch (error) {
    console.error("Explain error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}