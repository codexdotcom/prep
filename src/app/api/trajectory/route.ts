import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetScore } = await req.json();
  const userId = session.user.id;

  const abilities = await db.studentTopicAbility.findMany({
    where: { userId },
    include: { topic: { select: { name: true, subject: true, weight: true } } },
  });

  const profile = await db.studentProfile.findUnique({
    where: { userId },
    include: { jambSubjects: { orderBy: { priority: "asc" } } },
  });

  const subjects = profile?.jambSubjects.map((s) => s.subject as string) || [];

  // Calculate per-subject averages
  const subjectData: Record<string, { total: number; count: number; weakTopics: string[] }> = {};
  for (const a of abilities) {
    const s = a.subject as string;
    if (!subjectData[s]) subjectData[s] = { total: 0, count: 0, weakTopics: [] };
    subjectData[s].total += a.ability;
    subjectData[s].count++;
    if (a.ability < 50) subjectData[s].weakTopics.push(a.topic.name);
  }

  const subjectBreakdown = subjects.map((s) => {
    const d = subjectData[s];
    const accuracy = d ? Math.round(d.total / d.count) : 50;
    const targetAcc = Math.round((targetScore / 400) * 100);
    return { subject: s, accuracy, gap: Math.max(0, targetAcc - accuracy), weakTopics: d?.weakTopics.slice(0, 3) || [] };
  });

  // Current predicted score
  const avgAbility = abilities.length > 0 ? abilities.reduce((s, a) => s + a.ability, 0) / abilities.length : 50;
  const currentScore = Math.round((avgAbility / 100) * 400);
  const gap = Math.max(0, targetScore - currentScore);

  // Estimate weeks needed (assume 5-8 points improvement per week with consistent practice)
  const weeklyGain = 6;
  const weeksNeeded = gap > 0 ? Math.ceil(gap / weeklyGain) : 0;

  // Generate milestones
  const milestones = [];
  const weakestSubjects = subjectBreakdown.sort((a, b) => b.gap - a.gap);
  for (let w = 1; w <= Math.min(weeksNeeded, 12); w++) {
    const focusSubject = weakestSubjects[(w - 1) % weakestSubjects.length];
    milestones.push({
      week: w,
      expectedScore: Math.min(targetScore, currentScore + weeklyGain * w),
      focus: focusSubject?.subject || subjects[0] || "USE_OF_ENGLISH",
      tasks: [
        `Drill weak topics in ${focusSubject?.subject.replace(/_/g, " ") || "English"}`,
        w % 2 === 0 ? "Take a full mock exam" : "Review past mistakes",
        "Complete daily challenge",
      ],
    });
  }

  return NextResponse.json({
    currentScore,
    targetScore,
    gap,
    weeksNeeded,
    milestones,
    subjectBreakdown: subjectBreakdown.sort((a, b) => b.gap - a.gap),
  });
}