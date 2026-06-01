import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    // Get course with university
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { university: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get student's predicted score
    const responses = await db.questionResponse.findMany({
      where: { userId, session: { status: "COMPLETED" } },
      include: { question: { select: { subject: true, topicId: true, difficulty: true } } },
      orderBy: { answeredAt: "desc" },
      take: 300,
    });

    // Calculate per-subject accuracy
    const subjectStats: Record<string, { correct: number; total: number; accuracy: number }> = {};

    for (const r of responses) {
      const subj = r.question.subject;
      if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, total: 0, accuracy: 0 };
      subjectStats[subj].total++;
      if (r.isCorrect) subjectStats[subj].correct++;
    }

    for (const key of Object.keys(subjectStats)) {
      const s = subjectStats[key];
      s.accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    }

    // Calculate predicted score for required subjects
    const requiredSubjects = course.requiredSubjects as string[];
    let totalPredicted = 0;
    let subjectsWithData = 0;

    const subjectBreakdown: Array<{
      subject: string;
      accuracy: number;
      predicted: number;
      hasData: boolean;
      status: string;
    }> = [];

    for (const subj of requiredSubjects) {
      const stat = subjectStats[subj];
      const hasData = !!stat && stat.total >= 5;
      const accuracy = hasData ? stat.accuracy : 50;
      const predicted = Math.round(accuracy);

      if (hasData) {
        totalPredicted += predicted;
        subjectsWithData++;
      } else {
        totalPredicted += 50; // assume average if no data
      }

      let status = "needs_work";
      if (accuracy >= 80) status = "strong";
      else if (accuracy >= 60) status = "on_track";
      else if (accuracy >= 40) status = "needs_improvement";
      else status = "critical";

      subjectBreakdown.push({
        subject: subj,
        accuracy,
        predicted,
        hasData,
        status,
      });
    }

    const predictedScore = Math.round((totalPredicted / requiredSubjects.length) * 4);
    const cutoff = course.jambCutoff;
    const gap = Math.max(0, cutoff - predictedScore);

    // Calculate admission probability
    let probability: number;
    const scoreDiff = predictedScore - cutoff;

    if (scoreDiff >= 40) {
      probability = 92 + Math.min(7, scoreDiff / 10);
    } else if (scoreDiff >= 20) {
      probability = 78 + (scoreDiff - 20) * 0.7;
    } else if (scoreDiff >= 0) {
      probability = 55 + scoreDiff * 1.15;
    } else if (scoreDiff >= -20) {
      probability = 30 + (scoreDiff + 20) * 1.25;
    } else if (scoreDiff >= -50) {
      probability = 10 + (scoreDiff + 50) * 0.67;
    } else {
      probability = Math.max(2, 10 + scoreDiff * 0.1);
    }

    // Adjust for competitiveness
    const compMultipliers: Record<string, number> = {
      LOW: 1.15,
      MODERATE: 1.0,
      HIGH: 0.9,
      VERY_HIGH: 0.8,
      EXTREME: 0.65,
    };

    probability = Math.round(
      Math.min(99, Math.max(1, probability * (compMultipliers[course.competitiveness] || 1)))
    );

    // Build roadmap
    const roadmap: Array<{ action: string; impact: string; priority: string }> = [];

    // Sort subjects by weakness
    const sortedSubjects = [...subjectBreakdown].sort((a, b) => a.accuracy - b.accuracy);

    for (const subj of sortedSubjects) {
      if (subj.accuracy < 40) {
        const potentialGain = Math.round((60 - subj.accuracy) * 0.04 * 100) / 100;
        roadmap.push({
          action: `Intensive focus on ${subj.subject.replace(/_/g, " ")} — currently at ${subj.accuracy}%`,
          impact: `+${Math.round(potentialGain * 10)}-${Math.round(potentialGain * 15)} points potential`,
          priority: "critical",
        });
      } else if (subj.accuracy < 60) {
        roadmap.push({
          action: `Improve ${subj.subject.replace(/_/g, " ")} from ${subj.accuracy}% to 75%+`,
          impact: `+${Math.round((75 - subj.accuracy) * 0.3)} points potential`,
          priority: "high",
        });
      } else if (subj.accuracy < 80) {
        roadmap.push({
          action: `Polish ${subj.subject.replace(/_/g, " ")} — push from ${subj.accuracy}% to 85%+`,
          impact: `+${Math.round((85 - subj.accuracy) * 0.2)} points potential`,
          priority: "medium",
        });
      }
    }

    if (gap > 0) {
      roadmap.push({
        action: "Take 2 full mock exams per week to build exam stamina",
        impact: "Typically adds 10-20 points from timing improvement alone",
        priority: "high",
      });
    }

    if (!subjectBreakdown.every((s) => s.hasData)) {
      roadmap.push({
        action: "Practice all required subjects to improve prediction accuracy",
        impact: "More data = more accurate probability calculation",
        priority: "high",
      });
    }

    // Save the reality check
    const realityCheck = await db.realityCheck.create({
      data: {
        userId,
        courseId,
        predictedScore,
        targetScore: cutoff,
        probability,
        gap,
        roadmap,
        subjectBreakdown,
      },
    });

    return NextResponse.json({
      id: realityCheck.id,
      university: {
        name: course.university.name,
        shortName: course.university.shortName,
        state: course.university.state,
        type: course.university.type,
      },
      course: {
        name: course.name,
        faculty: course.faculty,
        cutoff: course.jambCutoff,
        competitiveness: course.competitiveness,
        acceptanceRate: course.acceptanceRate,
        totalSlots: course.totalSlots,
      },
      prediction: {
        predictedScore,
        cutoff,
        gap,
        probability,
        subjectBreakdown,
        dataConfidence: subjectsWithData >= 3 ? "high" : subjectsWithData >= 1 ? "medium" : "low",
      },
      roadmap,
    });
  } catch (error) {
    console.error("Reality check error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}