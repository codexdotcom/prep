-- CreateEnum
CREATE TYPE "UniType" AS ENUM ('FEDERAL', 'STATE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "Competitiveness" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'EXTREME');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" "UniType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT,
    "jambCutoff" INTEGER NOT NULL,
    "departmentalCutoff" INTEGER,
    "requiredSubjects" "JambSubject"[],
    "competitiveness" "Competitiveness" NOT NULL DEFAULT 'MODERATE',
    "acceptanceRate" DOUBLE PRECISION,
    "totalSlots" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealityCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "predictedScore" INTEGER NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "gap" INTEGER NOT NULL,
    "roadmap" JSONB,
    "subjectBreakdown" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_shortName_key" ON "University"("shortName");

-- CreateIndex
CREATE INDEX "University_state_idx" ON "University"("state");

-- CreateIndex
CREATE INDEX "Course_universityId_idx" ON "Course"("universityId");

-- CreateIndex
CREATE INDEX "Course_jambCutoff_idx" ON "Course"("jambCutoff");

-- CreateIndex
CREATE UNIQUE INDEX "Course_universityId_name_key" ON "Course"("universityId", "name");

-- CreateIndex
CREATE INDEX "RealityCheck_userId_idx" ON "RealityCheck"("userId");

-- CreateIndex
CREATE INDEX "RealityCheck_userId_courseId_idx" ON "RealityCheck"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealityCheck" ADD CONSTRAINT "RealityCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealityCheck" ADD CONSTRAINT "RealityCheck_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
