import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CorrectOption, JambSubject } from "@prisma/client";
import { updateTopicAbility, type TopicAbilityState } from "@/lib/adaptive-engine";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, answers } = await req.json();
    const userId = session.user.id;

    const testSession = await db.testSession.findUnique({
      where: { id: sessionId },
    });
    if (!testSession || testSession.userId !== userId)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const questionIds = Object.keys(answers);
    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { select: { id: true, name: true } } },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // ─── Phase 1: Process answers in memory (no DB calls) ───
    let totalCorrect = 0;
    let totalAnswered = 0;
    const subjectScores: Record<string, { correct: number; total: number; answered: number }> = {};
    const topicUpdates: Record<string, {
      topicId: string; topicName: string; subject: string;
      responses: Array<{ correct: boolean; difficulty: string; timeMs: number }>;
    }> = {};
    const responseData: Array<{
      sessionId: string; questionId: string; userId: string;
      selectedOption: CorrectOption | null; isCorrect: boolean; timeSpent: number;
    }> = [];

    const difficultyProfile = { easy: 0, medium: 0, hard: 0, easyCorrect: 0, mediumCorrect: 0, hardCorrect: 0 };

    for (const [qId, answer] of Object.entries(answers as Record<string, { selected: string | null; timeSpent: number }>)) {
      const q = questionMap.get(qId);
      if (!q) continue;

      const subj = q.subject as string;
      if (!subjectScores[subj]) subjectScores[subj] = { correct: 0, total: 0, answered: 0 };
      subjectScores[subj].total++;

      const isCorrect = answer.selected === q.correctOption;
      if (answer.selected) {
        totalAnswered++;
        subjectScores[subj].answered++;
        if (isCorrect) { totalCorrect++; subjectScores[subj].correct++; }
      }

      // Difficulty profile
      const d = (q.difficulty as string).toLowerCase() as "easy" | "medium" | "hard";
      if (d in difficultyProfile) difficultyProfile[d]++;
      if (isCorrect) {
        const key = `${d}Correct` as keyof typeof difficultyProfile;
        if (key in difficultyProfile) (difficultyProfile as any)[key]++;
      }

      // Topic accumulation
      if (q.topicId && q.topic && answer.selected) {
        if (!topicUpdates[q.topicId]) {
          topicUpdates[q.topicId] = { topicId: q.topicId, topicName: q.topic.name, subject: subj, responses: [] };
        }
        topicUpdates[q.topicId].responses.push({
          correct: isCorrect, difficulty: q.difficulty as string, timeMs: (answer.timeSpent || 0) * 1000,
        });
      }

      responseData.push({
        sessionId, questionId: qId, userId,
        selectedOption: (answer.selected || null) as CorrectOption | null,
        isCorrect, timeSpent: answer.timeSpent || 0,
      });
    }

    // ─── Phase 2: Batch write responses (chunks of 30 in parallel) ───
    const BATCH_SIZE = 30;
    for (let i = 0; i < responseData.length; i += BATCH_SIZE) {
      const batch = responseData.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((r) =>
          db.questionResponse.upsert({
            where: { sessionId_questionId: { sessionId: r.sessionId, questionId: r.questionId } },
            create: {
              session: { connect: { id: r.sessionId } },
              question: { connect: { id: r.questionId } },
              userId: r.userId,
              selectedOption: r.selectedOption,
              isCorrect: r.isCorrect,
              timeSpent: r.timeSpent,
            },
            update: {
              selectedOption: r.selectedOption,
              isCorrect: r.isCorrect,
              timeSpent: r.timeSpent,
            },
          })
        )
      );
    }

    // ─── Phase 3: Batch ability updates ───
    const topicEntries = Object.entries(topicUpdates);
    const existingAbilities = topicEntries.length > 0
      ? await db.studentTopicAbility.findMany({
          where: { userId, topicId: { in: topicEntries.map(([id]) => id) } },
        })
      : [];
    const abilityMap = new Map(existingAbilities.map((a) => [a.topicId, a]));

    const topicInsights: Array<{
      topicId: string; topicName: string; subject: string;
      before: number; after: number; correct: number; total: number;
      mastered: boolean; needsWork: boolean;
    }> = [];

    const abilityUpserts: Promise<any>[] = [];

    for (const [topicId, data] of topicEntries) {
      const existing = abilityMap.get(topicId);

      let currentState: TopicAbilityState = existing
        ? {
            topicId, subject: existing.subject, ability: existing.ability,
            confidence: existing.confidence, totalAttempts: existing.totalAttempts,
            totalCorrect: existing.totalCorrect, recentResults: existing.recentResults,
            avgTimeMs: existing.avgTimeMs, currentStreak: existing.currentStreak,
            lastPracticedAt: existing.lastPracticedAt, intervalDays: existing.intervalDays,
            easeFactor: existing.easeFactor, nextReviewAt: existing.nextReviewAt,
          }
        : {
            topicId, subject: data.subject, ability: 50, confidence: 0,
            totalAttempts: 0, totalCorrect: 0, recentResults: [], avgTimeMs: null,
            currentStreak: 0, lastPracticedAt: null, intervalDays: 1,
            easeFactor: 2.5, nextReviewAt: null,
          };

      const beforeAbility = currentState.ability;

      for (const resp of data.responses) {
        currentState = updateTopicAbility(currentState, resp.correct, resp.difficulty, resp.timeMs);
      }

      const topicCorrect = data.responses.filter((r) => r.correct).length;
      const topicTotal = data.responses.length;

      topicInsights.push({
        topicId, topicName: data.topicName, subject: data.subject,
        before: Math.round(beforeAbility), after: Math.round(currentState.ability),
        correct: topicCorrect, total: topicTotal,
        mastered: currentState.ability >= 75 && currentState.confidence >= 0.4,
        needsWork: currentState.ability < 45 && currentState.totalAttempts >= 3,
      });

      const upsertData = {
        ability: currentState.ability, confidence: currentState.confidence,
        totalAttempts: currentState.totalAttempts, totalCorrect: currentState.totalCorrect,
        recentResults: currentState.recentResults, avgTimeMs: currentState.avgTimeMs,
        currentStreak: currentState.currentStreak, lastPracticedAt: currentState.lastPracticedAt,
        intervalDays: currentState.intervalDays, easeFactor: currentState.easeFactor,
        nextReviewAt: currentState.nextReviewAt,
      };

      abilityUpserts.push(
        db.studentTopicAbility.upsert({
          where: { userId_topicId: { userId, topicId } },
          create: {
            user: { connect: { id: userId } },
            topic: { connect: { id: topicId } },
            subject: data.subject as JambSubject,
            ...upsertData,
          },
          update: upsertData,
        })
      );
    }

    // Run all ability upserts in parallel + session update
    const score = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 400) : 0;

    await Promise.all([
      ...abilityUpserts,
      db.testSession.update({
        where: { id: sessionId },
        data: {
          score, totalCorrect,
          totalWrong: totalAnswered - totalCorrect,
          totalSkipped: questions.length - totalAnswered,
          completedAt: new Date(), status: "COMPLETED",
          difficultyProfile,
          topicAccuracy: Object.fromEntries(
            topicInsights.map((t) => [t.topicId, { correct: t.correct, total: t.total, before: t.before, after: t.after }])
          ),
        },
      }),
    ]);

    // ─── Phase 4: Build review (pure computation, no DB) ───
    const review = questions.map((q) => {
      const a = (answers as any)[q.id];
      return {
        id: q.id, subject: q.subject as string, topicName: q.topic?.name || "",
        body: q.body, imageUrl: q.imageUrl,
        optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
        correctOption: q.correctOption as string,
        selectedOption: a?.selected || null, isCorrect: a?.selected === q.correctOption,
        explanation: q.explanation, explanationImageUrl: (q as any).explanationImageUrl || null,
        difficulty: q.difficulty as string,
      };
    });

    return NextResponse.json({
      score, totalCorrect, totalAnswered, totalQuestions: questions.length,
      subjectScores: Object.entries(subjectScores).map(([subject, s]) => ({
        subject, correct: s.correct, total: s.total, answered: s.answered,
        accuracy: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0,
        score: Math.round((s.correct / s.total) * 100),
      })),
      topicInsights, difficultyProfile, review,
    });
  } catch (error) {
    console.error("Submit test error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}