// src/app/api/center/students/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const center = await db.tutorialCenter.findFirst({ where: { adminId: session.user.id } });
    if (!center) return NextResponse.json({ error: "Not a center admin" }, { status: 403 });

    const enrollments = await db.centerStudent.findMany({
      where: { centerId: center.id },
      orderBy: { joinedAt: "desc" },
    });

    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [user, profile, responses, streak, xp] = await Promise.all([
          db.user.findUnique({
            where: { id: enrollment.userId },
            select: { id: true, name: true, email: true },
          }),
          db.studentProfile.findUnique({
            where: { userId: enrollment.userId },
            select: { firstName: true, lastName: true, targetScore: true, examYear: true },
          }),
          db.questionResponse.findMany({
            where: { userId: enrollment.userId },
            select: { isCorrect: true },
            take: 200,
          }),
          db.studyStreak.findUnique({ where: { userId: enrollment.userId } }),
          db.userXP.findUnique({ where: { userId: enrollment.userId } }),
        ]);

        const total = responses.length;
        const correct = responses.filter((r) => r.isCorrect).length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        return {
          id: enrollment.id,
          userId: enrollment.userId,
          name: profile?.firstName
            ? `${profile.firstName} ${profile.lastName || ""}`.trim()
            : user?.name || "Student",
          email: user?.email || "",
          accuracy,
          predictedScore: Math.round((accuracy / 100) * 400),
          questionsAnswered: total,
          streak: streak?.currentStreak || 0,
          level: xp?.level || 1,
          joinedAt: enrollment.joinedAt,
        };
      })
    );

    return NextResponse.json({ students: enriched, centerName: center.name });
  } catch (error) {
    console.error("Center students error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}