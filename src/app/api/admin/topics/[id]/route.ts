import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT — update topic
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

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.weight !== undefined) data.weight = body.weight;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

    const topic = await db.topic.update({
      where: { id },
      data,
      include: { _count: { select: { questions: true } } },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Update topic error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE — delete topic (only if no questions)
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

    const questionCount = await db.question.count({ where: { topicId: id } });
    if (questionCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${questionCount} question${questionCount > 1 ? "s" : ""} belong to this topic. Move or delete them first.` },
        { status: 409 }
      );
    }

    await db.topic.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete topic error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}