import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, updateMissionProgress } from "@/lib/gamification";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { challengeId, responses, timeTaken } = await req.json();

    // Verify challenge exists
    const challenge = await db.dailyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Check if already attempted
    const existing = await db.dailyChallengeAttempt.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already attempted today's challenge" }, { status: 409 });
    }

    // Grade responses
    const questionIds = Object.keys(responses);
    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctOption: true },
    });

    const correctMap = new Map(questions.map((q) => [q.id, q.correctOption]));
    let correctCount = 0;

    for (const [qid, selected] of Object.entries(responses)) {
      if (selected === correctMap.get(qid)) correctCount++;
    }

    const totalQuestions = challenge.questionIds.length;
    const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    // Calculate rank
    const betterAttempts = await db.dailyChallengeAttempt.count({
      where: {
        challengeId,
        OR: [
          { accuracy: { gt: accuracy } },
          { accuracy, timeTaken: { lt: timeTaken } },
        ],
      },
    });

    const rank = betterAttempts + 1;

    // Calculate XP
    let xpEarned = challenge.xpReward;
    const totalAttempts = await db.dailyChallengeAttempt.count({
      where: { challengeId },
    });

    // Bonus for top 10%
    if (totalAttempts > 5 && rank <= Math.ceil(totalAttempts * 0.1)) {
      xpEarned += challenge.bonusXP;
    }

    // Perfect score bonus
    if (accuracy === 1) {
      xpEarned += 25;
    }

    // Create attempt
    const attempt = await db.dailyChallengeAttempt.create({
      data: {
        userId,
        challengeId,
        score: correctCount,
        totalQuestions,
        timeTaken,
        accuracy,
        rank,
        xpEarned,
        responses,
      },
    });

    // Award XP
    await awardXP(userId, xpEarned, "TEST_COMPLETE", challengeId, `Daily Challenge: ${correctCount}/${totalQuestions}`).catch(console.error);
    await updateMissionProgress(userId, "COMPLETE_TEST", 1).catch(console.error);
    await updateMissionProgress(userId, "ANSWER_QUESTIONS", totalQuestions).catch(console.error);

    // Get correct answers for review
    const correctAnswers: Record<string, string> = {};
    questions.forEach((q) => { correctAnswers[q.id] = q.correctOption; });

    return NextResponse.json({
      score: correctCount,
      totalQuestions,
      accuracy: Math.round(accuracy * 100),
      timeTaken,
      rank,
      xpEarned,
      correctAnswers,
      isPerfect: accuracy === 1,
      isTopTen: totalAttempts > 5 && rank <= Math.ceil(totalAttempts * 0.1),
    });
  } catch (error) {
    console.error("Challenge submit error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}