import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) return NextResponse.json({ error: "Access code required" }, { status: 400 });

    const link = await db.parentLink.findUnique({ where: { accessCode: code } });
    if (!link || link.status === "REVOKED") {
      return NextResponse.json({ error: "Invalid or revoked access code" }, { status: 403 });
    }

    // Activate on first view
    if (link.status === "PENDING") {
      await db.parentLink.update({ where: { id: link.id }, data: { status: "ACTIVE" } });
    }

    await db.parentLink.update({ where: { id: link.id }, data: { lastViewedAt: new Date() } });

    const studentId = link.studentId;

    const [profile, xp, streak, testCount, responses] = await Promise.all([
      db.studentProfile.findUnique({ where: { userId: studentId }, include: { jambSubjects: true } }),
      db.userXP.findUnique({ where: { userId: studentId } }),
      db.studyStreak.findUnique({ where: { userId: studentId } }),
      db.testSession.count({ where: { userId: studentId, status: "COMPLETED" } }),
      db.questionResponse.findMany({
        where: { userId: studentId, session: { status: "COMPLETED" } },
        include: { question: { select: { subject: true } } },
        orderBy: { answeredAt: "desc" },
        take: 500,
      }),
    ]);

    const totalCorrect = responses.filter((r) => r.isCorrect).length;
    const accuracy = responses.length > 0 ? Math.round((totalCorrect / responses.length) * 100) : 0;
    const predictedScore = Math.round((accuracy / 100) * 400);

    // Per-subject
    const subjectStats: Record<string, { correct: number; total: number }> = {};
    for (const r of responses) {
      const s = r.question.subject;
      if (!subjectStats[s]) subjectStats[s] = { correct: 0, total: 0 };
      subjectStats[s].total++;
      if (r.isCorrect) subjectStats[s].correct++;
    }

    // Recent activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const recentTests = await db.testSession.count({
      where: { userId: studentId, status: "COMPLETED", completedAt: { gte: weekAgo } },
    });

    const recentResponses = await db.questionResponse.count({
      where: { userId: studentId, answeredAt: { gte: weekAgo } },
    });

    return NextResponse.json({
      student: {
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        examYear: profile?.examYear,
        targetScore: profile?.targetScore,
        subjects: profile?.jambSubjects.map((s) => s.subject) || [],
      },
      stats: {
        predictedScore,
        accuracy,
        totalQuestions: responses.length,
        totalTests: testCount,
        level: xp?.level || 1,
        totalXP: xp?.totalXP || 0,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
      },
      subjectBreakdown: Object.entries(subjectStats).map(([subject, s]) => ({
        subject,
        accuracy: Math.round((s.correct / s.total) * 100),
        questionsAnswered: s.total,
      })),
      recentActivity: {
        testsThisWeek: recentTests,
        questionsThisWeek: recentResponses,
        isActive: recentResponses > 0,
      },
    });
  } catch (error) {
    console.error("Parent dashboard error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}