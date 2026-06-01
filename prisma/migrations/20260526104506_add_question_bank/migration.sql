-- CreateEnum
CREATE TYPE "CorrectOption" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "TestMode" AS ENUM ('PRACTICE', 'TIMED', 'MOCK_EXAM', 'TOPIC_DRILL', 'WEAK_TOPIC', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIMED_OUT');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Subtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "topicId" TEXT NOT NULL,
    "subtopicId" TEXT,
    "year" INTEGER,
    "questionNumber" INTEGER,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" "CorrectOption" NOT NULL,
    "explanation" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avgTimeMs" INTEGER,
    "correctRate" DOUBLE PRECISION,
    "discriminationIndex" DOUBLE PRECISION,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "TestMode" NOT NULL,
    "subject" "JambSubject",
    "subjects" "JambSubject"[],
    "totalQuestions" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "totalCorrect" INTEGER,
    "totalWrong" INTEGER,
    "totalSkipped" INTEGER,
    "timeTaken" INTEGER,
    "percentile" DOUBLE PRECISION,
    "difficultyProfile" JSONB,
    "topicAccuracy" JSONB,
    "timeDistribution" JSONB,
    "flaggedQuestions" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedOption" "CorrectOption",
    "isCorrect" BOOLEAN,
    "timeSpent" INTEGER NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_subject_idx" ON "Topic"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "Subtopic_slug_key" ON "Subtopic"("slug");

-- CreateIndex
CREATE INDEX "Subtopic_topicId_idx" ON "Subtopic"("topicId");

-- CreateIndex
CREATE INDEX "Question_subject_topicId_idx" ON "Question"("subject", "topicId");

-- CreateIndex
CREATE INDEX "Question_subject_difficulty_idx" ON "Question"("subject", "difficulty");

-- CreateIndex
CREATE INDEX "Question_year_subject_idx" ON "Question"("year", "subject");

-- CreateIndex
CREATE INDEX "TestSession_userId_status_idx" ON "TestSession"("userId", "status");

-- CreateIndex
CREATE INDEX "TestSession_userId_mode_idx" ON "TestSession"("userId", "mode");

-- CreateIndex
CREATE INDEX "QuestionResponse_userId_questionId_idx" ON "QuestionResponse"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionResponse_sessionId_questionId_key" ON "QuestionResponse"("sessionId", "questionId");

-- AddForeignKey
ALTER TABLE "Subtopic" ADD CONSTRAINT "Subtopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
