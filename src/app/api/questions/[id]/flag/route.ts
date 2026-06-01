import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const flagSchema = z.object({
  reason: z.enum(["WRONG_ANSWER", "UNCLEAR_QUESTION", "DUPLICATE", "OUTDATED", "TYPO", "OTHER"]),
  description: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = flagSchema.parse(body);

    // Check if already flagged by this user
    const existing = await db.flaggedQuestion.findFirst({
      where: { questionId: id, userId: session.user.id, status: { in: ["OPEN", "REVIEWING"] } },
    });

    if (existing) {
      return NextResponse.json({ error: "You've already flagged this question" }, { status: 409 });
    }

    const flag = await db.flaggedQuestion.create({
      data: {
        questionId: id,
        userId: session.user.id,
        reason: validated.reason as any,
        description: validated.description,
      },
    });

    return NextResponse.json(flag, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Flag error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}