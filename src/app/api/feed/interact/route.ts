import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contentId, action, viewDuration } = await req.json();

    if (!contentId || !action) {
      return NextResponse.json({ error: "contentId and action required" }, { status: 400 });
    }

    const userId = session.user.id;

    const existing = await db.microInteraction.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    switch (action) {
      case "view": {
        if (existing) {
          await db.microInteraction.update({
            where: { id: existing.id },
            data: { viewed: true, viewDuration: (existing.viewDuration || 0) + (viewDuration || 0) },
          });
        } else {
          await db.microInteraction.create({
            data: { userId, contentId, viewed: true, viewDuration: viewDuration || 0 },
          });
        }
        await db.microContent.update({
          where: { id: contentId },
          data: { views: { increment: 1 } },
        });
        break;
      }

      case "like": {
        const newLiked = existing ? !existing.liked : true;
        await db.microInteraction.upsert({
          where: { userId_contentId: { userId, contentId } },
          update: { liked: newLiked },
          create: { userId, contentId, liked: true },
        });
        await db.microContent.update({
          where: { id: contentId },
          data: { likes: { increment: newLiked ? 1 : -1 } },
        });
        return NextResponse.json({ liked: newLiked });
      }

      case "save": {
        const newSaved = existing ? !existing.saved : true;
        await db.microInteraction.upsert({
          where: { userId_contentId: { userId, contentId } },
          update: { saved: newSaved },
          create: { userId, contentId, saved: true },
        });
        await db.microContent.update({
          where: { id: contentId },
          data: { saves: { increment: newSaved ? 1 : -1 } },
        });
        return NextResponse.json({ saved: newSaved });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Interact error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}