-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('AWAITING_RESULTS', 'JAMB_SUBMITTED', 'POST_UTME_SCHEDULED', 'POST_UTME_COMPLETED', 'SCREENING', 'MERIT_LIST', 'ADMITTED', 'SUPPLEMENTARY', 'NOT_ADMITTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('INFO', 'MILESTONE', 'WARNING', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "PostUtmeExam" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "course" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "totalQuestions" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostUtmeExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostUtmeQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostUtmeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostUtmeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "score" INTEGER,
    "totalAnswered" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "TestStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "PostUtmeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostUtmeResponse" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostUtmeResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTracker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "jambScore" INTEGER,
    "postUtmeScore" INTEGER,
    "oLevelGrades" JSONB,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'AWAITING_RESULTS',
    "jambRegNumber" TEXT,
    "notes" TEXT,
    "screeningDate" TIMESTAMP(3),
    "resultDate" TIMESTAMP(3),
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionUpdate" (
    "id" TEXT NOT NULL,
    "trackerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "UpdateType" NOT NULL DEFAULT 'INFO',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "subjects" TEXT[],
    "qualifications" TEXT[],
    "experience" TEXT,
    "hourlyRate" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableSlots" JSONB,
    "state" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "meetingLink" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "paymentRef" TEXT,
    "notes" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorReview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostUtmeExam_universityId_idx" ON "PostUtmeExam"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "PostUtmeExam_universityId_year_course_key" ON "PostUtmeExam"("universityId", "year", "course");

-- CreateIndex
CREATE INDEX "PostUtmeQuestion_examId_idx" ON "PostUtmeQuestion"("examId");

-- CreateIndex
CREATE INDEX "PostUtmeSession_userId_idx" ON "PostUtmeSession"("userId");

-- CreateIndex
CREATE INDEX "PostUtmeSession_examId_idx" ON "PostUtmeSession"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "PostUtmeResponse_sessionId_questionId_key" ON "PostUtmeResponse"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "AdmissionTracker_userId_idx" ON "AdmissionTracker"("userId");

-- CreateIndex
CREATE INDEX "AdmissionTracker_status_idx" ON "AdmissionTracker"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionTracker_userId_universityId_courseId_key" ON "AdmissionTracker"("userId", "universityId", "courseId");

-- CreateIndex
CREATE INDEX "AdmissionUpdate_trackerId_idx" ON "AdmissionUpdate"("trackerId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorProfile_userId_key" ON "TutorProfile"("userId");

-- CreateIndex
CREATE INDEX "TutorProfile_isAvailable_isVerified_idx" ON "TutorProfile"("isAvailable", "isVerified");

-- CreateIndex
CREATE INDEX "TutorProfile_rating_idx" ON "TutorProfile"("rating");

-- CreateIndex
CREATE INDEX "TutorSession_tutorId_idx" ON "TutorSession"("tutorId");

-- CreateIndex
CREATE INDEX "TutorSession_studentId_idx" ON "TutorSession"("studentId");

-- CreateIndex
CREATE INDEX "TutorSession_status_idx" ON "TutorSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TutorReview_sessionId_key" ON "TutorReview"("sessionId");

-- CreateIndex
CREATE INDEX "TutorReview_tutorId_idx" ON "TutorReview"("tutorId");

-- AddForeignKey
ALTER TABLE "PostUtmeExam" ADD CONSTRAINT "PostUtmeExam_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUtmeQuestion" ADD CONSTRAINT "PostUtmeQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "PostUtmeExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUtmeSession" ADD CONSTRAINT "PostUtmeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUtmeSession" ADD CONSTRAINT "PostUtmeSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "PostUtmeExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUtmeResponse" ADD CONSTRAINT "PostUtmeResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PostUtmeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUtmeResponse" ADD CONSTRAINT "PostUtmeResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PostUtmeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTracker" ADD CONSTRAINT "AdmissionTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTracker" ADD CONSTRAINT "AdmissionTracker_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTracker" ADD CONSTRAINT "AdmissionTracker_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionUpdate" ADD CONSTRAINT "AdmissionUpdate_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "AdmissionTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorReview" ADD CONSTRAINT "TutorReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TutorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorReview" ADD CONSTRAINT "TutorReview_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorReview" ADD CONSTRAINT "TutorReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
