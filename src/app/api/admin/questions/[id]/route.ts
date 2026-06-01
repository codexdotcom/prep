import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const question = await db.question.findUnique({
      where: { id },
      include: { topic: true, subtopic: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Get question error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(
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

    const data: any = { updatedAt: new Date() };

    if (body.subject !== undefined) data.subject = body.subject;
    if (body.topicId !== undefined) data.topicId = body.topicId;
    if (body.body !== undefined) data.body = body.body;
    if (body.optionA !== undefined) data.optionA = body.optionA;
    if (body.optionB !== undefined) data.optionB = body.optionB;
    if (body.optionC !== undefined) data.optionC = body.optionC;
    if (body.optionD !== undefined) data.optionD = body.optionD;
    if (body.correctOption !== undefined) data.correctOption = body.correctOption;
    if (body.difficulty !== undefined) data.difficulty = body.difficulty;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    data.subtopicId = body.subtopicId || null;
    data.imageUrl = body.imageUrl || null;
    data.explanation = body.explanation || null;
    data.year = body.year || null;
    data.questionNumber = body.questionNumber || null;

    const question = await db.question.update({
      where: { id },
      data,
      include: { topic: { select: { name: true } } },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete related records first to avoid FK violations
    await db.questionResponse.deleteMany({ where: { questionId: id } });
    await db.flaggedQuestion.deleteMany({ where: { questionId: id } });

    await db.question.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error("Delete question error:", error);

    // If there's still a FK issue, give a clear message
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "This question has related data that couldn't be removed. Try deactivating it instead." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}