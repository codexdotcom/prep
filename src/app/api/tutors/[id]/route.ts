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

    const tutor = await db.tutorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, image: true } },
        reviews: {
          where: { isPublic: true },
          include: { student: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { sessions: true, reviews: true } },
      },
    });

    if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });

    return NextResponse.json({
      tutor: {
        id: tutor.id,
        userId: tutor.userId,
        displayName: tutor.displayName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: tutor.qualifications,
        experience: tutor.experience,
        hourlyRate: tutor.hourlyRate,
        rating: tutor.rating,
        totalReviews: tutor._count.reviews,
        totalSessions: tutor._count.sessions,
        isVerified: tutor.isVerified,
        state: tutor.state,
        avatarUrl: tutor.avatarUrl || tutor.user.image,
        availableSlots: tutor.availableSlots,
        reviews: tutor.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          studentName: r.student.name?.split(" ")[0] || "Student",
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Tutor detail error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}