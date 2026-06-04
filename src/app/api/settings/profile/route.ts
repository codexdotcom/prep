import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        jambSubjects: { orderBy: { priority: "asc" } },
      },
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        state: profile.state,
        city: profile.city,
        schoolName: profile.schoolName,
        schoolType: profile.schoolType,
        classLevel: profile.classLevel,
        examYear: profile.examYear,
        targetScore: profile.targetScore,
        preferredCourse: profile.preferredCourse,
        preferredUni: profile.preferredUni,
        studyHoursPerDay: profile.studyHoursPerDay,
        preferredTimeSlot: profile.preferredTimeSlot,
        learningStyle: profile.learningStyle,
        subjects: profile.jambSubjects.map((s) => s.subject),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data: any = {};
    const fields = [
      "firstName", "lastName", "state", "city", "schoolName",
      "schoolType", "classLevel", "examYear", "targetScore",
      "preferredCourse", "preferredUni", "studyHoursPerDay",
      "preferredTimeSlot", "learningStyle",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        data[field] = body[field] || null;
      }
    }

    // Keep required fields non-null
    if (data.firstName === null) delete data.firstName;
    if (data.lastName === null) delete data.lastName;
    if (data.examYear === null) delete data.examYear;
    if (data.targetScore === null) delete data.targetScore;

    await db.studentProfile.update({
      where: { userId: session.user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}