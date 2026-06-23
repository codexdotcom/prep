
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { JambSubject, Difficulty } from "@prisma/client";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { date, subject, topicId, title, description, questionIds, difficulty, timeLimit, xpReward, bonusXP } = body;

    const existing = await db.dailyChallenge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // If date changed, check for conflicts
    if (date && new Date(date).toDateString() !== existing.date.toDateString()) {
      const conflict = await db.dailyChallenge.findUnique({ where: { date: new Date(date) } });
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: "A challenge already exists for this date" }, { status: 409 });
      }
    }

    const updated = await db.dailyChallenge.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(subject && { subject: subject as JambSubject }),
        ...(topicId !== undefined && { topicId: topicId || null }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(questionIds && { questionIds }),
        ...(difficulty && { difficulty: difficulty as Difficulty }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(xpReward !== undefined && { xpReward }),
        ...(bonusXP !== undefined && { bonusXP }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin challenges PUT error:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Delete attempts first
    await db.dailyChallengeAttempt.deleteMany({ where: { challengeId: id } });
    await db.dailyChallenge.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin challenges DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 });
  }
}