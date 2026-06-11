import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const topicId = searchParams.get("topicId");

    const where: any = { isPublished: true };
    if (subject) where.subject = subject;
    if (topicId) where.topicId = topicId;

    const notes = await db.generatedNote.findMany({
      where,
      include: {
        topic: { select: { name: true } },
        _count: { select: { views: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check which notes the user has viewed
    const viewedNotes = await db.noteView.findMany({
      where: { userId: session.user.id, noteId: { in: notes.map((n) => n.id) } },
      select: { noteId: true },
    });
    const viewedSet = new Set(viewedNotes.map((v) => v.noteId));

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        topicName: n.topic.name,
        summary: n.summary,
        questionCount: n.questionCount,
        difficulty: n.difficulty,
        version: n.version,
        views: n._count.views,
        viewed: viewedSet.has(n.id),
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("List notes error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}