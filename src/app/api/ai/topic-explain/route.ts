import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAIResponse, TUTOR_SYSTEM_PROMPT } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, subject, specificArea } = await req.json();

    let topicName = specificArea || "this topic";
    let subjectName = subject?.replace(/_/g, " ") || "";

    if (topicId) {
      const topic = await db.topic.findUnique({ where: { id: topicId } });
      if (topic) {
        topicName = topic.name;
        subjectName = topic.subject.replace(/_/g, " ");
      }
    }

    // Get student's weak areas in this topic for targeted explanation
    const responses = await db.questionResponse.findMany({
      where: {
        userId: session.user.id,
        question: topicId ? { topicId } : { subject: subject as any },
        isCorrect: false,
        session: { status: "COMPLETED" },
      },
      include: {
        question: { select: { body: true, correctOption: true, explanation: true } },
      },
      orderBy: { answeredAt: "desc" },
      take: 5,
    });

    const mistakeContext = responses.length > 0
      ? `\n\nThe student has gotten these questions wrong recently:\n${responses
          .map((r, i) => `${i + 1}. "${r.question.body}" (correct: ${r.question.correctOption})`)
          .join("\n")}`
      : "";

    const prompt = `Teach me about "${topicName}" in ${subjectName} for JAMB preparation.${mistakeContext}

Give me:
1. A clear, simple explanation of the core concepts
2. Key formulas or rules to remember (if applicable)
3. Common mistakes students make
4. 2-3 worked examples
5. Memory tricks or mnemonics

Keep it focused and exam-oriented. I need to understand this well enough to answer JAMB questions on it.`;

    const { text, error } = await generateAIResponse(
      TUTOR_SYSTEM_PROMPT,
      [{ role: "user", content: prompt }],
      1500
    );

    if (error) {
      return NextResponse.json({ error }, { status: 503 });
    }

    return NextResponse.json({ explanation: text, topicName, subject: subjectName });
  } catch (error) {
    console.error("Topic explain error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}