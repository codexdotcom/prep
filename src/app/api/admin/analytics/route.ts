import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      newUsersThisMonth,
      totalQuestions,
      totalTestSessions,
      totalResponses,
      activeUsersWeekly,
      subscriptionCounts,
      revenueData,
      openFlags,
      subjectStats,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.question.count({ where: { isActive: true } }),
      db.testSession.count({ where: { status: "COMPLETED" } }),
      db.questionResponse.count(),
      db.testSession.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      db.subscription.groupBy({
        by: ["plan"],
        where: { status: "ACTIVE" },
        _count: true,
      }),
      db.payment.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      db.flaggedQuestion.count({ where: { status: "OPEN" } }),
      db.questionResponse.groupBy({
        by: ["questionId"],
        where: { session: { status: "COMPLETED" } },
        _count: true,
        _avg: { timeSpent: true },
      }),
    ]);

    // Hardest questions
    const hardestQuestions = await db.question.findMany({
      where: { totalAttempts: { gte: 10 }, correctRate: { not: null } },
      orderBy: { correctRate: "asc" },
      take: 10,
      select: {
        id: true,
        body: true,
        subject: true,
        correctRate: true,
        totalAttempts: true,
        topic: { select: { name: true } },
      },
    });

    // Easiest questions
    const easiestQuestions = await db.question.findMany({
      where: { totalAttempts: { gte: 10 }, correctRate: { not: null } },
      orderBy: { correctRate: "desc" },
      take: 10,
      select: {
        id: true,
        body: true,
        subject: true,
        correctRate: true,
        totalAttempts: true,
        topic: { select: { name: true } },
      },
    });

    // Daily signups (last 30 days)
    const dailySignups = await db.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { createdAt: "asc" },
    });

    // Revenue in Naira
    const revenueNaira = (revenueData._sum.amount || 0) / 100;

    const planBreakdown: Record<string, number> = {};
  subscriptionCounts.forEach((s: { plan: string; _count: number }) => {
  planBreakdown[s.plan] = s._count;
});
    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersThisMonth,
        activeUsersWeekly: activeUsersWeekly.length,
        totalQuestions,
        totalTestSessions,
        totalResponses,
        openFlags,
        monthlyRevenue: revenueNaira,
        monthlyPayments: revenueData._count,
      },
      subscriptions: planBreakdown,
      hardestQuestions,
      easiestQuestions,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}