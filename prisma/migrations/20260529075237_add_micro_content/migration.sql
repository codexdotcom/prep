-- CreateEnum
CREATE TYPE "MicroContentType" AS ENUM ('TRICK', 'MNEMONIC', 'TRAP', 'FLASHCARD', 'HACK', 'FACT', 'FORMULA', 'MISTAKE');

-- CreateTable
CREATE TABLE "MicroContent" (
    "id" TEXT NOT NULL,
    "type" "MicroContentType" NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT[],
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "viewed" BOOLEAN NOT NULL DEFAULT true,
    "viewDuration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MicroContent_subject_isActive_idx" ON "MicroContent"("subject", "isActive");

-- CreateIndex
CREATE INDEX "MicroContent_type_isActive_idx" ON "MicroContent"("type", "isActive");

-- CreateIndex
CREATE INDEX "MicroInteraction_userId_idx" ON "MicroInteraction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MicroInteraction_userId_contentId_key" ON "MicroInteraction"("userId", "contentId");

-- AddForeignKey
ALTER TABLE "MicroContent" ADD CONSTRAINT "MicroContent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroInteraction" ADD CONSTRAINT "MicroInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroInteraction" ADD CONSTRAINT "MicroInteraction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "MicroContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
