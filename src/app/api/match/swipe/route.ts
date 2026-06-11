import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { universityId, courseId, action, matchScore } = await req.json();

    if (!universityId || !courseId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await db.universityMatch.upsert({
      where: { userId_universityId_courseId: { userId: session.user.id, universityId, courseId } },
      update: { action, matchScore: matchScore || 0 },
      create: { userId: session.user.id, universityId, courseId, action, matchScore: matchScore || 0 },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Swipe error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}