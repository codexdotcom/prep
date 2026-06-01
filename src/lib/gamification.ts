import { db } from "./db";

const XP_VALUES = {
  QUESTION_CORRECT: 5,
  QUESTION_CORRECT_HARD: 10,
  QUESTION_CORRECT_STREAK_3: 5,    // bonus for 3 in a row
  TEST_COMPLETE: 25,
  MOCK_COMPLETE: 50,
  DAILY_MISSION: 30,
  STUDY_PLAN_TASK: 15,
  STREAK_DAY: 10,
};

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3300, 4200,
  5250, 6450, 7800, 9300, 11000, 12900, 15000, 17300, 19800, 22500,
  25500, 28800, 32400, 36300, 40500,
];

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  return LEVEL_THRESHOLDS[level]; // level is 1-indexed, array is 0-indexed
}

export function getXPProgress(xp: number): { level: number; current: number; required: number; percentage: number } {
  const level = getLevelFromXP(xp);
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[level] || currentLevelXP + 5000;
  const current = xp - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  return {
    level,
    current,
    required,
    percentage: Math.min(100, Math.round((current / required) * 100)),
  };
}

export async function awardXP(
  userId: string,
  amount: number,
  source: string,
  sourceId?: string,
  note?: string
): Promise<{ newTotal: number; leveledUp: boolean; newLevel: number }> {
  // Create transaction
  await db.xPTransaction.create({
    data: {
      userId,
      amount,
      source: source as any,
      sourceId,
      note,
    },
  });

  // Update totals
  const userXP = await db.userXP.upsert({
    where: { userId },
    update: {
      totalXP: { increment: amount },
      weeklyXP: { increment: amount },
      monthlyXP: { increment: amount },
    },
    create: {
      userId,
      totalXP: amount,
      weeklyXP: amount,
      monthlyXP: amount,
      level: 1,
    },
  });

  const newLevel = getLevelFromXP(userXP.totalXP);
  const leveledUp = newLevel > userXP.level;

  if (leveledUp) {
    await db.userXP.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  return { newTotal: userXP.totalXP, leveledUp, newLevel };
}

export async function checkAndAwardAchievements(
  userId: string
): Promise<Array<{ key: string; title: string; icon: string; xpReward: number }>> {
  const newlyUnlocked: Array<{ key: string; title: string; icon: string; xpReward: number }> = [];

  // Get all achievements and what user already has
  const [allAchievements, userAchievements] = await Promise.all([
    db.achievement.findMany(),
    db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const unlockedIds = new Set(userAchievements.map((a) => a.achievementId));

  // Get user stats
  const [testCount, questionCount, streak, xpData] = await Promise.all([
    db.testSession.count({ where: { userId, status: "COMPLETED" } }),
    db.questionResponse.count({ where: { userId } }),
    db.studyStreak.findUnique({ where: { userId } }),
    db.userXP.findUnique({ where: { userId } }),
  ]);

  // Get latest test for accuracy checks
  const latestTest = await db.testSession.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  const latestAccuracy = latestTest && latestTest.totalQuestions > 0
    ? Math.round(((latestTest.totalCorrect || 0) / latestTest.totalQuestions) * 100)
    : 0;

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let qualified = false;

    switch (achievement.key) {
      // Milestones
      case "first_test": qualified = testCount >= 1; break;
      case "tests_5": qualified = testCount >= 5; break;
      case "tests_25": qualified = testCount >= 25; break;
      case "tests_100": qualified = testCount >= 100; break;
      case "questions_500": qualified = questionCount >= 500; break;
      case "questions_2000": qualified = questionCount >= 2000; break;

      // Streaks
      case "streak_3": qualified = (streak?.currentStreak || 0) >= 3; break;
      case "streak_7": qualified = (streak?.currentStreak || 0) >= 7; break;
      case "streak_14": qualified = (streak?.currentStreak || 0) >= 14; break;
      case "streak_30": qualified = (streak?.currentStreak || 0) >= 30; break;

      // Accuracy
      case "accuracy_80": qualified = latestAccuracy >= 80; break;
      case "accuracy_90": qualified = latestAccuracy >= 90; break;
      case "perfect_test": qualified = latestAccuracy === 100; break;
      case "score_250": qualified = (latestTest?.score || 0) >= 250; break;
      case "score_300": qualified = (latestTest?.score || 0) >= 300; break;

      // Speed
      case "speed_demon":
        if (latestTest && latestTest.timeLimit > 0 && latestTest.timeTaken) {
          qualified = (latestTest.timeLimit - latestTest.timeTaken) >= 300;
        }
        break;
    }

    if (qualified) {
      await db.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });

      if (achievement.xpReward > 0) {
        await awardXP(userId, achievement.xpReward, "ACHIEVEMENT", achievement.id, achievement.title);
      }

      newlyUnlocked.push({
        key: achievement.key,
        title: achievement.title,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
      });
    }
  }

  return newlyUnlocked;
}

export async function generateDailyMissions(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.dailyMission.count({
    where: { userId, date: today },
  });

  if (existing > 0) return;

  const missions = [
    {
      missionType: "ANSWER_QUESTIONS" as const,
      title: "Answer 20 questions",
      description: "Practice makes permanent. Answer 20 questions today.",
      target: 20,
      xpReward: 30,
    },
    {
      missionType: "COMPLETE_TEST" as const,
      title: "Complete a practice test",
      description: "Take at least one test today.",
      target: 1,
      xpReward: 25,
    },
    {
      missionType: "REVIEW_WEAK" as const,
      title: "Drill a weak topic",
      description: "Focus on an area you're struggling with.",
      target: 1,
      xpReward: 35,
    },
  ];

  // Pick 2-3 missions randomly
  const shuffled = missions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.random() > 0.5 ? 3 : 2);

  await db.dailyMission.createMany({
    data: selected.map((m) => ({
      userId,
      date: today,
      ...m,
    })),
  });
}

export async function updateMissionProgress(
  userId: string,
  missionType: string,
  increment: number = 1
): Promise<Array<{ title: string; xpReward: number }>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missions = await db.dailyMission.findMany({
    where: { userId, date: today, missionType: missionType as any, status: "ACTIVE" },
  });

  const completed: Array<{ title: string; xpReward: number }> = [];

  for (const mission of missions) {
    const newProgress = Math.min(mission.progress + increment, mission.target);
    const justCompleted = newProgress >= mission.target && mission.progress < mission.target;

    await db.dailyMission.update({
      where: { id: mission.id },
      data: {
        progress: newProgress,
        status: justCompleted ? "COMPLETED" : "ACTIVE",
        completedAt: justCompleted ? new Date() : undefined,
      },
    });

    if (justCompleted) {
      await awardXP(userId, mission.xpReward, "DAILY_MISSION", mission.id, mission.title);
      completed.push({ title: mission.title, xpReward: mission.xpReward });
    }
  }

  return completed;
}