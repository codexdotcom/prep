import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, answers } = await req.json();
    // answers: [{ questionId, selectedOption, timeSpent }]

    const testSession = await db.postUtmeSession.findUnique({
      where: { id: sessionId },
      include: { exam: { include: { questions: true } } },
    });

    if (!testSession || testSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const questionMap = new Map(testSession.exam.questions.map((q) => [q.id, q]));
    let totalCorrect = 0;

    for (const a of answers) {
      const q = questionMap.get(a.questionId);
      if (!q) continue;
      const isCorrect = a.selectedOption === q.correctOption;
      if (isCorrect) totalCorrect++;

      await db.postUtmeResponse.upsert({
        where: { sessionId_questionId: { sessionId, questionId: a.questionId } },
        update: { selectedOption: a.selectedOption, isCorrect, timeSpent: a.timeSpent || 0 },
        create: { sessionId, questionId: a.questionId, selectedOption: a.selectedOption, isCorrect, timeSpent: a.timeSpent || 0 },
      });
    }

    const score = Math.round((totalCorrect / testSession.exam.questions.length) * 100);

    await db.postUtmeSession.update({
      where: { id: sessionId },
      data: { score, totalAnswered: answers.length, totalCorrect, completedAt: new Date(), status: "COMPLETED" },
    });

    // Build review
    const review = testSession.exam.questions.map((q) => {
      const a = answers.find((ans: any) => ans.questionId === q.id);
      return {
        id: q.id,
        body: q.body,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        selectedOption: a?.selectedOption || null,
        isCorrect: a?.selectedOption === q.correctOption,
        explanation: q.explanation,
      };
    });

    return NextResponse.json({ score, totalCorrect, totalQuestions: testSession.exam.questions.length, review });
  } catch (error) {
    console.error("Submit post-UTME error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}