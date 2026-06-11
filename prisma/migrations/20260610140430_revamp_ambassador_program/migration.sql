/*
  Warnings:

  - The values [PLATINUM] on the enum `AmbassadorTier` will be removed. If these variants are still used in the database, this will fail.
  - The values [ONBOARDED] on the enum `RecruitStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `activeReferrals` on the `Ambassador` table. All the data in the column will be lost.
  - You are about to drop the column `totalReferrals` on the `Ambassador` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `AmbassadorRecruit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AmbassadorTier_new" AS ENUM ('STARTER', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'LEGEND');
ALTER TABLE "public"."Ambassador" ALTER COLUMN "tier" DROP DEFAULT;
ALTER TABLE "Ambassador" ALTER COLUMN "tier" TYPE "AmbassadorTier_new" USING ("tier"::text::"AmbassadorTier_new");
ALTER TYPE "AmbassadorTier" RENAME TO "AmbassadorTier_old";
ALTER TYPE "AmbassadorTier_new" RENAME TO "AmbassadorTier";
DROP TYPE "public"."AmbassadorTier_old";
ALTER TABLE "Ambassador" ALTER COLUMN "tier" SET DEFAULT 'STARTER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RecruitStatus_new" AS ENUM ('SIGNED_UP', 'PROFILED', 'VERIFIED', 'ACTIVE', 'SUBSCRIBED', 'CHURNED');
ALTER TABLE "public"."AmbassadorRecruit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AmbassadorRecruit" ALTER COLUMN "status" TYPE "RecruitStatus_new" USING ("status"::text::"RecruitStatus_new");
ALTER TYPE "RecruitStatus" RENAME TO "RecruitStatus_old";
ALTER TYPE "RecruitStatus_new" RENAME TO "RecruitStatus";
DROP TYPE "public"."RecruitStatus_old";
ALTER TABLE "AmbassadorRecruit" ALTER COLUMN "status" SET DEFAULT 'SIGNED_UP';
COMMIT;

-- AlterTable
ALTER TABLE "Ambassador" DROP COLUMN "activeReferrals",
DROP COLUMN "totalReferrals",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isSchoolCaptain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "monthlyEarnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyReferrals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "premiumConversions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schoolCity" TEXT,
ADD COLUMN     "totalSignups" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedReferrals" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "tier" SET DEFAULT 'STARTER';

-- AlterTable
ALTER TABLE "AmbassadorPayout" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "AmbassadorRecruit" ADD COLUMN     "firstTestTaken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signupPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "upgradedAt" TIMESTAMP(3),
ADD COLUMN     "upgradedToPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedPaid" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AmbassadorChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "prize1" INTEGER NOT NULL DEFAULT 100000,
    "prize2" INTEGER NOT NULL DEFAULT 50000,
    "prize3" INTEGER NOT NULL DEFAULT 25000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmbassadorChallenge_month_year_key" ON "AmbassadorChallenge"("month", "year");

-- CreateIndex
CREATE INDEX "Ambassador_verifiedReferrals_idx" ON "Ambassador"("verifiedReferrals");

-- CreateIndex
CREATE INDEX "Ambassador_totalEarnings_idx" ON "Ambassador"("totalEarnings");

-- CreateIndex
CREATE INDEX "AmbassadorPayout_status_idx" ON "AmbassadorPayout"("status");

-- CreateIndex
CREATE INDEX "AmbassadorRecruit_status_idx" ON "AmbassadorRecruit"("status");
