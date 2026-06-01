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
    const cursor = searchParams.get("cursor");
    const subject = searchParams.get("subject");
    const type = searchParams.get("type");
    const limit = 10;

    const userId = session.user.id;

    // Get user's subjects for personalization
    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: { jambSubjects: true },
    });

    const userSubjects = profile?.jambSubjects.map((s) => s.subject) || [];

    // Build where clause
    const where: any = { isActive: true };

    if (subject) {
      where.subject = subject;
    } else if (userSubjects.length > 0) {
      // Prioritize user's subjects but include others
      where.subject = { in: [...userSubjects, "USE_OF_ENGLISH"] };
    }

    if (type) {
      where.type = type;
    }

    if (cursor) {
      where.id = { lt: cursor };
    }

    // Get content the user hasn't seen recently (or shuffle)
    const viewedIds = await db.microInteraction.findMany({
      where: { userId, viewed: true },
      select: { contentId: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const viewedSet = new Set(viewedIds.map((v) => v.contentId));

    // Fetch more than needed to filter
    const allContent = await db.microContent.findMany({
      where,
      include: {
        topic: { select: { name: true } },
        interactions: {
          where: { userId },
          select: { liked: true, saved: true },
        },
      },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
      take: limit * 3,
    });

    // Sort: unseen first, then seen
    const unseen = allContent.filter((c) => !viewedSet.has(c.id));
    const seen = allContent.filter((c) => viewedSet.has(c.id));

    // Shuffle unseen for variety
    for (let i = unseen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
    }

    const feed = [...unseen, ...seen].slice(0, limit).map((c) => ({
      id: c.id,
      type: c.type,
      subject: c.subject,
      title: c.title,
      body: c.body,
      imageUrl: c.imageUrl,
      tags: c.tags,
      difficulty: c.difficulty,
      topicName: c.topic?.name || null,
      views: c.views,
      likes: c.likes,
      saves: c.saves,
      liked: c.interactions[0]?.liked || false,
      saved: c.interactions[0]?.saved || false,
    }));

    const nextCursor = feed.length === limit ? feed[feed.length - 1].id : null;

    return NextResponse.json({ feed, nextCursor });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}