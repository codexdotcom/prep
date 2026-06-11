import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { adjustments } = await req.json();
    // adjustments: { MATHEMATICS: 15, CHEMISTRY: 20, ... } (percentage point improvements)

    const userId = session.user.id;

    const responses = await db.questionResponse.findMany({
      where: { userId, session: { status: "COMPLETED" } },
      include: { question: { select: { subject: true } } },
    });

    // Current per-subject accuracy
    const subjectStats: Record<string, { correct: number; total: number }> = {};
    for (const r of responses) {
      const subj = r.question.subject;
      if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, total: 0 };
      subjectStats[subj].total++;
      if (r.isCorrect) subjectStats[subj].correct++;
    }

    // Get user's JAMB subjects
    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: { jambSubjects: { orderBy: { priority: "asc" } } },
    });

    const userSubjects = profile?.jambSubjects.map((s) => s.subject) || ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"];

    const results: Array<{
      subject: string;
      currentAccuracy: number;
      adjustedAccuracy: number;
      currentScore: number;
      adjustedScore: number;
      improvement: number;
    }> = [];

    let currentTotal = 0;
    let adjustedTotal = 0;

    for (const subj of userSubjects) {
      const stat = subjectStats[subj];
      const currentAcc = stat && stat.total >= 5
        ? Math.round((stat.correct / stat.total) * 100)
        : 50;

      const adjustment = adjustments?.[subj] || 0;
      const adjustedAcc = Math.min(100, currentAcc + adjustment);

      const currentScore = Math.round((currentAcc / 100) * 100); // out of 100 per subject
      const adjustedScore = Math.round((adjustedAcc / 100) * 100);

      currentTotal += currentScore;
      adjustedTotal += adjustedScore;

      results.push({
        subject: subj,
        currentAccuracy: currentAcc,
        adjustedAccuracy: adjustedAcc,
        currentScore,
        adjustedScore,
        improvement: adjustedScore - currentScore,
      });
    }

    return NextResponse.json({
      subjects: results,
      currentPredicted: currentTotal,
      adjustedPredicted: adjustedTotal,
      totalImprovement: adjustedTotal - currentTotal,
      targetScore: profile?.targetScore || 250,
    });
  } catch (error) {
    console.error("Simulator error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}