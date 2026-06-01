-- CreateEnum
CREATE TYPE "WAState" AS ENUM ('IDLE', 'ONBOARDING_NAME', 'ONBOARDING_SUBJECTS', 'QUIZ_ACTIVE', 'WAITING_ANSWER', 'ASKING_AI');

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "state" "WAState" NOT NULL DEFAULT 'IDLE',
    "context" JSONB,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_phone_key" ON "WhatsAppSession"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppSession_phone_idx" ON "WhatsAppSession"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppSession_userId_idx" ON "WhatsAppSession"("userId");

-- AddForeignKey
ALTER TABLE "WhatsAppSession" ADD CONSTRAINT "WhatsAppSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
