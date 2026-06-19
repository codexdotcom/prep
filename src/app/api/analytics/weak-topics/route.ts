import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyForgettingCurve } from "@/lib/adaptive-engine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // Use StudentTopicAbility as primary source (much better than raw response aggregation)
    const abilities = await db.studentTopicAbility.findMany({
      where: { userId },
      include: { topic: { select: { id: true, name: true, subject: true } } },
    });

    if (abilities.length < 3) {
      // Fallback to raw responses if not enough ability data yet
      const responses = await db.questionResponse.findMany({
        where: { userId },
        include: { question: { select: { subject: true, topicId: true, topic: { select: { id: true, name: true } } } } },
      });

      if (responses.length < 5) return NextResponse.json({ weakTopics: [] });

      const stats: Record<string, { subject: string; topicId: string; topicName: string; total: number; correct: number }> = {};
      for (const r of responses) {
        const tid = r.question.topicId;
        if (!tid || !r.question.topic) continue;
        if (!stats[tid]) stats[tid] = { subject: r.question.subject, topicId: tid, topicName: r.question.topic.name, total: 0, correct: 0 };
        stats[tid].total++;
        if (r.isCorrect) stats[tid].correct++;
      }

      const weakTopics = Object.values(stats)
        .filter((t) => t.total >= 2)
        .map((t) => ({
          subject: t.subject,
          topicId: t.topicId,
          topicName: t.topicName,
          accuracy: Math.round((t.correct / t.total) * 100),
          ability: Math.round((t.correct / t.total) * 100),
          totalAttempted: t.total,
          totalCorrect: t.correct,
          confidence: Math.min(1, t.total * 0.1),
          questionsAvailable: 0,
          daysSinceLastPractice: 0,
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 15);

      for (const t of weakTopics) {
        t.questionsAvailable = await db.question.count({ where: { topicId: t.topicId, isActive: true } });
      }

      return NextResponse.json({ weakTopics });
    }

    // Use ability data with forgetting curve
    const now = Date.now();
    const weakTopics = abilities
      .map((a) => {
        const daysSince = a.lastPracticedAt
          ? (now - new Date(a.lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24)
          : 30;
        const currentAbility = daysSince > 1 ? applyForgettingCurve(a.ability, daysSince) : a.ability;

        return {
          subject: a.subject as string,
          topicId: a.topicId,
          topicName: a.topic.name,
          accuracy: a.totalAttempts > 0 ? Math.round((a.totalCorrect / a.totalAttempts) * 100) : 0,
          ability: Math.round(currentAbility),
          totalAttempted: a.totalAttempts,
          totalCorrect: a.totalCorrect,
          confidence: a.confidence,
          questionsAvailable: 0,
          daysSinceLastPractice: Math.round(daysSince),
          needsReview: a.nextReviewAt ? new Date(a.nextReviewAt) < new Date() : false,
        };
      })
      .filter((t) => t.ability < 65 && t.confidence >= 0.2)
      .sort((a, b) => a.ability - b.ability)
      .slice(0, 15);

    for (const t of weakTopics) {
      t.questionsAvailable = await db.question.count({ where: { topicId: t.topicId, isActive: true } });
    }

    return NextResponse.json({ weakTopics });
  } catch (error) {
    console.error("Weak topics error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}