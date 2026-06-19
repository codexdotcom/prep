import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JambSubject, TestMode } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, topicIds, questionCount } = await req.json();

    if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    if (!topicIds || topicIds.length === 0) return NextResponse.json({ error: "Select at least one topic" }, { status: 400 });

    const count = questionCount || 20;

    // Fetch questions for selected topics
    const questions = await db.question.findMany({
      where: {
        subject: subject as JambSubject,
        topicId: { in: topicIds },
        isActive: true,
      },
      select: {
        id: true,
        subject: true,
        topicId: true,
        body: true,
        imageUrl: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        difficulty: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions found for the selected topics. Try selecting different topics." }, { status: 400 });
    }

    // Shuffle and limit
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, count);

    // Get topic names for the response
    const topicDetails = await db.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, name: true },
    });
    const topicMap = Object.fromEntries(topicDetails.map((t) => [t.id, t.name]));

    // Create test session
    const testSession = await db.testSession.create({
      data: {
        user: { connect: { id: session.user.id } },
        mode: "TOPIC_DRILL" as TestMode,
        subject: subject as JambSubject,
        totalQuestions: shuffled.length,
        timeLimit: 0,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      sessionId: testSession.id,
      mode: "TOPIC_DRILL",
      totalTime: 0,
      adaptive: true,
      subject,
      topicIds,
      topicNames: topicMap,
      questions: shuffled.map((q, i) => ({
        id: q.id,
        index: i,
        subject: q.subject,
        topicId: q.topicId,
        body: q.body,
        imageUrl: q.imageUrl,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    console.error("Drill start error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}