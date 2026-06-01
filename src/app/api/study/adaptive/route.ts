import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const topicId = searchParams.get("topicId");

    if (!subject && !topicId) {
      return NextResponse.json({ error: "Provide subject or topicId" }, { status: 400 });
    }

    const userId = session.user.id;

    // Get recent responses for this subject/topic
    const whereClause: any = {
      userId,
      session: { status: "COMPLETED" },
    };

    if (topicId) {
      whereClause.question = { topicId };
    } else if (subject) {
      whereClause.question = { subject };
    }

    const responses = await db.questionResponse.findMany({
      where: whereClause,
      include: {
        question: { select: { difficulty: true, topicId: true } },
      },
      orderBy: { answeredAt: "desc" },
      take: 30,
    });

    if (responses.length < 5) {
      return NextResponse.json({
        recommendedDifficulty: "EASY",
        confidence: "low",
        reasoning: "Not enough data yet. Starting with easy questions to build a baseline.",
        distribution: { easy: 60, medium: 30, hard: 10 },
      });
    }

    // Calculate rolling accuracy by difficulty
    const diffStats: Record<string, { correct: number; total: number }> = {
      EASY: { correct: 0, total: 0 },
      MEDIUM: { correct: 0, total: 0 },
      HARD: { correct: 0, total: 0 },
    };

    for (const r of responses) {
      const diff = r.question.difficulty;
      diffStats[diff].total++;
      if (r.isCorrect) diffStats[diff].correct++;
    }

    const easyAcc = diffStats.EASY.total > 0 ? diffStats.EASY.correct / diffStats.EASY.total : 0;
    const medAcc = diffStats.MEDIUM.total > 0 ? diffStats.MEDIUM.correct / diffStats.MEDIUM.total : 0;
    const hardAcc = diffStats.HARD.total > 0 ? diffStats.HARD.correct / diffStats.HARD.total : 0;

    // Determine recommended difficulty using zone of proximal development
    // Sweet spot is 60-80% accuracy — challenging but not discouraging
    let recommendedDifficulty: string;
    let distribution: { easy: number; medium: number; hard: number };
    let reasoning: string;

    if (easyAcc < 0.6) {
      recommendedDifficulty = "EASY";
      distribution = { easy: 70, medium: 25, hard: 5 };
      reasoning = "Foundations need strengthening. Heavy focus on easy questions to build confidence and fill gaps.";
    } else if (easyAcc >= 0.8 && medAcc < 0.5) {
      recommendedDifficulty = "MEDIUM";
      distribution = { easy: 30, medium: 55, hard: 15 };
      reasoning = "Easy questions are solid. Time to push into medium difficulty to level up.";
    } else if (medAcc >= 0.7 && hardAcc < 0.4) {
      recommendedDifficulty = "HARD";
      distribution = { easy: 15, medium: 40, hard: 45 };
      reasoning = "Medium questions are comfortable. Introducing more hard questions to reach top scores.";
    } else if (hardAcc >= 0.6) {
      recommendedDifficulty = "HARD";
      distribution = { easy: 10, medium: 30, hard: 60 };
      reasoning = "Performing well across all levels. Maximizing hard question exposure for 300+ scores.";
    } else {
      recommendedDifficulty = "MEDIUM";
      distribution = { easy: 25, medium: 50, hard: 25 };
      reasoning = "Balanced performance. Mixed difficulty to maintain strengths while improving weaknesses.";
    }

    // Detect recent trend (last 10 vs previous 10)
    const recent10 = responses.slice(0, 10);
    const prev10 = responses.slice(10, 20);

    const recentAcc = recent10.length > 0
      ? recent10.filter((r) => r.isCorrect).length / recent10.length
      : 0;
    const prevAcc = prev10.length > 0
      ? prev10.filter((r) => r.isCorrect).length / prev10.length
      : 0;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (recentAcc - prevAcc > 0.15) trend = "improving";
    else if (prevAcc - recentAcc > 0.15) trend = "declining";

    // Adjust based on trend
    if (trend === "improving" && recommendedDifficulty !== "HARD") {
      distribution.hard += 10;
      distribution.easy -= 10;
      reasoning += " You're on an upward trend — adding a few more challenging questions.";
    } else if (trend === "declining") {
      distribution.easy += 10;
      distribution.hard -= 10;
      reasoning += " Recent accuracy dipped slightly — easing off to rebuild momentum.";
    }

    return NextResponse.json({
      recommendedDifficulty,
      confidence: responses.length >= 20 ? "high" : "medium",
      reasoning,
      distribution,
      trend,
      stats: {
        easy: { accuracy: Math.round(easyAcc * 100), attempts: diffStats.EASY.total },
        medium: { accuracy: Math.round(medAcc * 100), attempts: diffStats.MEDIUM.total },
        hard: { accuracy: Math.round(hardAcc * 100), attempts: diffStats.HARD.total },
      },
      recentAccuracy: Math.round(recentAcc * 100),
    });
  } catch (error) {
    console.error("Adaptive error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}