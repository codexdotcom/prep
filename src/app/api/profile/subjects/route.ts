import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ subjects: [] });

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { jambSubjects: { orderBy: { priority: "asc" } } },
    });

    return NextResponse.json({
      subjects: profile?.jambSubjects.map((s) => s.subject as string) || [],
    });
  } catch {
    return NextResponse.json({ subjects: [] });
  }
}