import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateAIResponse,
  buildQuestionContext,
  TUTOR_SYSTEM_PROMPT,
} from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, questionId, conversationHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // Fetch ALL database data FIRST, before the long AI call
    const [profile, question] = await Promise.all([
      db.studentProfile.findUnique({
        where: { userId: session.user.id },
      }),
      questionId
        ? db.question.findUnique({
            where: { id: questionId },
            include: { topic: { select: { name: true } } },
          })
        : Promise.resolve(null),
    ]);

    // Build context from the data we already fetched
    let systemPrompt = TUTOR_SYSTEM_PROMPT;

    if (question) {
      const questionContext = buildQuestionContext(question);
      systemPrompt += `\n\nThe student is asking about this specific question:\n${questionContext}`;
    }

    if (profile) {
      systemPrompt += `\n\nStudent info: ${profile.firstName}, targeting ${profile.targetScore} in JAMB ${profile.examYear}. Class: ${profile.classLevel || "unknown"}. Learning style: ${profile.learningStyle || "mixed"}.`;
    }

    // Build message history
    const messages = [
      ...(conversationHistory || []).slice(-10).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // NOW make the long AI call — no more DB queries after this
    const { text, error } = await generateAIResponse(systemPrompt, messages, 1024);

    if (error) {
      return NextResponse.json({ error }, { status: 503 });
    }

    return NextResponse.json({
      response: text,
      role: "assistant",
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}