import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAIResponse } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetScore } = await req.json();
    const userId = session.user.id;

    // Get current performance data
    const [profile, responses, xp, streak] = await Promise.all([
      db.studentProfile.findUnique({
        where: { userId },
        include: { jambSubjects: true },
      }),
      db.questionResponse.findMany({
        where: { userId, session: { status: "COMPLETED" } },
        include: { question: { select: { subject: true, topicId: true, difficulty: true } } },
      }),
      db.userXP.findUnique({ where: { userId } }),
      db.studyStreak.findUnique({ where: { userId } }),
    ]);

    const subjects = profile?.jambSubjects.map((s) => s.subject) || [];

    // Per-subject breakdown
    const subjectStats: Record<string, { correct: number; total: number; topics: Record<string, { correct: number; total: number }> }> = {};
    for (const r of responses) {
      const subj = r.question.subject;
      if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, total: 0, topics: {} };
      subjectStats[subj].total++;
      if (r.isCorrect) subjectStats[subj].correct++;

      const tid = r.question.topicId;
      if (!subjectStats[subj].topics[tid]) subjectStats[subj].topics[tid] = { correct: 0, total: 0 };
      subjectStats[subj].topics[tid].total++;
      if (r.isCorrect) subjectStats[subj].topics[tid].correct++;
    }

    // Calculate current predicted
    let currentPredicted = 0;
    const subjectBreakdown: Array<{ subject: string; accuracy: number; score: number; gap: number; weakTopics: string[] }> = [];

    for (const subj of subjects) {
      const stat = subjectStats[subj];
      const accuracy = stat && stat.total >= 5 ? Math.round((stat.correct / stat.total) * 100) : 50;
      const score = Math.round((accuracy / 100) * 100);
      currentPredicted += score;

      // Find weak topics
      const weakTopics: string[] = [];
      if (stat) {
        for (const [topicId, ts] of Object.entries(stat.topics)) {
          if (ts.total >= 3 && (ts.correct / ts.total) < 0.5) {
            const topic = await db.topic.findUnique({ where: { id: topicId }, select: { name: true } });
            if (topic) weakTopics.push(topic.name);
          }
        }
      }

      const targetPerSubject = Math.round(targetScore / subjects.length);
      subjectBreakdown.push({
        subject: subj,
        accuracy,
        score,
        gap: Math.max(0, targetPerSubject - score),
        weakTopics,
      });
    }

    const gap = Math.max(0, targetScore - currentPredicted);
    const studyHours = profile?.studyHoursPerDay || 3;

    // Estimate weeks needed
    const pointsPerWeek = Math.round(studyHours * 2.5); // rough estimate
    const weeksNeeded = gap > 0 ? Math.ceil(gap / pointsPerWeek) : 0;

    // Generate weekly milestones
    const milestones: Array<{ week: number; expectedScore: number; focus: string; tasks: string[] }> = [];
    const sortedSubjects = [...subjectBreakdown].sort((a, b) => b.gap - a.gap);

    for (let w = 1; w <= Math.min(weeksNeeded, 12); w++) {
      const progress = Math.round((w / weeksNeeded) * gap);
      const focusSubject = sortedSubjects[(w - 1) % sortedSubjects.length];

      milestones.push({
        week: w,
        expectedScore: currentPredicted + progress,
        focus: focusSubject.subject,
        tasks: [
          `Focus on ${focusSubject.subject.replace(/_/g, " ")}: ${focusSubject.weakTopics.slice(0, 2).join(", ") || "general review"}`,
          `Complete ${Math.round(studyHours * 7)} practice questions`,
          `Take 1 full mock exam`,
          w % 2 === 0 ? "Review all mistakes from past 2 weeks" : "Drill speed on timed questions",
        ],
      });
    }

    return NextResponse.json({
      currentScore: currentPredicted,
      targetScore,
      gap,
      weeksNeeded,
      studyHoursPerDay: studyHours,
      subjectBreakdown,
      milestones,
      totalQuestionsPracticed: responses.length,
      level: xp?.level || 1,
      streak: streak?.currentStreak || 0,
    });
  } catch (error) {
    console.error("Trajectory error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}