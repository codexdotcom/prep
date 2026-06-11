-- AlterTable
ALTER TABLE "NoteView" ADD COLUMN     "bookmarked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "NoteView_userId_bookmarked_idx" ON "NoteView"("userId", "bookmarked");
