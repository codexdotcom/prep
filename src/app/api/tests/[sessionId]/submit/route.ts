import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, checkAndAwardAchievements, updateMissionProgress } from "@/lib/gamification";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { sessionId } = await params;

    const testSession = await db.testSession.findFirst({
      where: { id: sessionId, userId, status: "IN_PROGRESS" },
    });

    if (!testSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Gather all responses
    const responses = await db.questionResponse.findMany({
      where: { sessionId },
      include: {
        question: {
          select: {
            id: true,
            topicId: true,
            correctOption: true,
            difficulty: true,
          },
        },
      },
    });

    // Calculate results FIRST
    const totalCorrect = responses.filter((r) => r.isCorrect === true).length;
    const totalWrong = responses.filter((r) => r.isCorrect === false).length;
    const totalSkipped = testSession.totalQuestions - responses.length;
    const score = Math.round((totalCorrect / testSession.totalQuestions) * 400);

    // Build topic accuracy map
    const topicAccuracy: Record<string, { correct: number; total: number }> = {};
    responses.forEach((r) => {
      const tid = r.question.topicId;
      if (!topicAccuracy[tid]) topicAccuracy[tid] = { correct: 0, total: 0 };
      topicAccuracy[tid].total++;
      if (r.isCorrect) topicAccuracy[tid].correct++;
    });

    // Build time distribution
    const timeDistribution: Record<string, number> = {};
    responses.forEach((r) => {
      timeDistribution[r.questionId] = r.timeSpent;
    });

    const timeTaken = responses.reduce((sum, r) => sum + r.timeSpent, 0) / 1000;

    // Flagged questions
    const flaggedQuestions = responses
      .filter((r) => r.isFlagged)
      .map((r) => r.questionId);

    // Update session
    await db.testSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        score,
        totalCorrect,
        totalWrong,
        totalSkipped,
        timeTaken: Math.round(timeTaken),
        topicAccuracy,
        timeDistribution,
        flaggedQuestions,
        completedAt: new Date(),
      },
    });

    // Gamification — AFTER results are calculated
    const isMock = testSession.mode === "MOCK_EXAM";
    const baseXP = isMock ? 50 : 25;
    const correctBonus = totalCorrect * 5;
    const totalXPEarned = baseXP + correctBonus;

    await awardXP(
      userId,
      totalXPEarned,
      "TEST_COMPLETE",
      sessionId,
      `${totalCorrect}/${testSession.totalQuestions} correct`
    ).catch(console.error);

    await updateMissionProgress(userId, "COMPLETE_TEST", 1).catch(console.error);
    await updateMissionProgress(userId, "ANSWER_QUESTIONS", responses.length).catch(console.error);

    if (testSession.mode === "WEAK_TOPIC" || testSession.mode === "TOPIC_DRILL") {
      await updateMissionProgress(userId, "REVIEW_WEAK", 1).catch(console.error);
    }

    await checkAndAwardAchievements(userId).catch(console.error);

    // Update question-level stats (async, non-blocking)
    updateQuestionStats(responses).catch(console.error);

    return NextResponse.json({
      score,
      totalCorrect,
      totalWrong,
      totalSkipped,
      timeTaken: Math.round(timeTaken),
      topicAccuracy,
      totalQuestions: testSession.totalQuestions,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function updateQuestionStats(
  responses: Array<{
    questionId: string;
    isCorrect: boolean | null;
    timeSpent: number;
  }>
) {
  for (const r of responses) {
    const stats = await db.questionResponse.aggregate({
      where: { questionId: r.questionId },
      _count: true,
      _avg: { timeSpent: true },
    });

    const correctCount = await db.questionResponse.count({
      where: { questionId: r.questionId, isCorrect: true },
    });

    await db.question.update({
      where: { id: r.questionId },
      data: {
        totalAttempts: stats._count,
        avgTimeMs: Math.round(stats._avg.timeSpent ?? 0),
        correctRate: stats._count > 0 ? correctCount / stats._count : null,
      },
    });
  }
}