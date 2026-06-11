import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { displayName, bio, subjects, qualifications, experience, hourlyRate, state } = await req.json();

    if (!displayName || !bio || !subjects?.length || !hourlyRate) {
      return NextResponse.json({ error: "Name, bio, subjects, and rate required" }, { status: 400 });
    }

    const existing = await db.tutorProfile.findUnique({ where: { userId: session.user.id } });
    if (existing) return NextResponse.json({ error: "Already registered as tutor" }, { status: 400 });

    const tutor = await db.tutorProfile.create({
      data: {
        userId: session.user.id,
        displayName,
        bio,
        subjects,
        qualifications: qualifications || [],
        experience: experience || null,
        hourlyRate,
        state: state || null,
        avatarUrl: session.user.image || null,
      },
    });

    return NextResponse.json({ tutor }, { status: 201 });
  } catch (error) {
    console.error("Tutor register error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}