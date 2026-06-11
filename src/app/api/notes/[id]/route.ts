import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const note = await db.generatedNote.findUnique({
      where: { id },
      include: { topic: { select: { name: true, subject: true } } },
    });

    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    // Track view + get bookmark status
    const view = await db.noteView.upsert({
      where: { userId_noteId: { userId: session.user.id, noteId: id } },
      update: { viewedAt: new Date() },
      create: { userId: session.user.id, noteId: id },
    });

    return NextResponse.json({
      id: note.id,
      title: note.title,
      subject: note.subject,
      topicName: note.topic.name,
      content: note.content,
      summary: note.summary,
      keyFormulas: note.keyFormulas,
      commonMistakes: note.commonMistakes,
      examTips: note.examTips,
      questionCount: note.questionCount,
      difficulty: note.difficulty,
      version: note.version,
      bookmarked: view.bookmarked,
      createdAt: note.createdAt,
    });
  } catch (error) {
    console.error("Get note error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}