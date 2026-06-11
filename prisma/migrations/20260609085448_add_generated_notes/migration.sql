-- CreateTable
CREATE TABLE "GeneratedNote" (
    "id" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "keyFormulas" TEXT[],
    "commonMistakes" TEXT[],
    "examTips" TEXT[],
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "generatedFrom" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NoteView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" "JambSubject" NOT NULL,
    "topicId" TEXT,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedNote_subject_isPublished_idx" ON "GeneratedNote"("subject", "isPublished");

-- CreateIndex
CREATE INDEX "GeneratedNote_topicId_idx" ON "GeneratedNote"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedNote_subject_topicId_version_key" ON "GeneratedNote"("subject", "topicId", "version");

-- CreateIndex
CREATE INDEX "NoteView_userId_idx" ON "NoteView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteView_userId_noteId_key" ON "NoteView"("userId", "noteId");

-- CreateIndex
CREATE INDEX "NoteUpload_userId_idx" ON "NoteUpload"("userId");

-- CreateIndex
CREATE INDEX "NoteUpload_subject_idx" ON "NoteUpload"("subject");

-- AddForeignKey
ALTER TABLE "GeneratedNote" ADD CONSTRAINT "GeneratedNote_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteView" ADD CONSTRAINT "NoteView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteView" ADD CONSTRAINT "NoteView_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "GeneratedNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteUpload" ADD CONSTRAINT "NoteUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
