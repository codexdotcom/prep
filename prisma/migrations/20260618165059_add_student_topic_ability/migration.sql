-- CreateTable
CREATE TABLE "StudentTopicAbility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "ability" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "recentResults" BOOLEAN[],
    "avgTimeMs" INTEGER,
    "lastPracticedAt" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTopicAbility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentTopicAbility_userId_subject_idx" ON "StudentTopicAbility"("userId", "subject");

-- CreateIndex
CREATE INDEX "StudentTopicAbility_userId_nextReviewAt_idx" ON "StudentTopicAbility"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTopicAbility_userId_topicId_key" ON "StudentTopicAbility"("userId", "topicId");

-- AddForeignKey
ALTER TABLE "StudentTopicAbility" ADD CONSTRAINT "StudentTopicAbility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTopicAbility" ADD CONSTRAINT "StudentTopicAbility_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
