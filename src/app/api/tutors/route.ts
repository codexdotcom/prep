import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const state = searchParams.get("state");
    const maxRate = searchParams.get("maxRate");
    const search = searchParams.get("search");

    const where: any = { isAvailable: true };
    if (subject) where.subjects = { has: subject };
    if (state) where.state = state;
    if (maxRate) where.hourlyRate = { lte: parseInt(maxRate) };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    const tutors = await db.tutorProfile.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { sessions: true, reviews: true } },
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { totalSessions: "desc" }],
      take: 30,
    });

    return NextResponse.json({
      tutors: tutors.map((t) => ({
        id: t.id,
        userId: t.userId,
        displayName: t.displayName,
        bio: t.bio.slice(0, 200),
        subjects: t.subjects,
        qualifications: t.qualifications,
        hourlyRate: t.hourlyRate,
        rating: t.rating,
        totalReviews: t._count.reviews,
        totalSessions: t._count.sessions,
        isVerified: t.isVerified,
        state: t.state,
        avatarUrl: t.avatarUrl || t.user.image,
      })),
    });
  } catch (error) {
    console.error("Tutors error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}