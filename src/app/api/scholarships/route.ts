import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { jambSubjects: true },
    });

    const where: any = { isActive: true };

    const scholarships = await db.scholarship.findMany({
      where,
      orderBy: { deadline: "asc" },
    });

    // Score relevance for each scholarship
    const scored = scholarships.map((s) => {
      let relevance = 50;
      const elig = s.eligibility as any;

      if (profile?.state && s.states.length > 0) {
        relevance += s.states.includes(profile.state) ? 20 : -10;
      }
      if (profile?.preferredCourse && s.courses.length > 0) {
        relevance += s.courses.some((c: string) => profile.preferredCourse?.toLowerCase().includes(c.toLowerCase())) ? 20 : 0;
      }
      if (s.deadline && new Date(s.deadline) < new Date()) {
        relevance -= 30; // expired
      }

      return { ...s, relevance: Math.max(0, Math.min(100, relevance)) };
    });

    scored.sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({ scholarships: scored });
  } catch (error) {
    console.error("Scholarships error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}