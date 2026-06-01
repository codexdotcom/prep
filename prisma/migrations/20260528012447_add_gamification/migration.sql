-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('MILESTONE', 'STREAK', 'ACCURACY', 'SPEED', 'SOCIAL', 'MASTERY');

-- CreateEnum
CREATE TYPE "XPSource" AS ENUM ('TEST_COMPLETE', 'QUESTION_CORRECT', 'STREAK_BONUS', 'DAILY_MISSION', 'ACHIEVEMENT', 'STUDY_PLAN', 'FIRST_LOGIN');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('ANSWER_QUESTIONS', 'COMPLETE_TEST', 'STUDY_MINUTES', 'PERFECT_TOPIC', 'USE_TUTOR', 'REVIEW_WEAK');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "requirement" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserXP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "weeklyXP" INTEGER NOT NULL DEFAULT 0,
    "monthlyXP" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserXP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "XPSource" NOT NULL,
    "sourceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "missionType" "MissionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserXP_userId_key" ON "UserXP"("userId");

-- CreateIndex
CREATE INDEX "XPTransaction_userId_createdAt_idx" ON "XPTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyMission_userId_date_idx" ON "DailyMission"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMission_userId_date_missionType_key" ON "DailyMission"("userId", "date", "missionType");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_period_periodKey_score_idx" ON "LeaderboardEntry"("period", "periodKey", "score");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_period_periodKey_key" ON "LeaderboardEntry"("userId", "period", "periodKey");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserXP" ADD CONSTRAINT "UserXP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
