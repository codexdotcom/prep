import { z } from "zod";

export const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

export const educationSchema = z.object({
  schoolName: z.string().optional(),
  schoolType: z
    .enum([
      "PUBLIC",
      "PRIVATE",
      "FEDERAL_GOVERNMENT",
      "STATE_GOVERNMENT",
      "INTERNATIONAL",
      "HOME_SCHOOL",
    ])
    .optional(),
  classLevel: z.enum(["SS1", "SS2", "SS3", "GRADUATE", "GAP_YEAR"]),
});

export const jambGoalsSchema = z.object({
  examYear: z.number().min(2025).max(2030),
  targetScore: z.number().min(100).max(400),
  preferredCourse: z.string().optional(),
  preferredUni: z.string().optional(),
  previousJambScore: z.number().min(0).max(400).optional(),
  subjects: z
    .array(z.string())
    .length(3, "Select exactly 3 subjects (English is automatic)"),
});

export const studyPreferencesSchema = z.object({
  studyHoursPerDay: z.number().min(0.5).max(12),
  preferredTimeSlot: z.enum([
    "EARLY_MORNING",
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
    "LATE_NIGHT",
  ]),
  learningStyle: z.enum(["VISUAL", "READING", "PRACTICE", "MIXED"]),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type JambGoalsInput = z.infer<typeof jambGoalsSchema>;
export type StudyPreferencesInput = z.infer<typeof studyPreferencesSchema>;