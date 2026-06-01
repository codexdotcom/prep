import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { accuracy } = body; // 0-100, from the practice session

    const task = await db.studyPlan.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Calculate spaced repetition schedule (SM-2 algorithm)
    let newEase = task.easeFactor;
    let newInterval = task.intervalDays;
    let nextReview: Date | null = null;

    if (accuracy !== undefined) {
      // Quality: 0-5 scale mapped from accuracy
      const quality = Math.round((accuracy / 100) * 5);

      if (quality >= 3) {
        // Successful recall
        if (task.repetitionNumber === 0) {
          newInterval = 1;
        } else if (task.repetitionNumber === 1) {
          newInterval = 6;
        } else {
          newInterval = Math.round(task.intervalDays * newEase);
        }

        newEase = Math.max(
          1.3,
          task.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        );
      } else {
        // Failed recall — reset
        newInterval = 1;
        newEase = Math.max(1.3, task.easeFactor - 0.2);
      }

      nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
    }

    // Update task
    const updated = await db.studyPlan.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        easeFactor: newEase,
        intervalDays: newInterval,
        nextReviewDate: nextReview,
        repetitionNumber: task.repetitionNumber + 1,
      },
    });

    // Update streak
    await updateStreak(session.user.id);

    return NextResponse.json({
      task: updated,
      nextReview: nextReview?.toISOString(),
      intervalDays: newInterval,
    });
  } catch (error) {
    console.error("Complete task error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = await db.studyStreak.findUnique({ where: { userId } });

  if (!streak) {
    streak = await db.studyStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastStudyDate: today, totalStudyDays: 1 },
    });
    return streak;
  }

  const lastDate = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
  lastDate?.setHours(0, 0, 0, 0);

  if (lastDate && lastDate.getTime() === today.getTime()) {
    // Already studied today
    return streak;
  }

  let newStreak = 1;
  if (lastDate && lastDate.getTime() === yesterday.getTime()) {
    // Consecutive day
    newStreak = streak.currentStreak + 1;
  }

  const updated = await db.studyStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastStudyDate: today,
      totalStudyDays: streak.totalStudyDays + 1,
    },
  });

  return updated;
}