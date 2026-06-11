import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;

    const existing = await db.noteView.findUnique({
      where: { userId_noteId: { userId, noteId: id } },
    });

    const newBookmarked = existing ? !existing.bookmarked : true;

    await db.noteView.upsert({
      where: { userId_noteId: { userId, noteId: id } },
      update: { bookmarked: newBookmarked },
      create: { userId, noteId: id, bookmarked: true },
    });

    return NextResponse.json({ bookmarked: newBookmarked });
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}