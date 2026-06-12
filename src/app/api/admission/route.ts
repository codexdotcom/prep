import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trackers = await db.admissionTracker.findMany({
      where: { userId: session.user.id },
      include: {
        university: { select: { name: true, shortName: true, state: true } },
        course: { select: { name: true, jambCutoff: true } },
        updates: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ trackers });
  } catch (error) {
    console.error("Admission tracker error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { universityId, courseId, jambScore, jambRegNumber, oLevelGrades } = await req.json();
    if (!universityId || !courseId) return NextResponse.json({ error: "University and course required" }, { status: 400 });

    const tracker = await db.admissionTracker.create({
      data: {
        userId: session.user.id,
        universityId,
        courseId,
        jambScore: jambScore || null,
        jambRegNumber: jambRegNumber || null,
        oLevelGrades: oLevelGrades || null,
        status: jambScore ? "JAMB_SUBMITTED" : "AWAITING_RESULTS",
      },
      include: {
        university: { select: { name: true, shortName: true } },
        course: { select: { name: true } },
      },
    });

    // Create initial update
    await db.admissionUpdate.create({
      data: {
        trackerId: tracker.id,
        title: "Admission tracking started",
        description: `You are now tracking your ${tracker.course.name} admission at ${tracker.university.name}.`,
        type: "MILESTONE",
      },
    });

    return NextResponse.json({ tracker }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Already tracking this course" }, { status: 400 });
    console.error("Create tracker error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}