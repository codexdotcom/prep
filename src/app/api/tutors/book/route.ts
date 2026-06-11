import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tutorId, subject, topic, scheduledAt, duration } = await req.json();

    const tutor = await db.tutorProfile.findUnique({ where: { id: tutorId } });
    if (!tutor || !tutor.isAvailable) return NextResponse.json({ error: "Tutor not available" }, { status: 400 });
    if (tutor.userId === session.user.id) return NextResponse.json({ error: "Cannot book yourself" }, { status: 400 });

    const hours = (duration || 60) / 60;
    const amount = Math.round(tutor.hourlyRate * hours);

    const booking = await db.tutorSession.create({
      data: {
        tutorId,
        studentId: session.user.id,
        subject,
        topic: topic || null,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        amount,
        status: "PENDING",
      },
    });

    return NextResponse.json({ booking, amount }, { status: 201 });
  } catch (error) {
    console.error("Book tutor error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}