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
    const days = parseInt(searchParams.get("days") || "30");

    const userId = session.user.id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Daily activity
    const plans = await db.studyPlan.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      include: { topic: { select: { name: true, subject: true } } },
      orderBy: { date: "asc" },
    });

    // Group by date
    const dailyActivity: Record<string, {
      date: string;
      completed: number;
      total: number;
      subjects: string[];
      minutesStudied: number;
    }> = {};

    for (const plan of plans) {
      const dateKey = plan.date.toISOString().split("T")[0];
      if (!dailyActivity[dateKey]) {
        dailyActivity[dateKey] = {
          date: dateKey,
          completed: 0,
          total: 0,
          subjects: [],
          minutesStudied: 0,
        };
      }

      const day = dailyActivity[dateKey];
      day.total++;
      if (plan.status === "COMPLETED") {
        day.completed++;
        // Estimate ~2 min per question
        day.minutesStudied += plan.questionCount * 2;
      }

      const subjectLabel = plan.topic.subject.replace(/_/g, " ");
      if (!day.subjects.includes(subjectLabel)) {
        day.subjects.push(subjectLabel);
      }
    }

    // Build heatmap data (fill in missing days)
    const heatmap: Array<{
      date: string;
      level: number; // 0-4 intensity
      completed: number;
      total: number;
    }> = [];

    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      const activity = dailyActivity[dateKey];

      let level = 0;
      if (activity) {
        const ratio = activity.total > 0 ? activity.completed / activity.total : 0;
        if (ratio >= 0.8) level = 4;
        else if (ratio >= 0.5) level = 3;
        else if (ratio > 0) level = 2;
        else if (activity.total > 0) level = 1;
      }

      heatmap.push({
        date: dateKey,
        level,
        completed: activity?.completed || 0,
        total: activity?.total || 0,
      });
    }

    // Topics mastery progression
    const topicMastery = await db.questionResponse.groupBy({
      by: ["questionId"],
      where: {
        userId,
        answeredAt: { gte: startDate },
        session: { status: "COMPLETED" },
      },
      _count: true,
    });

    // Summary stats
    const totalCompleted = plans.filter((p) => p.status === "COMPLETED").length;
    const totalPlanned = plans.length;
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
    const activeDays = Object.values(dailyActivity).filter((d) => d.completed > 0).length;
    const totalMinutes = Object.values(dailyActivity).reduce((s, d) => s + d.minutesStudied, 0);

    return NextResponse.json({
      heatmap,
      dailyActivity: Object.values(dailyActivity),
      summary: {
        totalCompleted,
        totalPlanned,
        completionRate,
        activeDays,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        avgMinutesPerDay: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      },
    });
  } catch (error) {
    console.error("Study history error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}