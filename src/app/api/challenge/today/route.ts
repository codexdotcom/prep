import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateTodaysChallenge } from "@/lib/daily-challenge";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const challenge = await getOrCreateTodaysChallenge();

    // Check if user already attempted
    const attempt = await db.dailyChallengeAttempt.findUnique({
      where: {
        userId_challengeId: { userId, challengeId: challenge.id },
      },
    });

    // Get questions
    const questions = await db.question.findMany({
      where: { id: { in: challenge.questionIds } },
      select: {
        id: true,
        body: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        difficulty: true,
        topic: { select: { name: true } },
      },
    });

    // Sort by the challenge order

const orderMap = new Map<string, number>(challenge.questionIds.map((id, i) => [id, i]));
questions.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    // Get leaderboard for today
    const leaderboard = await db.dailyChallengeAttempt.findMany({
      where: { challengeId: challenge.id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ accuracy: "desc" }, { timeTaken: "asc" }],
      take: 20,
    });

    const totalAttempts = await db.dailyChallengeAttempt.count({
      where: { challengeId: challenge.id },
    });

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        subject: challenge.subject,
        topicName: (challenge as any).topic?.name || null,
        timeLimit: challenge.timeLimit,
        xpReward: challenge.xpReward,
        bonusXP: challenge.bonusXP,
        totalQuestions: challenge.questionIds.length,
      },
      questions: attempt ? [] : questions, // don't re-send if already attempted
      completed: !!attempt,
      myAttempt: attempt
        ? {
            score: attempt.score,
            accuracy: attempt.accuracy,
            timeTaken: attempt.timeTaken,
            rank: attempt.rank,
            xpEarned: attempt.xpEarned,
          }
        : null,
      leaderboard: leaderboard.map((entry, i) => ({
        rank: i + 1,
        name: entry.user.profile
          ? `${entry.user.profile.firstName} ${entry.user.profile.lastName?.charAt(0) || ""}.`
          : entry.user.name || "Student",
        image: entry.user.image,
        score: entry.score,
        accuracy: Math.round(entry.accuracy * 100),
        timeTaken: entry.timeTaken,
        isCurrentUser: entry.userId === userId,
      })),
      totalAttempts,
    });
  } catch (error) {
    console.error("Daily challenge error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}