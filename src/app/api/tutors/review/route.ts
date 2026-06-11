import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, rating, comment } = await req.json();

    const tutorSession = await db.tutorSession.findUnique({ where: { id: sessionId } });
    if (!tutorSession || tutorSession.studentId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (tutorSession.status !== "COMPLETED") {
      return NextResponse.json({ error: "Session not yet completed" }, { status: 400 });
    }

    const existing = await db.tutorReview.findUnique({ where: { sessionId } });
    if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

    await db.tutorReview.create({
      data: {
        sessionId,
        tutorId: tutorSession.tutorId,
        studentId: session.user.id,
        rating,
        comment: comment || null,
      },
    });

    // Update tutor's average rating
    const allReviews = await db.tutorReview.findMany({
      where: { tutorId: tutorSession.tutorId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    await db.tutorProfile.update({
      where: { id: tutorSession.tutorId },
      data: { rating: Math.round(avgRating * 10) / 10, totalReviews: allReviews.length },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}