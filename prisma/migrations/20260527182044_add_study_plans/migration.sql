-- CreateEnum
CREATE TYPE "StudyTaskType" AS ENUM ('WEAK_TOPIC_DRILL', 'REVIEW', 'SPACED_REPETITION', 'NEW_TOPIC', 'MOCK_PREP', 'SPEED_DRILL');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "topicId" TEXT NOT NULL,
    "taskType" "StudyTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "StudyStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "repetitionNumber" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "totalStudyDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudyStreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlan_userId_date_idx" ON "StudyPlan"("userId", "date");

-- CreateIndex
CREATE INDEX "StudyPlan_userId_status_idx" ON "StudyPlan"("userId", "status");

-- CreateIndex
CREATE INDEX "StudyPlan_userId_nextReviewDate_idx" ON "StudyPlan"("userId", "nextReviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "StudyStreak_userId_key" ON "StudyStreak"("userId");

-- CreateIndex
CREATE INDEX "StudyStreak_userId_idx" ON "StudyStreak"("userId");

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyStreak" ADD CONSTRAINT "StudyStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
