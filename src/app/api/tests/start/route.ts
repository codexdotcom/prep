import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JambSubject, TestMode } from "@prisma/client";
import { applyForgettingCurve } from "@/lib/adaptive-engine";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mode, subject, subjects: requestedSubjects, questionCount } =
      await req.json();
    const userId = session.user.id;

    // Load student ability data for smart question selection
    const abilities = await db.studentTopicAbility.findMany({
      where: { userId },
      select: {
        topicId: true,
        ability: true,
        lastPracticedAt: true,
        confidence: true,
      },
    });
    const abilityMap = new Map(
      abilities.map((a) => {
        const days = a.lastPracticedAt
          ? (Date.now() - new Date(a.lastPracticedAt).getTime()) /
            (1000 * 60 * 60 * 24)
          : 0;
        return [
          a.topicId,
          {
            ability:
              days > 1
                ? applyForgettingCurve(a.ability, days)
                : a.ability,
            confidence: a.confidence,
          },
        ];
      })
    );

    let questions: any[] = [];
    let finalSubjects: string[] = [];
    let totalTime = 0; // minutes

    // ─── MOCK EXAM ───
    if (mode === "MOCK_EXAM") {
      if (requestedSubjects && requestedSubjects.length === 4) {
        finalSubjects = requestedSubjects;
      } else {
        return NextResponse.json(
          { error: "Select exactly 4 subjects for mock exam" },
          { status: 400 }
        );
      }

      totalTime = 120; // 2 hours

      for (let i = 0; i < finalSubjects.length; i++) {
        const subj = finalSubjects[i];
        const needed = i === 0 ? 60 : 40; // English gets 60, others 40

        const allSubjQs = await db.question.findMany({
          where: { subject: subj as JambSubject, isActive: true },
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
        });

        // Weight questions: prioritize weak topics + unseen topics
        const scored = allSubjQs.map((q) => {
          const topicData = abilityMap.get(q.topicId);
          let weight = 1;
          if (topicData) {
            weight += (100 - topicData.ability) / 50;
            weight += (1 - topicData.confidence) * 0.5;
          } else {
            weight += 1.5;
          }
          weight *= 0.7 + Math.random() * 0.6;
          return { ...q, weight };
        });

        // JAMB difficulty distribution: ~30% easy, 50% medium, 20% hard
        const byDiff: Record<string, any[]> = {
          EASY: [],
          MEDIUM: [],
          HARD: [],
        };
        for (const q of scored.sort((a, b) => b.weight - a.weight)) {
          const d = q.difficulty as string;
          if (byDiff[d]) byDiff[d].push(q);
        }

        const targetEasy = Math.round(needed * 0.3);
        const targetHard = Math.round(needed * 0.2);
        const targetMedium = needed - targetEasy - targetHard;

        const selected = [
          ...byDiff.EASY.slice(0, targetEasy),
          ...byDiff.MEDIUM.slice(0, targetMedium),
          ...byDiff.HARD.slice(0, targetHard),
        ];

        // Fill if not enough
        if (selected.length < needed) {
          const selectedIds = new Set(selected.map((s) => s.id));
          const remaining = scored.filter((q) => !selectedIds.has(q.id));
          selected.push(...remaining.slice(0, needed - selected.length));
        }

        // Shuffle within subject section
        questions.push(...selected.sort(() => Math.random() - 0.5));
      }

      // ─── PRACTICE (untimed, single subject) ───
    } else if (mode === "PRACTICE") {
      if (!subject)
        return NextResponse.json(
          { error: "Subject required" },
          { status: 400 }
        );
      finalSubjects = [subject];
      const count = questionCount || 40;
      totalTime = 0;

      const allQs = await db.question.findMany({
        where: { subject: subject as JambSubject, isActive: true },
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
      });

      const scored = allQs.map((q) => {
        const topicData = abilityMap.get(q.topicId);
        let weight = 1;
        if (topicData) {
          weight += (100 - topicData.ability) / 50;
          weight += (1 - topicData.confidence) * 0.5;
        } else {
          weight += 1.5;
        }
        weight *= 0.7 + Math.random() * 0.6;
        return { ...q, weight };
      });

      questions = scored
        .sort((a, b) => b.weight - a.weight)
        .slice(0, count);

      // ─── WEAK TOPIC ───
    } else if (mode === "WEAK_TOPIC") {
      if (!subject)
        return NextResponse.json(
          { error: "Subject required" },
          { status: 400 }
        );
      finalSubjects = [subject];
      totalTime = 0;

      const weakAbilities = abilities
        .filter((a) => a.confidence >= 0.2)
        .sort((a, b) => a.ability - b.ability)
        .slice(0, 10);
      const weakTopicIds = weakAbilities.map((a) => a.topicId);

      if (weakTopicIds.length > 0) {
        const fetched = await db.question.findMany({
          where: { topicId: { in: weakTopicIds }, isActive: true },
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
        });
        questions = fetched
          .sort(() => Math.random() - 0.5)
          .slice(0, questionCount || 40);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid mode. Use MOCK_EXAM, PRACTICE, or WEAK_TOPIC." },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "No questions available for the selected subjects. Add questions first.",
        },
        { status: 400 }
      );
    }

    // Deduplicate question IDs (safety)
    const seen = new Set<string>();
    questions = questions.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });

    // Build sections for mock exam
    const sections =
      mode === "MOCK_EXAM"
        ? (() => {
            let idx = 0;
            return finalSubjects.map((subj, i) => {
              const subjQuestions = questions.filter(
                (q: any) => q.subject === subj
              );
              const qCount = subjQuestions.length;
              const section = {
                subject: subj,
                label: subj
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                questionCount: qCount,
                startIndex: idx,
              };
              idx += qCount;
              return section;
            });
          })()
        : [];

    // Create test session (Prisma 7: use connect for relations)
    const testSession = await db.testSession.create({
      data: {
        user: { connect: { id: userId } },
        mode: mode as TestMode,
        subject:
          mode === "MOCK_EXAM"
            ? null
            : (finalSubjects[0] as JambSubject),
        subjects:
          mode === "MOCK_EXAM"
            ? (finalSubjects as JambSubject[])
            : [],
        totalQuestions: questions.length,
        timeLimit: totalTime > 0 ? totalTime * 60 : 0,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      sessionId: testSession.id,
      mode,
      totalTime,
      adaptive: true,
      subjects: finalSubjects,
      sections,
      questions: questions.map((q: any, i: number) => ({
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
    console.error("Start test error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}