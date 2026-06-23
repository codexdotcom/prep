import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const students = await db.studentProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
        jambSubjects: { select: { subject: true, priority: true }, orderBy: { priority: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      students.map((p) => ({
        id: p.id,
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        whatsappNumber: p.whatsappNumber,
        name: `${p.firstName} ${p.lastName}`,
        email: p.user.email,
        image: p.user.image,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        state: p.state,
        city: p.city,
        schoolName: p.schoolName,
        schoolType: p.schoolType,
        classLevel: p.classLevel,
        examYear: p.examYear,
        targetScore: p.targetScore,
        preferredCourse: p.preferredCourse,
        preferredUni: p.preferredUni,
        subjects: p.jambSubjects.map((s) => s.subject),
        studyHoursPerDay: p.studyHoursPerDay,
        preferredTimeSlot: p.preferredTimeSlot,
        learningStyle: p.learningStyle,
        previousJambScore: p.previousJambScore,
        mockTestsCompleted: p.mockTestsCompleted,
        riskLevel: p.riskLevel,
        onboardingCompletedAt: p.onboardingCompletedAt,
        diagnosticCompletedAt: p.diagnosticCompletedAt,
        joinedAt: p.user.createdAt,
      }))
    );
  } catch (error) {
    console.error("Admin students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}