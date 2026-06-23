import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { JambSubject, Difficulty } from "@prisma/client";

export async function GET() {
  try {
    const challenges = await db.dailyChallenge.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: {
        topic: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json(
      challenges.map((c) => ({
        id: c.id,
        date: c.date,
        subject: c.subject,
        topicId: c.topicId,
        topicName: c.topic?.name || null,
        title: c.title,
        description: c.description,
        questionCount: c.questionIds.length,
        questionIds: c.questionIds,
        difficulty: c.difficulty,
        timeLimit: c.timeLimit,
        xpReward: c.xpReward,
        bonusXP: c.bonusXP,
        attempts: c._count.attempts,
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    console.error("Admin challenges GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, subject, topicId, title, description, questionIds, difficulty, timeLimit, xpReward, bonusXP } = body;

    if (!date || !subject || !title || !questionIds?.length) {
      return NextResponse.json({ error: "Date, subject, title, and at least one question are required" }, { status: 400 });
    }

    const existing = await db.dailyChallenge.findUnique({ where: { date: new Date(date) } });
    if (existing) return NextResponse.json({ error: "A challenge already exists for this date" }, { status: 409 });

    const challenge = await db.dailyChallenge.create({
      data: {
        date: new Date(date),
        subject: subject as JambSubject,
        topicId: topicId || null,
        title,
        description: description || "",
        questionIds,
        difficulty: (difficulty || "MEDIUM") as Difficulty,
        timeLimit: timeLimit || 300,
        xpReward: xpReward || 50,
        bonusXP: bonusXP || 25,
      },
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Admin challenges POST error:", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}