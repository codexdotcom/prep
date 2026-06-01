import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface TopicStat {
  topicId: string;
  topicName: string;
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  avgTimeMs: number;
  carelessErrors: number;
  difficulty: { easy: number; medium: number; hard: number };
}

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  avgTimeMs: number;
  predictedScore: number;
  weakTopics: string[];
  strongTopics: string[];
}

type DifficultyKey = "easy" | "medium" | "hard";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all completed test sessions
    const sessions = await db.testSession.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 50,
    });

    if (sessions.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: "Complete at least one test to see your analytics",
      });
    }

    // Get all responses with question data
    const responses = await db.questionResponse.findMany({
      where: {
        userId,
        session: { status: "COMPLETED" },
      },
      include: {
        question: {
          include: {
            topic: { select: { id: true, name: true, subject: true } },
          },
        },
      },
      orderBy: { answeredAt: "desc" },
    });

    // Build topic stats
    const topicMap = new Map<string, TopicStat>();

    for (const r of responses) {
      const tid = r.question.topicId;
      if (!topicMap.has(tid)) {
        topicMap.set(tid, {
          topicId: tid,
          topicName: r.question.topic.name,
          subject: r.question.topic.subject,
          correct: 0,
          total: 0,
          accuracy: 0,
          avgTimeMs: 0,
          carelessErrors: 0,
          difficulty: { easy: 0, medium: 0, hard: 0 },
        });
      }

      const stat = topicMap.get(tid)!;
      stat.total++;
      if (r.isCorrect) stat.correct++;

      // Detect careless errors: answered quickly + wrong + easy question
      if (
        !r.isCorrect &&
        r.selectedOption !== null &&
        r.timeSpent < 20000 &&
        r.question.difficulty === "EASY"
      ) {
        stat.carelessErrors++;
      }

      stat.avgTimeMs =
        (stat.avgTimeMs * (stat.total - 1) + r.timeSpent) / stat.total;

      const diff = r.question.difficulty.toLowerCase() as DifficultyKey;
      stat.difficulty[diff]++;
    }

    // Calculate accuracy for each topic
    for (const stat of topicMap.values()) {
      stat.accuracy =
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    }

    const topicStats = Array.from(topicMap.values());

    // Build subject stats
    const subjectMap = new Map<string, SubjectStat>();

    for (const stat of topicStats) {
      if (!subjectMap.has(stat.subject)) {
        subjectMap.set(stat.subject, {
          subject: stat.subject,
          correct: 0,
          total: 0,
          accuracy: 0,
          avgTimeMs: 0,
          predictedScore: 0,
          weakTopics: [],
          strongTopics: [],
        });
      }

      const subj = subjectMap.get(stat.subject)!;
      subj.correct += stat.correct;
      subj.total += stat.total;

      if (stat.accuracy < 50) subj.weakTopics.push(stat.topicName);
      if (stat.accuracy >= 80) subj.strongTopics.push(stat.topicName);
    }

    for (const subj of subjectMap.values()) {
      subj.accuracy =
        subj.total > 0 ? Math.round((subj.correct / subj.total) * 100) : 0;
      subj.predictedScore = Math.round(subj.accuracy);
    }

    const subjectStats = Array.from(subjectMap.values());

    // Overall predicted JAMB score (out of 400)
    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: {
        jambSubjects: true,
      },
    });

    const selectedSubjects = profile?.jambSubjects.map((s) => s.subject) || [];
    let predictedTotal = 0;
    let subjectsScored = 0;

    for (const subj of subjectStats) {
      if (
        selectedSubjects.includes(subj.subject as (typeof selectedSubjects)[number]) ||
        selectedSubjects.length === 0
      ) {
        predictedTotal += subj.predictedScore;
        subjectsScored++;
      }
    }

    const predictedJambScore =
      subjectsScored > 0
        ? Math.round((predictedTotal / subjectsScored) * 4)
        : 0;

    // Speed analysis
    const allTimes = responses
      .filter((r) => r.selectedOption !== null)
      .map((r) => r.timeSpent);
    const avgTimePerQuestion =
      allTimes.length > 0
        ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
        : 0;

    const idealTimeMs = 72000;
    const speedRating =
      avgTimePerQuestion < idealTimeMs * 0.7
        ? "too_fast"
        : avgTimePerQuestion > idealTimeMs * 1.3
        ? "too_slow"
        : "optimal";

    // Careless error rate
    const totalCareless = topicStats.reduce(
      (sum, t) => sum + t.carelessErrors,
      0
    );
    const carelessRate =
      responses.length > 0
        ? Math.round((totalCareless / responses.length) * 100)
        : 0;

    // Score trend (last 10 sessions)
    const recentSessions = sessions.slice(0, 10).reverse();
    const scoreTrend = recentSessions.map((s) => ({
      date: s.completedAt?.toISOString() || s.createdAt.toISOString(),
      score: s.score || 0,
      mode: s.mode,
    }));

    // Risk level
    let riskLevel: "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" = "HIGH";
    if (predictedJambScore >= 300) riskLevel = "VERY_LOW";
    else if (predictedJambScore >= 250) riskLevel = "LOW";
    else if (predictedJambScore >= 200) riskLevel = "MEDIUM";

    // Update profile with risk level
    if (profile) {
      await db.studentProfile.update({
        where: { userId },
        data: {
          riskLevel,
          diagnosticCompletedAt: profile.diagnosticCompletedAt || new Date(),
        },
      });
    }

    // Difficulty performance
    const difficultyBreakdown: Record<DifficultyKey, { correct: number; total: number; accuracy: number }> = {
      easy: { correct: 0, total: 0, accuracy: 0 },
      medium: { correct: 0, total: 0, accuracy: 0 },
      hard: { correct: 0, total: 0, accuracy: 0 },
    };

    for (const r of responses) {
      const diff = r.question.difficulty.toLowerCase() as DifficultyKey;
      difficultyBreakdown[diff].total++;
      if (r.isCorrect) difficultyBreakdown[diff].correct++;
    }

    const difficultyKeys: DifficultyKey[] = ["easy", "medium", "hard"];
    for (const key of difficultyKeys) {
      const d = difficultyBreakdown[key];
      d.accuracy = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
    }

    // Time of day performance
    const hourBuckets: Record<string, { correct: number; total: number }> = {};
    for (const r of responses) {
      const hour = new Date(r.answeredAt).getHours();
      const bucket =
        hour < 8
          ? "early_morning"
          : hour < 12
          ? "morning"
          : hour < 16
          ? "afternoon"
          : hour < 20
          ? "evening"
          : "night";

      if (!hourBuckets[bucket]) hourBuckets[bucket] = { correct: 0, total: 0 };
      hourBuckets[bucket].total++;
      if (r.isCorrect) hourBuckets[bucket].correct++;
    }

    const sortedBuckets = Object.entries(hourBuckets).sort((a, b) => {
      const aRate = a[1].total > 0 ? a[1].correct / a[1].total : 0;
      const bRate = b[1].total > 0 ? b[1].correct / b[1].total : 0;
      return bRate - aRate;
    });

    const bestStudyTime = sortedBuckets.length > 0 ? sortedBuckets[0][0] : null;

    return NextResponse.json({
      hasData: true,
      overview: {
        predictedJambScore,
        riskLevel,
        totalQuestionsAttempted: responses.length,
        totalTestsTaken: sessions.length,
        overallAccuracy:
          responses.length > 0
            ? Math.round(
                (responses.filter((r) => r.isCorrect).length /
                  responses.length) *
                  100
              )
            : 0,
        avgTimePerQuestion,
        speedRating,
        carelessErrorRate: carelessRate,
        bestStudyTime,
        targetScore: profile?.targetScore || 250,
      },
      subjectStats,
      topicStats: topicStats.sort((a, b) => a.accuracy - b.accuracy),
      scoreTrend,
      difficultyBreakdown,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}