import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const startTestSchema = z.object({
  mode: z.enum(["PRACTICE", "TIMED", "MOCK_EXAM", "TOPIC_DRILL", "WEAK_TOPIC", "DIAGNOSTIC"]),
  subject: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  questionCount: z.number().min(5).max(180).default(40),
  timeLimit: z.number().min(60).max(7200).optional(),
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = startTestSchema.parse(body);

    // Determine time limit based on mode
    let timeLimit = validated.timeLimit ?? 0;
    if (validated.mode === "MOCK_EXAM") {
      timeLimit = 7200;
    } else if (validated.mode === "TIMED" && !validated.timeLimit) {
      timeLimit = validated.questionCount * 60;
    }

    // Build question query
    const whereClause: any = { isActive: true };

    if (validated.mode === "TOPIC_DRILL" && validated.topicId) {
      whereClause.topicId = validated.topicId;
    } else if (validated.mode === "MOCK_EXAM" && validated.subjects) {
      whereClause.subject = { in: validated.subjects };
    } else if (validated.subject) {
      whereClause.subject = validated.subject;
    }

    // Fetch questions with stratified sampling by difficulty
    const totalNeeded = validated.questionCount;
    const easyCount = Math.round(totalNeeded * 0.3);
    const mediumCount = Math.round(totalNeeded * 0.5);
    const hardCount = totalNeeded - easyCount - mediumCount;

    const [easyQs, mediumQs, hardQs]: { id: string }[][] = await Promise.all([
      db.question.findMany({
        where: { ...whereClause, difficulty: "EASY" },
        select: { id: true },
        take: easyCount * 3,
      }),
      db.question.findMany({
        where: { ...whereClause, difficulty: "MEDIUM" },
        select: { id: true },
        take: mediumCount * 3,
      }),
      db.question.findMany({
        where: { ...whereClause, difficulty: "HARD" },
        select: { id: true },
        take: hardCount * 3,
      }),
    ]);

    const selectedIds = [
      ...shuffle(easyQs).slice(0, easyCount),
      ...shuffle(mediumQs).slice(0, mediumCount),
      ...shuffle(hardQs).slice(0, hardCount),
    ].map((q) => q.id);

    const finalIds = shuffle(selectedIds);

    if (finalIds.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this configuration" },
        { status: 404 }
      );
    }

    // Fetch full question data
    const questions = await db.question.findMany({
      where: { id: { in: finalIds } },
      select: {
        id: true,
        body: true,
        imageUrl: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        subject: true,
        difficulty: true,
        topic: { select: { id: true, name: true } },
      },
    });

    // Sort by the shuffled order
    const orderMap = new Map(finalIds.map((id, i) => [id, i]));
    questions.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    // Create test session
    const testSession = await db.testSession.create({
      data: {
        userId: session.user.id,
        mode: validated.mode,
        subject: validated.subject as any,
        subjects: (validated.subjects as any) || [],
        totalQuestions: finalIds.length,
        timeLimit,
        difficultyProfile: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
        },
      },
    });

    return NextResponse.json({
      sessionId: testSession.id,
      questions,
      timeLimit,
      totalQuestions: finalIds.length,
      mode: validated.mode,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Start test error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}