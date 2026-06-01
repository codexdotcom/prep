import { db } from "./db";

export async function getOrCreateTodaysChallenge() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today's challenge exists
  const existing = await db.dailyChallenge.findUnique({
    where: { date: today },
    include: { topic: { select: { name: true } } },
  });

  if (existing) return existing;

  // Generate a new challenge
  // Rotate subjects daily
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );

  const subjects = [
    "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY",
    "USE_OF_ENGLISH", "ECONOMICS", "GOVERNMENT", "LITERATURE",
  ];
  const todaysSubject = subjects[dayOfYear % subjects.length];

  // Get a random topic for this subject
  const topics = await db.topic.findMany({
    where: { subject: todaysSubject as any },
  });

  const randomTopic = topics.length > 0
    ? topics[Math.floor(Math.random() * topics.length)]
    : null;

  // Pick 7 questions with mixed difficulty
  const whereClause: any = {
    subject: todaysSubject,
    isActive: true,
  };
  if (randomTopic) whereClause.topicId = randomTopic.id;

  const [easyQs, medQs, hardQs] = await Promise.all([
    db.question.findMany({
      where: { ...whereClause, difficulty: "EASY" },
      select: { id: true },
      take: 10,
    }),
    db.question.findMany({
      where: { ...whereClause, difficulty: "MEDIUM" },
      select: { id: true },
      take: 10,
    }),
    db.question.findMany({
      where: { ...whereClause, difficulty: "HARD" },
      select: { id: true },
      take: 10,
    }),
  ]);

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const selectedIds = [
    ...shuffle(easyQs).slice(0, 2),
    ...shuffle(medQs).slice(0, 3),
    ...shuffle(hardQs).slice(0, 2),
  ].map((q) => q.id);

  const finalIds = shuffle(selectedIds);

  if (finalIds.length === 0) {
    // Fallback: get any questions for this subject
    const fallback = await db.question.findMany({
      where: { subject: todaysSubject as any, isActive: true },
      select: { id: true },
      take: 7,
    });
    finalIds.push(...fallback.map((q) => q.id));
  }

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const titles = [
    `${formatSubject(todaysSubject)} Sprint`,
    `Daily ${formatSubject(todaysSubject)} Challenge`,
    `${formatSubject(todaysSubject)} Showdown`,
    `Quick ${formatSubject(todaysSubject)} Round`,
    `${formatSubject(todaysSubject)} Battle`,
  ];

  const challenge = await db.dailyChallenge.create({
    data: {
      date: today,
      subject: todaysSubject as any,
      topicId: randomTopic?.id,
      title: titles[dayOfYear % titles.length],
      description: randomTopic
        ? `Today's focus: ${randomTopic.name}. 7 questions, 5 minutes. How high can you score?`
        : `${formatSubject(todaysSubject)} challenge. 7 questions, 5 minutes. Beat yesterday's score.`,
      questionIds: finalIds,
      difficulty: "MEDIUM",
      timeLimit: 300,
      xpReward: 50,
      bonusXP: 25,
    },
    include: { topic: { select: { name: true } } },
  });

  return challenge;
}