import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyForgettingCurve, predictJambScore } from "@/lib/adaptive-engine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // Get all topic abilities
    const abilities = await db.studentTopicAbility.findMany({
      where: { userId },
      include: { topic: { select: { name: true, subject: true } } },
      orderBy: { ability: "asc" },
    });

    if (abilities.length === 0) {
      return NextResponse.json({ hasData: false, insights: [], predictedScore: 0 });
    }

    // Apply forgetting curve
    const now = Date.now();
    const adjustedAbilities = abilities.map((a) => {
      const daysSince = a.lastPracticedAt ? (now - new Date(a.lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
      return {
        ...a,
        currentAbility: daysSince > 1 ? applyForgettingCurve(a.ability, daysSince) : a.ability,
        daysSinceLastPractice: Math.round(daysSince),
        topicName: a.topic.name,
      };
    });

    // Per-subject average ability
    const subjectAbilities: Record<string, { total: number; count: number; topics: any[] }> = {};
    for (const a of adjustedAbilities) {
      const subj = a.subject;
      if (!subjectAbilities[subj]) subjectAbilities[subj] = { total: 0, count: 0, topics: [] };
      subjectAbilities[subj].total += a.currentAbility;
      subjectAbilities[subj].count++;
      subjectAbilities[subj].topics.push(a);
    }

    const subjectAverages: Record<string, number> = {};
    for (const [subj, data] of Object.entries(subjectAbilities)) {
      subjectAverages[subj] = data.count > 0 ? data.total / data.count : 50;
    }

    // Get user's JAMB subjects
    const profile = await db.studentProfile.findUnique({
      where: { userId },
      include: { jambSubjects: { orderBy: { priority: "asc" } } },
    });

    const jambSubjects = profile?.jambSubjects.map((s) => s.subject as string) || [];

    // Predict JAMB score
    const predictedScore = jambSubjects.length === 4 ? predictJambScore(subjectAverages, jambSubjects) : 0;

    // Generate insights
    const insights: any[] = [];

    // Weakest topics (high confidence, low ability)
    const weakTopics = adjustedAbilities
      .filter((a) => a.confidence >= 0.3 && a.currentAbility < 45)
      .slice(0, 5)
      .map((a) => ({
        type: "weakness",
        title: a.topicName,
        subject: a.subject,
        ability: Math.round(a.currentAbility),
        attempts: a.totalAttempts,
        accuracy: a.totalAttempts > 0 ? Math.round((a.totalCorrect / a.totalAttempts) * 100) : 0,
      }));

    if (weakTopics.length > 0) {
      insights.push({
        type: "weakness",
        title: `${weakTopics.length} topic${weakTopics.length > 1 ? "s" : ""} need${weakTopics.length === 1 ? "s" : ""} attention`,
        body: `Your weakest topic is ${weakTopics[0].title} at ${weakTopics[0].ability}% mastery. Drilling this could add 10-15 points to your score.`,
        topics: weakTopics,
      });
    }

    // Strongest topics
    const strongTopics = adjustedAbilities
      .filter((a) => a.confidence >= 0.4 && a.currentAbility >= 75)
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 5)
      .map((a) => ({
        type: "strength",
        title: a.topicName,
        subject: a.subject,
        ability: Math.round(a.currentAbility),
      }));

    if (strongTopics.length > 0) {
      insights.push({
        type: "strength",
        title: `${strongTopics.length} topic${strongTopics.length > 1 ? "s" : ""} mastered`,
        body: `You're strong in ${strongTopics[0].title} (${strongTopics[0].ability}%). Keep reviewing to maintain mastery.`,
        topics: strongTopics,
      });
    }

    // Topics due for review
    const overdueTopics = adjustedAbilities
      .filter((a) => a.nextReviewAt && new Date(a.nextReviewAt) < new Date())
      .map((a) => ({ topicName: a.topicName, subject: a.subject, ability: Math.round(a.currentAbility), topicId: a.topicId }));

    if (overdueTopics.length > 0) {
      insights.push({
        type: "review",
        title: `${overdueTopics.length} topic${overdueTopics.length > 1 ? "s" : ""} due for review`,
        body: "These topics are at risk of being forgotten. A quick drill would lock them in.",
        topics: overdueTopics,
      });
    }

    // Fading topics (haven't practiced in 7+ days, were previously strong)
    const fadingTopics = adjustedAbilities
      .filter((a) => a.daysSinceLastPractice >= 7 && a.ability > 60 && a.currentAbility < a.ability * 0.85)
      .map((a) => ({
        topicName: a.topicName,
        subject: a.subject,
        wasAbility: Math.round(a.ability),
        currentAbility: Math.round(a.currentAbility),
        daysSince: a.daysSinceLastPractice,
      }));

    if (fadingTopics.length > 0) {
      insights.push({
        type: "fading",
        title: `${fadingTopics.length} topic${fadingTopics.length > 1 ? "s" : ""} fading from memory`,
        body: `You were strong in ${fadingTopics[0].topicName} (${fadingTopics[0].wasAbility}%) but haven't practiced in ${fadingTopics[0].daysSince} days. Current estimate: ${fadingTopics[0].currentAbility}%.`,
        topics: fadingTopics,
      });
    }

    // Subject-level summary
    const subjectSummary = Object.entries(subjectAverages).map(([subject, avg]) => ({
      subject,
      ability: Math.round(avg),
      topicCount: subjectAbilities[subject].count,
      weakCount: subjectAbilities[subject].topics.filter((t: any) => t.currentAbility < 45).length,
      strongCount: subjectAbilities[subject].topics.filter((t: any) => t.currentAbility >= 75).length,
    })).sort((a, b) => a.ability - b.ability);

    // Recent test sessions
    const recentSessions = await db.testSession.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: { id: true, mode: true, score: true, totalCorrect: true, totalQuestions: true, completedAt: true, subject: true },
    });

    // Score trend (last 10 mock exams)
    const mockTrend = await db.testSession.findMany({
      where: { userId, mode: "MOCK_EXAM", status: "COMPLETED" },
      orderBy: { completedAt: "asc" },
      take: 10,
      select: { score: true, completedAt: true },
    });

    return NextResponse.json({
      hasData: true,
      predictedScore,
      insights,
      subjectSummary,
      recentSessions: recentSessions.map((s) => ({
        ...s,
        accuracy: s.totalQuestions > 0 ? Math.round(((s.totalCorrect || 0) / s.totalQuestions) * 100) : 0,
      })),
      mockTrend: mockTrend.map((m) => ({ score: m.score, date: m.completedAt })),
      totalTopicsTracked: abilities.length,
      topicsNeedingWork: adjustedAbilities.filter((a) => a.currentAbility < 45 && a.confidence >= 0.3).length,
      topicsMastered: adjustedAbilities.filter((a) => a.currentAbility >= 75 && a.confidence >= 0.4).length,
      topicsDueReview: overdueTopics.length,
    });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}