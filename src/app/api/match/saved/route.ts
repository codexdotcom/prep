import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const matches = await db.universityMatch.findMany({
      where: { userId: session.user.id, action: { in: ["LIKED", "SAVED"] } },
      include: {
        university: { select: { name: true, shortName: true, state: true, type: true } },
        course: { select: { name: true, jambCutoff: true } },
      },
      orderBy: { matchScore: "desc" },
    });

    return NextResponse.json({
      matches: matches.map((m) => ({
        id: m.id,
        universityName: m.university.name,
        universityShortName: m.university.shortName,
        universityState: m.university.state,
        courseName: m.course.name,
        jambCutoff: m.course.jambCutoff,
        matchScore: m.matchScore,
        action: m.action,
        savedAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Saved matches error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}