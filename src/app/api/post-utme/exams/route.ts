import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get("universityId");
    if (!universityId) return NextResponse.json({ error: "University required" }, { status: 400 });

    const exams = await db.postUtmeExam.findMany({
      where: { universityId, isActive: true },
      include: {
        university: { select: { name: true, shortName: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { year: "desc" },
    });

    // Get user's past sessions
    const sessions = await db.postUtmeSession.findMany({
      where: { userId: session.user.id, examId: { in: exams.map((e) => e.id) } },
      select: { examId: true, score: true, status: true },
    });

    const sessionMap = new Map(sessions.map((s) => [s.examId, s]));

    return NextResponse.json({
      exams: exams.map((e) => {
        const s = sessionMap.get(e.id);
        return {
          id: e.id,
          university: e.university.name,
          universityShort: e.university.shortName,
          year: e.year,
          course: e.course,
          duration: e.duration,
          totalQuestions: e._count.questions,
          attempted: !!s,
          lastScore: s?.score || null,
          lastStatus: s?.status || null,
        };
      }),
    });
  } catch (error) {
    console.error("Post-UTME exams error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}