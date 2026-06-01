-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('PUBLIC', 'PRIVATE', 'FEDERAL_GOVERNMENT', 'STATE_GOVERNMENT', 'INTERNATIONAL', 'HOME_SCHOOL');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('SS1', 'SS2', 'SS3', 'GRADUATE', 'GAP_YEAR');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'LATE_NIGHT');

-- CreateEnum
CREATE TYPE "LearningStyle" AS ENUM ('VISUAL', 'READING', 'PRACTICE', 'MIXED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'VERY_LOW');

-- CreateEnum
CREATE TYPE "JambSubject" AS ENUM ('USE_OF_ENGLISH', 'MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'LITERATURE', 'GOVERNMENT', 'ECONOMICS', 'COMMERCE', 'ACCOUNTING', 'CRS', 'IRS', 'GEOGRAPHY', 'AGRICULTURAL_SCIENCE', 'HISTORY', 'CIVIC_EDUCATION', 'COMPUTER_STUDIES', 'FINE_ARTS', 'MUSIC', 'ARABIC', 'FRENCH', 'HAUSA', 'IGBO', 'YORUBA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "emailVerified" TIMESTAMP(3),
    "hashedPassword" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "state" TEXT,
    "city" TEXT,
    "schoolName" TEXT,
    "schoolType" "SchoolType",
    "classLevel" "ClassLevel",
    "examYear" INTEGER NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "preferredCourse" TEXT,
    "preferredUni" TEXT,
    "studyHoursPerDay" DOUBLE PRECISION,
    "preferredTimeSlot" "TimeSlot",
    "learningStyle" "LearningStyle",
    "previousJambScore" INTEGER,
    "mockTestsCompleted" INTEGER NOT NULL DEFAULT 0,
    "onboardingCompletedAt" TIMESTAMP(3),
    "diagnosticCompletedAt" TIMESTAMP(3),
    "riskLevel" "RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JambSubjectChoice" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "JambSubjectChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "averageTimeMs" INTEGER NOT NULL,
    "topicBreakdown" JSONB NOT NULL,
    "weakTopics" TEXT[],
    "strongTopics" TEXT[],
    "carelessErrors" INTEGER NOT NULL,
    "predictedScore" DOUBLE PRECISION,
    "rawResponses" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JambSubjectChoice_profileId_subject_key" ON "JambSubjectChoice"("profileId", "subject");

-- CreateIndex
CREATE INDEX "DiagnosticResult_userId_subject_idx" ON "DiagnosticResult"("userId", "subject");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JambSubjectChoice" ADD CONSTRAINT "JambSubjectChoice_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
