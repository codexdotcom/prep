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

    let totalCorrect = 0;
    let totalAnswered = 0;
    const topicUpdates: Record<
      string,
      {
        topicId: string;
        topicName: string;
        subject: string;
        responses: Array<{ correct: boolean; difficulty: string; timeMs: number }>;
      }
    > = {};

    for (const [qId, answer] of Object.entries(
      answers as Record<string, { selected: string | null; timeSpent: number }>
    )) {
      const q = questionMap.get(qId);
      if (!q) continue;

      const isCorrect = answer.selected === q.correctOption;
      if (answer.selected) {
        totalAnswered++;
        if (isCorrect) totalCorrect++;
      }

      if (q.topicId && q.topic && answer.selected) {
        if (!topicUpdates[q.topicId]) {
          topicUpdates[q.topicId] = {
            topicId: q.topicId,
            topicName: q.topic.name,
            subject: q.subject as string,
            responses: [],
          };
        }
        topicUpdates[q.topicId].responses.push({
          correct: isCorrect,
          difficulty: q.difficulty as string,
          timeMs: (answer.timeSpent || 0) * 1000,
        });
      }

      // Upsert to avoid unique constraint violation
      await db.questionResponse.upsert({
        where: {
          sessionId_questionId: { sessionId, questionId: qId },
        },
        create: {
          session: { connect: { id: sessionId } },
          question: { connect: { id: qId } },
          userId,
          selectedOption: (answer.selected || null) as CorrectOption | null,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
        },
        update: {
          selectedOption: (answer.selected || null) as CorrectOption | null,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
        },
      });
    }

    // Update StudentTopicAbility
    const topicBreakdown: Array<{
      topicId: string;
      topicName: string;
      subject: string;
      correct: number;
      total: number;
      answered: number;
      accuracy: number;
      mastered: boolean;
      needsWork: boolean;
      abilityBefore: number;
      abilityAfter: number;
      abilityChange: number;
    }> = [];

    for (const [topicId, data] of Object.entries(topicUpdates)) {
      const abilityRecord = await db.studentTopicAbility.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });

      let currentState: TopicAbilityState;

      if (abilityRecord) {
        currentState = {
          topicId,
          subject: abilityRecord.subject,
          ability: abilityRecord.ability,
          confidence: abilityRecord.confidence,
          totalAttempts: abilityRecord.totalAttempts,
          totalCorrect: abilityRecord.totalCorrect,
          recentResults: abilityRecord.recentResults,
          avgTimeMs: abilityRecord.avgTimeMs,
          currentStreak: abilityRecord.currentStreak,
          lastPracticedAt: abilityRecord.lastPracticedAt,
          intervalDays: abilityRecord.intervalDays,
          easeFactor: abilityRecord.easeFactor,
          nextReviewAt: abilityRecord.nextReviewAt,
        };
      } else {
        currentState = {
          topicId,
          subject: data.subject,
          ability: 50,
          confidence: 0,
          totalAttempts: 0,
          totalCorrect: 0,
          recentResults: [],
          avgTimeMs: null,
          currentStreak: 0,
          lastPracticedAt: null,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: null,
        };
      }

      const beforeAbility = currentState.ability;

      for (const resp of data.responses) {
        currentState = updateTopicAbility(
          currentState,
          resp.correct,
          resp.difficulty,
          resp.timeMs
        );
      }

      const topicCorrect = data.responses.filter((r) => r.correct).length;
      const topicTotal = data.responses.length;

      topicBreakdown.push({
        topicId,
        topicName: data.topicName,
        subject: data.subject,
        correct: topicCorrect,
        total: topicTotal,
        answered: topicTotal,
        accuracy:
          topicTotal > 0
            ? Math.round((topicCorrect / topicTotal) * 100)
            : 0,
        mastered:
          currentState.ability >= 75 && currentState.confidence >= 0.4,
        needsWork:
          currentState.ability < 45 && currentState.totalAttempts >= 3,
        abilityBefore: Math.round(beforeAbility),
        abilityAfter: Math.round(currentState.ability),
        abilityChange: Math.round(currentState.ability - beforeAbility),
      });

      await db.studentTopicAbility.upsert({
        where: { userId_topicId: { userId, topicId } },
        create: {
          user: { connect: { id: userId } },
          topic: { connect: { id: topicId } },
          subject: data.subject as JambSubject,
          ability: currentState.ability,
          confidence: currentState.confidence,
          totalAttempts: currentState.totalAttempts,
          totalCorrect: currentState.totalCorrect,
          recentResults: currentState.recentResults,
          avgTimeMs: currentState.avgTimeMs,
          currentStreak: currentState.currentStreak,
          lastPracticedAt: currentState.lastPracticedAt,
          intervalDays: currentState.intervalDays,
          easeFactor: currentState.easeFactor,
          nextReviewAt: currentState.nextReviewAt,
        },
        update: {
          ability: currentState.ability,
          confidence: currentState.confidence,
          totalAttempts: currentState.totalAttempts,
          totalCorrect: currentState.totalCorrect,
          recentResults: currentState.recentResults,
          avgTimeMs: currentState.avgTimeMs,
          currentStreak: currentState.currentStreak,
          lastPracticedAt: currentState.lastPracticedAt,
          intervalDays: currentState.intervalDays,
          easeFactor: currentState.easeFactor,
          nextReviewAt: currentState.nextReviewAt,
        },
      });
    }

    const accuracy =
      totalAnswered > 0
        ? Math.round((totalCorrect / totalAnswered) * 100)
        : 0;

    await db.testSession.update({
      where: { id: sessionId },
      data: {
        score: accuracy,
        totalCorrect,
        totalWrong: totalAnswered - totalCorrect,
        totalSkipped: questions.length - totalAnswered,
        completedAt: new Date(),
        status: "COMPLETED",
        topicAccuracy: Object.fromEntries(
          topicBreakdown.map((t) => [
            t.topicId,
            { correct: t.correct, total: t.total, before: t.abilityBefore, after: t.abilityAfter },
          ])
        ),
      },
    });

    const review = questions.map((q) => {
      const a = (answers as any)[q.id];
      return {
        id: q.id,
        topicName: q.topic?.name || "",
        body: q.body,
        imageUrl: q.imageUrl,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption as string,
        selectedOption: a?.selected || null,
        isCorrect: a?.selected === q.correctOption,
        explanation: q.explanation,
        explanationImageUrl: (q as any).explanationImageUrl || null,
        difficulty: q.difficulty as string,
      };
    });

    return NextResponse.json({
      accuracy,
      totalCorrect,
      totalAnswered,
      totalQuestions: questions.length,
      topicBreakdown,
      review,
    });
  } catch (error) {
    console.error("Drill submit error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}