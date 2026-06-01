import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET — list topics
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");

    const where: any = {};
    if (subject) where.subject = subject;

    const topics = await db.topic.findMany({
      where,
      include: {
        subtopics: { orderBy: { sortOrder: "asc" } },
        _count: { select: { questions: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Topics error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — create topic
const createTopicSchema = z.object({
  subject: z.string().min(1),
  name: z.string().min(2, "Topic name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  weight: z.number().optional().default(1.0),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTopicSchema.parse(body);

    // Generate slug from name
    const slug = `${validated.subject.toLowerCase()}-${validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;

    // Check if slug already exists
    const existing = await db.topic.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A topic with this name already exists for this subject" }, { status: 409 });
    }

    // Get next sort order
    const lastTopic = await db.topic.findFirst({
      where: { subject: validated.subject as any },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const topic = await db.topic.create({
      data: {
        subject: validated.subject as any,
        name: validated.name,
        slug,
        description: validated.description || undefined,
        weight: validated.weight,
        sortOrder: (lastTopic?.sortOrder || 0) + 1,
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Create topic error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}