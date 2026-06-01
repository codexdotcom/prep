import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: { jambSubjects: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    // Get recent responses grouped by topic
    const responses = await db.questionResponse.findMany({
      where: {
        userId,
        session: { status: "COMPLETED" },
      },
      include: {
        question: {
          include: { topic: true },
        },
      },
      orderBy: { answeredAt: "desc" },
      take: 500,
    });

    if (responses.length === 0) {
      return NextResponse.json({
        recommendations: [
          {
            type: "action",
            priority: "high",
            title: "Take your first diagnostic test",
            description:
              "We need to see you in action before we can build your personalized plan. Start with a 40-question practice test.",
            action: "/practice",
            actionLabel: "Start Test",
          },
        ],
      });
    }

    const recommendations: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      action?: string;
      actionLabel?: string;
      subject?: string;
      topicId?: string;
    }> = [];

    // Find weak topics (below 50% accuracy with at least 3 attempts)
   const topicMap = new Map<string, {
  id: string;
  name: string;
  subject: string;
  correct: number;
  total: number;
  avgTime: number;
}>();

    for (const r of responses) {
      const tid = r.question.topicId;
      if (!topicMap.has(tid)) {
        topicMap.set(tid, {
          id: tid,
          name: r.question.topic.name,
          subject: r.question.topic.subject,
          correct: 0,
          total: 0,
          avgTime: 0,
        });
      }
      const t = topicMap.get(tid)!;
      t.total++;
      if (r.isCorrect) t.correct++;
      t.avgTime = (t.avgTime * (t.total - 1) + r.timeSpent) / t.total;
    }

    const weakTopics = Array.from(topicMap.values())
      .filter((t) => t.total >= 3 && t.correct / t.total < 0.5)
      .sort((a, b) => a.correct / a.total - b.correct / b.total);

    for (const topic of weakTopics.slice(0, 3)) {
      const accuracy = Math.round((topic.correct / topic.total) * 100);
      recommendations.push({
        type: "weak_topic",
        priority: accuracy < 30 ? "critical" : "high",
        title: `Drill: ${topic.name}`,
        description: `You're scoring ${accuracy}% on ${topic.name} (${topic.subject.replace(/_/g, " ")}). Focus here before your next mock exam.`,
        action: `/practice?mode=TOPIC_DRILL&topic=${topic.id}`,
        actionLabel: "Practice Now",
        subject: topic.subject,
        topicId: topic.id,
      });
    }

    // Speed recommendations
    const avgTime =
      responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length;
    const idealTime = 72000;

    if (avgTime > idealTime * 1.3) {
      recommendations.push({
        type: "speed",
        priority: "medium",
        title: "You're spending too long per question",
        description: `Your average is ${Math.round(avgTime / 1000)}s per question. Aim for about 72 seconds. Try timed practice sessions to build speed.`,
        action: "/practice?mode=TIMED",
        actionLabel: "Timed Practice",
      });
    } else if (avgTime < idealTime * 0.5) {
      recommendations.push({
        type: "speed",
        priority: "medium",
        title: "You might be rushing",
        description: `Average ${Math.round(avgTime / 1000)}s per question is quite fast. Take a beat to double-check before moving on — it might reduce careless errors.`,
      });
    }

    // Careless error detection
    const carelessErrors = responses.filter(
      (r) =>
        !r.isCorrect &&
        r.selectedOption !== null &&
        r.timeSpent < 15000 &&
        r.question.difficulty === "EASY"
    );

    if (carelessErrors.length > responses.length * 0.1) {
      recommendations.push({
        type: "accuracy",
        priority: "high",
        title: "Watch out for careless mistakes",
        description: `About ${Math.round((carelessErrors.length / responses.length) * 100)}% of your wrong answers are careless errors on easy questions. Slowing down by even 10 seconds could recover these marks.`,
      });
    }

    // Score gap analysis
    const targetScore = profile.targetScore || 250;
    const recentSessions = await db.testSession.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
    });

    const avgRecentScore =
      recentSessions.length > 0
        ? Math.round(
            recentSessions.reduce((s, t) => s + (t.score || 0), 0) /
              recentSessions.length
          )
        : 0;

    if (avgRecentScore > 0 && avgRecentScore < targetScore) {
      const gap = targetScore - avgRecentScore;
      recommendations.push({
        type: "score_gap",
        priority: gap > 80 ? "critical" : gap > 40 ? "high" : "medium",
        title: `${gap} points to your target of ${targetScore}`,
        description:
          gap > 80
            ? `You're averaging ${avgRecentScore}. Focus on weak topics first — each topic you improve from 30% to 70% can gain you 15-20 points.`
            : gap > 40
            ? `You're at ${avgRecentScore}, closing in. Consistent daily practice on weak areas will close this gap in weeks.`
            : `You're averaging ${avgRecentScore} — almost there. Polish your weak topics and reduce careless errors.`,
        action: "/practice?mode=WEAK_TOPIC",
        actionLabel: "Target Weak Areas",
      });
    }

    // Mock exam recommendation
    const mockCount = recentSessions.filter(
      (s) => s.mode === "MOCK_EXAM"
    ).length;
    if (mockCount < 2) {
      recommendations.push({
        type: "action",
        priority: "medium",
        title: "Take a full mock exam",
        description:
          "Mock exams are the closest thing to the real JAMB. They help with timing, endurance, and score prediction accuracy.",
        action: "/practice?mode=MOCK_EXAM",
        actionLabel: "Start Mock",
      });
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    recommendations.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}