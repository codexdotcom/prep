import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  personalInfoSchema,
  educationSchema,
  jambGoalsSchema,
  studyPreferencesSchema,
} from "@/lib/validations/onboarding";
import { z } from "zod";

const fullOnboardingSchema = z.object({
  personal: personalInfoSchema,
  education: educationSchema,
  goals: jambGoalsSchema,
  preferences: studyPreferencesSchema,
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = fullOnboardingSchema.parse(body);

    const { personal, education, goals, preferences } = validated;

    // Upsert the profile
    const profile = await db.studentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...personal,
        dateOfBirth: personal.dateOfBirth
          ? new Date(personal.dateOfBirth)
          : undefined,
        ...education,
        ...preferences,
        examYear: goals.examYear,
        targetScore: goals.targetScore,
        preferredCourse: goals.preferredCourse,
        preferredUni: goals.preferredUni,
        previousJambScore: goals.previousJambScore,
        onboardingCompletedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        firstName: personal.firstName,
        lastName: personal.lastName,
        dateOfBirth: personal.dateOfBirth
          ? new Date(personal.dateOfBirth)
          : undefined,
        gender: personal.gender as any,
        state: personal.state,
        city: personal.city,
        schoolName: education.schoolName,
        schoolType: education.schoolType as any,
        classLevel: education.classLevel as any,
        examYear: goals.examYear,
        targetScore: goals.targetScore,
        preferredCourse: goals.preferredCourse,
        preferredUni: goals.preferredUni,
        previousJambScore: goals.previousJambScore,
        studyHoursPerDay: preferences.studyHoursPerDay,
        preferredTimeSlot: preferences.preferredTimeSlot as any,
        learningStyle: preferences.learningStyle as any,
        onboardingCompletedAt: new Date(),
      },
    });

    // Create subject choices
    const subjectData = [
      { profileId: profile.id, subject: "USE_OF_ENGLISH" as const, priority: 1 },
      ...goals.subjects.map((subject, index) => ({
        profileId: profile.id,
        subject: subject as any,
        priority: index + 2,
      })),
    ];

    // Clear existing and insert new
    await db.jambSubjectChoice.deleteMany({
      where: { profileId: profile.id },
    });

    await db.jambSubjectChoice.createMany({ data: subjectData });

    return NextResponse.json({
      message: "Onboarding complete",
      profileId: profile.id,
      redirectTo: "/diagnostic",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}