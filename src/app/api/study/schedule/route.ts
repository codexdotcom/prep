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
    const weeksAhead = parseInt(searchParams.get("weeks") || "2");

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    // Get profile for study preferences
    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: { jambSubjects: { orderBy: { priority: "asc" } } },
    });

    if (!profile) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    // Get existing plans in date range
    const existingPlans = await db.studyPlan.findMany({
      where: {
        userId,
        date: { gte: today, lte: endDate },
      },
      include: { topic: { select: { name: true, subject: true } } },
      orderBy: [{ date: "asc" }, { priority: "desc" }],
    });

    // Get upcoming spaced repetition reviews
    const upcomingReviews = await db.studyPlan.findMany({
      where: {
        userId,
        status: "COMPLETED",
        nextReviewDate: { gte: today, lte: endDate },
      },
      include: { topic: { select: { name: true, subject: true } } },
      orderBy: { nextReviewDate: "asc" },
    });

    // Get exam date and calculate days remaining
    const examYear = profile.examYear;
    // JAMB typically happens in April-May
    const estimatedExamDate = new Date(examYear, 3, 15); // April 15
    const daysToExam = Math.max(
      0,
      Math.ceil((estimatedExamDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Group plans by date
    const scheduleByDate: Record<string, typeof existingPlans> = {};
    for (const plan of existingPlans) {
      const dateKey = plan.date.toISOString().split("T")[0];
      if (!scheduleByDate[dateKey]) scheduleByDate[dateKey] = [];
      scheduleByDate[dateKey].push(plan);
    }

    // Build calendar data
    const calendar: Array<{
      date: string;
      dayName: string;
      isToday: boolean;
      isPast: boolean;
      tasks: typeof existingPlans;
      completedCount: number;
      totalCount: number;
      hasReview: boolean;
    }> = [];

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      const tasks = scheduleByDate[dateKey] || [];
      const dayReviews = upcomingReviews.filter((r) => {
        const reviewDate = r.nextReviewDate ? new Date(r.nextReviewDate) : null;
        return reviewDate && reviewDate.toISOString().split("T")[0] === dateKey;
      });

      calendar.push({
        date: dateKey,
        dayName: d.toLocaleDateString("en-NG", { weekday: "short" }),
        isToday: d.getTime() === today.getTime(),
        isPast: d.getTime() < today.getTime(),
        tasks,
        completedCount: tasks.filter((t) => t.status === "COMPLETED").length,
        totalCount: tasks.length,
        hasReview: dayReviews.length > 0,
      });
    }

    // Subject distribution recommendation
    const subjectHours: Record<string, number> = {};
    const totalHours = (profile.studyHoursPerDay || 2) * 7;

    // Weight subjects by weakness
    const responses = await db.questionResponse.findMany({
      where: { userId, session: { status: "COMPLETED" } },
      include: { question: { select: { subject: true } } },
      orderBy: { answeredAt: "desc" },
      take: 200,
    });

    const subjectAccuracy: Record<string, { correct: number; total: number }> = {};
    for (const r of responses) {
      const subj = r.question.subject;
      if (!subjectAccuracy[subj]) subjectAccuracy[subj] = { correct: 0, total: 0 };
      subjectAccuracy[subj].total++;
      if (r.isCorrect) subjectAccuracy[subj].correct++;
    }

    // Weaker subjects get more time
    const subjects = profile.jambSubjects.map((s) => s.subject);
    let totalWeight = 0;
    const weights: Record<string, number> = {};

    for (const subj of subjects) {
      const acc = subjectAccuracy[subj];
      const accuracy = acc ? (acc.correct / acc.total) * 100 : 50;
      // Inverse weight: lower accuracy = higher weight
      const weight = Math.max(1, (100 - accuracy) / 20);
      weights[subj] = weight;
      totalWeight += weight;
    }

    for (const subj of subjects) {
      subjectHours[subj] = Math.round((weights[subj] / totalWeight) * totalHours * 10) / 10;
    }

    return NextResponse.json({
      calendar,
      upcomingReviews: upcomingReviews.slice(0, 10),
      daysToExam,
      examDate: estimatedExamDate.toISOString(),
      studyHoursPerDay: profile.studyHoursPerDay || 2,
      weeklySubjectDistribution: subjectHours,
      targetScore: profile.targetScore,
    });
  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}