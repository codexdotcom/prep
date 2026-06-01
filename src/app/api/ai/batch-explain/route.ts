import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAIResponse, buildQuestionContext, EXPLANATION_SYSTEM_PROMPT } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionIds, limit } = await req.json();

    // Get questions without explanations
    const where: any = { explanation: null, isActive: true };
    if (questionIds?.length) {
      where.id = { in: questionIds };
    }

    const questions = await db.question.findMany({
      where,
      include: { topic: { select: { name: true } } },
      take: limit || 10,
    });

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const question of questions) {
      const context = buildQuestionContext(question);

      const { text, error } = await generateAIResponse(
        EXPLANATION_SYSTEM_PROMPT,
        [{ role: "user", content: `Explain this JAMB question:\n\n${context}` }],
        600
      );

      if (text && !error) {
        await db.question.update({
          where: { id: question.id },
          data: { explanation: text },
        });
        results.push({ id: question.id, success: true });
      } else {
        results.push({ id: question.id, success: false, error: error || "Unknown" });
      }

      // Rate limit: wait between requests
      await new Promise((r) => setTimeout(r, 500));
    }

    return NextResponse.json({
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Batch explain error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}