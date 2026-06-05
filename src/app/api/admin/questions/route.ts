import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const questionSchema = z.object({
  subject: z.string().min(1),
  topicId: z.string().min(1),
  subtopicId: z.string().optional().nullable().transform((v) => v || undefined),
  year: z.number().optional().nullable(),
  questionNumber: z.number().optional().nullable(),
  body: z.string().min(5, "Question must be at least 5 characters"),
  imageUrl: z.string().optional().nullable().transform((v) => v || null),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctOption: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().optional().nullable().transform((v) => v || undefined),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");
    const year = searchParams.get("year");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (subject) where.subject = subject;
    if (topicId) where.topicId = topicId;
    if (difficulty) where.difficulty = difficulty;
    if (year) where.year = parseInt(year);
    if (search) {
      where.OR = [
        { body: { contains: search, mode: "insensitive" } },
        { optionA: { contains: search, mode: "insensitive" } },
        { optionB: { contains: search, mode: "insensitive" } },
        { optionC: { contains: search, mode: "insensitive" } },
        { optionD: { contains: search, mode: "insensitive" } },
      ];
    }

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        include: {
          topic: { select: { name: true } },
          subtopic: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.question.count({ where }),
    ]);

    return NextResponse.json({
      questions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List questions error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const cleaned = {
      ...body,
      subtopicId: body.subtopicId || undefined,
      imageUrl: body.imageUrl || null,
      explanation: body.explanation || undefined,
      year: body.year || null,
      questionNumber: body.questionNumber || null,
    };

    const validated = questionSchema.parse(cleaned);

    const question = await db.question.create({
      data: {
        subject: validated.subject as any,
        topicId: validated.topicId,
        subtopicId: validated.subtopicId,
        year: validated.year,
        questionNumber: validated.questionNumber,
        body: validated.body,
        imageUrl: validated.imageUrl,
        optionA: validated.optionA,
        optionB: validated.optionB,
        optionC: validated.optionC,
        optionD: validated.optionD,
        correctOption: validated.correctOption as any,
        explanation: validated.explanation,
        difficulty: validated.difficulty as any,
        isActive: validated.isActive,
      },
      include: { topic: { select: { name: true } } },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: "Invalid input", details: error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`) },
        { status: 400 }
      );
    }
    console.error("Create question error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}