import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getXPProgress,
  generateDailyMissions,
  checkAndAwardAchievements,
} from "@/lib/gamification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Ensure daily missions exist
    await generateDailyMissions(userId);

    // Check for new achievements
    const newAchievements = await checkAndAwardAchievements(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [xp, streak, missions, achievements, recentXP] = await Promise.all([
      db.userXP.findUnique({ where: { userId } }),
      db.studyStreak.findUnique({ where: { userId } }),
      db.dailyMission.findMany({
        where: { userId, date: today },
        orderBy: { xpReward: "desc" },
      }),
      db.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
      }),
      db.xPTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const totalXP = xp?.totalXP || 0;
    const progress = getXPProgress(totalXP);

    return NextResponse.json({
      xp: {
        total: totalXP,
        weekly: xp?.weeklyXP || 0,
        monthly: xp?.monthlyXP || 0,
        ...progress,
      },
      streak: {
        current: streak?.currentStreak || 0,
        longest: streak?.longestStreak || 0,
        totalDays: streak?.totalStudyDays || 0,
      },
      missions,
      achievements: achievements.map((a) => ({
        ...a.achievement,
        unlockedAt: a.unlockedAt,
        seen: a.seen,
      })),
      newAchievements,
      recentXP,
    });
  } catch (error) {
    console.error("Gamification profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}