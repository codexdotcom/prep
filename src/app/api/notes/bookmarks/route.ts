import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookmarks = await db.noteView.findMany({
      where: { userId: session.user.id, bookmarked: true },
      include: {
        note: {
          include: { topic: { select: { name: true } } },
        },
      },
      orderBy: { viewedAt: "desc" },
    });

    return NextResponse.json({
      notes: bookmarks.map((b) => ({
        id: b.note.id,
        title: b.note.title,
        subject: b.note.subject,
        topicName: b.note.topic.name,
        summary: b.note.summary,
        questionCount: b.note.questionCount,
        difficulty: b.note.difficulty,
        bookmarkedAt: b.viewedAt,
      })),
    });
  } catch (error) {
    console.error("Bookmarks error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}