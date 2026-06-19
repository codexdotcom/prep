import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const modeFilter = searchParams.get("mode");

    const where: any = { userId: session.user.id, status: "COMPLETED" };
    if (modeFilter) where.mode = modeFilter;

    const sessions = await db.testSession.findMany({
      where,
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        id: true,
        mode: true,
        subject: true,
        score: true,
        totalCorrect: true,
        totalQuestions: true,
        totalWrong: true,
        totalSkipped: true,
        difficultyProfile: true,
        completedAt: true,
        startedAt: true,
      },
    });

    // Calculate streaks and trends
    const mockSessions = sessions.filter((s) => s.mode === "MOCK_EXAM");
    const scoreTrend = mockSessions.map((s) => ({
      score: s.score,
      date: s.completedAt,
    })).reverse();

    // Best/worst/average
    const mockScores = mockSessions.map((s) => s.score || 0).filter((s) => s > 0);
    const bestMock = mockScores.length > 0 ? Math.max(...mockScores) : 0;
    const worstMock = mockScores.length > 0 ? Math.min(...mockScores) : 0;
    const avgMock = mockScores.length > 0 ? Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length) : 0;

    // Recent improvement (compare last 3 to previous 3)
    let improvement = 0;
    if (mockScores.length >= 6) {
      const recent3 = mockScores.slice(0, 3);
      const prev3 = mockScores.slice(3, 6);
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / 3;
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / 3;
      improvement = Math.round(recentAvg - prevAvg);
    }

    // Total practice stats
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((s, sess) => s + sess.totalQuestions, 0);
    const totalCorrect = sessions.reduce((s, sess) => s + (sess.totalCorrect || 0), 0);

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        mode: s.mode,
        subject: s.subject,
        score: s.score,
        totalCorrect: s.totalCorrect,
        totalQuestions: s.totalQuestions,
        accuracy: s.totalQuestions > 0 ? Math.round(((s.totalCorrect || 0) / s.totalQuestions) * 100) : 0,
        completedAt: s.completedAt,
        duration: s.startedAt && s.completedAt ? Math.round((new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60000) : 0,
      })),
      scoreTrend,
      stats: {
        totalSessions,
        totalQuestions,
        totalCorrect,
        overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        mockExamsTaken: mockSessions.length,
        bestMock,
        worstMock,
        avgMock,
        improvement,
      },
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}