import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if plan already exists for today
    const existingPlan = await db.studyPlan.findMany({
      where: {
        userId,
        date: today,
      },
      include: {
        topic: { select: { name: true, subject: true } },
      },
      orderBy: { priority: "desc" },
    });

    if (existingPlan.length > 0) {
      const streak = await getOrCreateStreak(userId);
      return NextResponse.json({ tasks: existingPlan, streak, generated: false });
    }

    // Generate new plan
    const tasks = await generateDailyPlan(userId, today);
    const streak = await getOrCreateStreak(userId);

    return NextResponse.json({ tasks, streak, generated: true });
  } catch (error) {
    console.error("Study plan error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — regenerate plan for today
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete existing uncompleted tasks for today
    await db.studyPlan.deleteMany({
      where: { userId, date: today, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    const tasks = await generateDailyPlan(userId, today);
    const streak = await getOrCreateStreak(userId);

    return NextResponse.json({ tasks, streak, generated: true });
  } catch (error) {
    console.error("Regenerate plan error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function getOrCreateStreak(userId: string) {
  let streak = await db.studyStreak.findUnique({ where: { userId } });

  if (!streak) {
    streak = await db.studyStreak.create({
      data: { userId, currentStreak: 0, longestStreak: 0, totalStudyDays: 0 },
    });
  }

  return streak;
}

async function generateDailyPlan(userId: string, date: Date) {
  const profile = await db.studentProfile.findUnique({
    where: { userId },
    include: { jambSubjects: { orderBy: { priority: "asc" } } },
  });

  if (!profile) return [];

  const studyHours = profile.studyHoursPerDay || 2;
  const tasksPerDay = Math.max(3, Math.min(8, Math.round(studyHours * 2)));

  // Get performance data
  const responses = await db.questionResponse.findMany({
    where: { userId, session: { status: "COMPLETED" } },
    include: {
      question: { include: { topic: true } },
    },
    orderBy: { answeredAt: "desc" },
    take: 500,
  });

  // Build topic performance map
  const topicPerf = new Map<string, {
    id: string;
    name: string;
    subject: string;
    correct: number;
    total: number;
    accuracy: number;
    lastAttempted: Date;
  }>();

  for (const r of responses) {
    const tid = r.question.topicId;
    if (!topicPerf.has(tid)) {
      topicPerf.set(tid, {
        id: tid,
        name: r.question.topic.name,
        subject: r.question.topic.subject,
        correct: 0,
        total: 0,
        accuracy: 0,
        lastAttempted: r.answeredAt,
      });
    }
    const t = topicPerf.get(tid)!;
    t.total++;
    if (r.isCorrect) t.correct++;
    if (r.answeredAt > t.lastAttempted) t.lastAttempted = r.answeredAt;
  }

  for (const t of topicPerf.values()) {
    t.accuracy = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
  }

  // Check for spaced repetition reviews due
  const dueReviews = await db.studyPlan.findMany({
    where: {
      userId,
      taskType: "SPACED_REPETITION",
      status: "COMPLETED",
      nextReviewDate: { lte: date },
    },
    include: { topic: true },
    take: 3,
  });

  const tasks: Array<any> = [];
  let priority = tasksPerDay;

  // 1. Add spaced repetition reviews (highest priority)
  for (const review of dueReviews) {
    tasks.push(
      await db.studyPlan.create({
        data: {
          userId,
          date,
          subject: review.subject,
          topicId: review.topicId,
          taskType: "SPACED_REPETITION",
          title: `Review: ${review.topic.name}`,
          description: `Spaced repetition review (rep #${review.repetitionNumber + 1}). Keep this fresh.`,
          questionCount: 10,
          difficulty: "MEDIUM",
          priority: priority--,
          repetitionNumber: review.repetitionNumber + 1,
          easeFactor: review.easeFactor,
          intervalDays: review.intervalDays,
        },
        include: { topic: { select: { name: true, subject: true } } },
      })
    );
  }

  // 2. Weak topic drills
  const weakTopics = Array.from(topicPerf.values())
    .filter((t) => t.total >= 3 && t.accuracy < 50)
    .sort((a, b) => a.accuracy - b.accuracy);

  for (const weak of weakTopics.slice(0, 2)) {
    if (tasks.length >= tasksPerDay) break;

    tasks.push(
      await db.studyPlan.create({
        data: {
          userId,
          date,
          subject: weak.subject as any,
          topicId: weak.id,
          taskType: "WEAK_TOPIC_DRILL",
          title: `Drill: ${weak.name}`,
          description: `You're at ${weak.accuracy}% accuracy. Let's push this up.`,
          questionCount: 15,
          difficulty: weak.accuracy < 30 ? "EASY" : "MEDIUM",
          priority: priority--,
        },
        include: { topic: { select: { name: true, subject: true } } },
      })
    );
  }

  // 3. Speed drills if timing is slow
  const avgTime = responses.length > 0
    ? responses.reduce((s, r) => s + r.timeSpent, 0) / responses.length
    : 0;

  if (avgTime > 90000 && tasks.length < tasksPerDay) {
    const randomSubject = profile.jambSubjects[
      Math.floor(Math.random() * profile.jambSubjects.length)
    ];

    const topicsForSubject = await db.topic.findMany({
      where: { subject: randomSubject.subject },
      take: 1,
      orderBy: { sortOrder: "asc" },
    });

    if (topicsForSubject[0]) {
      tasks.push(
        await db.studyPlan.create({
          data: {
            userId,
            date,
            subject: randomSubject.subject,
            topicId: topicsForSubject[0].id,
            taskType: "SPEED_DRILL",
            title: "Speed Round",
            description: "10 questions, tight timer. Build your exam pace.",
            questionCount: 10,
            difficulty: "EASY",
            priority: priority--,
          },
          include: { topic: { select: { name: true, subject: true } } },
        })
      );
    }
  }

  // 4. Fill remaining slots with review of medium-accuracy topics
  const mediumTopics = Array.from(topicPerf.values())
    .filter((t) => t.accuracy >= 50 && t.accuracy < 80)
    .sort((a, b) => {
      // Prioritize topics not studied recently
      return a.lastAttempted.getTime() - b.lastAttempted.getTime();
    });

  for (const topic of mediumTopics) {
    if (tasks.length >= tasksPerDay) break;

    tasks.push(
      await db.studyPlan.create({
        data: {
          userId,
          date,
          subject: topic.subject as any,
          topicId: topic.id,
          taskType: "REVIEW",
          title: `Strengthen: ${topic.name}`,
          description: `At ${topic.accuracy}% — a focused session can push this to mastery.`,
          questionCount: 10,
          difficulty: "MEDIUM",
          priority: priority--,
        },
        include: { topic: { select: { name: true, subject: true } } },
      })
    );
  }

  // 5. If still not enough tasks, add new topic exploration
  if (tasks.length < tasksPerDay) {
    const attemptedTopicIds = Array.from(topicPerf.keys());
    const newTopics = await db.topic.findMany({
      where: {
        subject: { in: profile.jambSubjects.map((s) => s.subject) },
        id: { notIn: attemptedTopicIds },
      },
      take: tasksPerDay - tasks.length,
    });

    for (const topic of newTopics) {
      if (tasks.length >= tasksPerDay) break;

      tasks.push(
        await db.studyPlan.create({
          data: {
            userId,
            date,
            subject: topic.subject,
            topicId: topic.id,
            taskType: "NEW_TOPIC",
            title: `Explore: ${topic.name}`,
            description: "New territory. See how you do on this topic.",
            questionCount: 10,
            difficulty: "EASY",
            priority: priority--,
          },
          include: { topic: { select: { name: true, subject: true } } },
        })
      );
    }
  }

  return tasks;
}