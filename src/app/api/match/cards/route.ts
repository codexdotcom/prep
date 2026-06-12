import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: { jambSubjects: true },
    });

    // Get user's current performance
    const responses = await db.questionResponse.findMany({
      where: { userId, session: { status: "COMPLETED" } },
      include: { question: { select: { subject: true } } },
    });

    let predictedScore = 200;
    if (responses.length >= 10) {
      const correct = responses.filter((r) => r.isCorrect).length;
      predictedScore = Math.round((correct / responses.length) * 400);
    }

    // Get already swiped
    const swiped = await db.universityMatch.findMany({
      where: { userId },
      select: { universityId: true, courseId: true },
    });
    const swipedKeys = new Set(swiped.map((s) => `${s.universityId}-${s.courseId}`));

    // Fetch all courses with universities
    const courses = await db.course.findMany({
      where: { university: { isActive: true } },
      include: {
        university: true,
      },
      orderBy: { jambCutoff: "asc" },
    });

    // Score each course for this user
    const cards = courses
      .filter((c) => !swipedKeys.has(`${c.universityId}-${c.id}`))
      .map((c) => {
        let matchScore = 50;

        // Score vs cutoff
        if (c.jambCutoff) {
          const diff = predictedScore - c.jambCutoff;
          if (diff >= 50) matchScore += 30;
          else if (diff >= 20) matchScore += 20;
          else if (diff >= 0) matchScore += 10;
          else if (diff >= -20) matchScore -= 5;
          else matchScore -= 15;
        }

        // State match
        if (profile?.state && c.university.state === profile.state) {
          matchScore += 10;
        }

        // Preferred course match
        if (profile?.preferredCourse) {
          const pref = profile.preferredCourse.toLowerCase();
          if (c.name.toLowerCase().includes(pref) || pref.includes(c.name.toLowerCase())) {
            matchScore += 15;
          }
        }

        matchScore = Math.max(5, Math.min(99, matchScore));

        return {
          id: c.id,
          universityId: c.universityId,
          universityName: c.university.name,
          universityShortName: c.university.shortName,
          universityState: c.university.state,
          universityType: c.university.type,
          courseName: c.name,
          jambCutoff: c.jambCutoff,
          capacity: c.competitiveness,
          matchScore,
          admissionChance: predictedScore >= (c.jambCutoff || 180)
            ? Math.min(95, matchScore + Math.round((predictedScore - (c.jambCutoff || 180)) / 5))
            : Math.max(5, matchScore - Math.round(((c.jambCutoff || 180) - predictedScore) / 3)),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 30);

    return NextResponse.json({
      cards,
      predictedScore,
      totalSwiped: swiped.length,
    });
  } catch (error) {
    console.error("Match cards error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}