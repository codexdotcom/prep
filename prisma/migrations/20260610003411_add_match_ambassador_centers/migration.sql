-- CreateEnum
CREATE TYPE "MatchAction" AS ENUM ('LIKED', 'SKIPPED', 'SAVED');

-- CreateEnum
CREATE TYPE "AmbassadorTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "RecruitStatus" AS ENUM ('SIGNED_UP', 'ONBOARDED', 'ACTIVE', 'SUBSCRIBED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CenterPlan" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "UniversityMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "action" "MatchAction" NOT NULL,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambassador" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolState" TEXT NOT NULL,
    "schoolType" "SchoolType" NOT NULL DEFAULT 'PRIVATE',
    "tier" "AmbassadorTier" NOT NULL DEFAULT 'BRONZE',
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "activeReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" INTEGER NOT NULL DEFAULT 0,
    "pendingPayout" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorRecruit" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "recruitUserId" TEXT NOT NULL,
    "status" "RecruitStatus" NOT NULL DEFAULT 'SIGNED_UP',
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorRecruit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorPayout" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorialCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#22c55e',
    "plan" "CenterPlan" NOT NULL DEFAULT 'BASIC',
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorialCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenterTeacher" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'teacher',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenterStudent" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinCode" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UniversityMatch_userId_action_idx" ON "UniversityMatch"("userId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityMatch_userId_universityId_courseId_key" ON "UniversityMatch"("userId", "universityId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_userId_key" ON "Ambassador"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_code_key" ON "Ambassador"("code");

-- CreateIndex
CREATE INDEX "Ambassador_code_idx" ON "Ambassador"("code");

-- CreateIndex
CREATE INDEX "Ambassador_schoolState_idx" ON "Ambassador"("schoolState");

-- CreateIndex
CREATE INDEX "Ambassador_tier_idx" ON "Ambassador"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "AmbassadorRecruit_recruitUserId_key" ON "AmbassadorRecruit"("recruitUserId");

-- CreateIndex
CREATE INDEX "AmbassadorRecruit_ambassadorId_idx" ON "AmbassadorRecruit"("ambassadorId");

-- CreateIndex
CREATE INDEX "AmbassadorPayout_ambassadorId_idx" ON "AmbassadorPayout"("ambassadorId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorialCenter_slug_key" ON "TutorialCenter"("slug");

-- CreateIndex
CREATE INDEX "TutorialCenter_slug_idx" ON "TutorialCenter"("slug");

-- CreateIndex
CREATE INDEX "TutorialCenter_state_idx" ON "TutorialCenter"("state");

-- CreateIndex
CREATE INDEX "TutorialCenter_adminId_idx" ON "TutorialCenter"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "CenterTeacher_centerId_userId_key" ON "CenterTeacher"("centerId", "userId");

-- CreateIndex
CREATE INDEX "CenterStudent_centerId_idx" ON "CenterStudent"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "CenterStudent_centerId_userId_key" ON "CenterStudent"("centerId", "userId");

-- AddForeignKey
ALTER TABLE "UniversityMatch" ADD CONSTRAINT "UniversityMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityMatch" ADD CONSTRAINT "UniversityMatch_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityMatch" ADD CONSTRAINT "UniversityMatch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ambassador" ADD CONSTRAINT "Ambassador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorRecruit" ADD CONSTRAINT "AmbassadorRecruit_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorRecruit" ADD CONSTRAINT "AmbassadorRecruit_recruitUserId_fkey" FOREIGN KEY ("recruitUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorPayout" ADD CONSTRAINT "AmbassadorPayout_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialCenter" ADD CONSTRAINT "TutorialCenter_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterTeacher" ADD CONSTRAINT "CenterTeacher_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "TutorialCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterTeacher" ADD CONSTRAINT "CenterTeacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterStudent" ADD CONSTRAINT "CenterStudent_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "TutorialCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterStudent" ADD CONSTRAINT "CenterStudent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
