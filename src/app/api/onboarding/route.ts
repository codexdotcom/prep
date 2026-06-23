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

    // ── Ensure user exists ──
    // With JWT strategy + Google OAuth, the User row may not exist
    let userId = session.user.id;

    let user = await db.user.findUnique({ where: { id: userId } });

    if (!user && session.user.email) {
      // Try finding by email (NextAuth may have created with different ID)
      user = await db.user.findUnique({ where: { email: session.user.email } });
    }

    if (!user) {
      // Create the user
      console.log("Creating missing user:", { id: userId, email: session.user.email });
      try {
        user = await db.user.create({
          data: {
            id: userId,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          },
        });
        console.log("User created successfully:", user.id);
      } catch (createErr: any) {
        // If unique constraint on email, find the existing one
        if (createErr.code === "P2002") {
          user = await db.user.findUnique({ where: { email: session.user.email! } });
          console.log("User already existed by email:", user?.id);
        } else {
          console.error("Failed to create user:", createErr);
          throw createErr;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Could not create or find user account" }, { status: 500 });
    }

    // Use the actual DB user ID (might differ from JWT ID)
    userId = user.id;

    console.log("Onboarding for user:", userId);

    // ── Verify the user really exists before FK reference ──
    const verify = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!verify) {
      console.error("CRITICAL: User still not found after creation:", userId);
      return NextResponse.json({ error: "User account not found" }, { status: 500 });
    }

    // ── Upsert the profile ──
    const profile = await db.studentProfile.upsert({
      where: { userId },
      update: {
        firstName: personal.firstName,
        lastName: personal.lastName,
         whatsappNumber: personal.whatsappNumber || null,
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
      create: {
        userId,
        firstName: personal.firstName,
        lastName: personal.lastName,
         whatsappNumber: personal.whatsappNumber || null,
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

    // ── Subject choices ──
    const subjectData = [
      { profileId: profile.id, subject: "USE_OF_ENGLISH" as const, priority: 1 },
      ...goals.subjects.map((subject, index) => ({
        profileId: profile.id,
        subject: subject as any,
        priority: index + 2,
      })),
    ];

    await db.jambSubjectChoice.deleteMany({
      where: { profileId: profile.id },
    });

    await db.jambSubjectChoice.createMany({ data: subjectData });

    // ── Initialize gamification ──
    await db.userXP.upsert({
      where: { userId },
      update: {},
      create: { userId, totalXP: 0, level: 1 },
    });

    await db.studyStreak.upsert({
      where: { userId },
      update: {},
      create: { userId, currentStreak: 0, longestStreak: 0 },
    });

    return NextResponse.json({
      message: "Onboarding complete",
      profileId: profile.id,
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