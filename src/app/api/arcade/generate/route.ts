import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { game, subject, difficulty } = await req.json();
    if (!game || !subject) {
      return NextResponse.json({ error: "Game type and subject required" }, { status: 400 });
    }

    // Find the subject enum value
    const subjectMap: Record<string, string> = {
      "Use of English": "USE_OF_ENGLISH", "Mathematics": "MATHEMATICS",
      "Physics": "PHYSICS", "Chemistry": "CHEMISTRY", "Biology": "BIOLOGY",
      "Literature": "LITERATURE", "Government": "GOVERNMENT", "Economics": "ECONOMICS",
      "Commerce": "COMMERCE", "Accounting": "ACCOUNTING", "CRS": "CRS",
      "Geography": "GEOGRAPHY", "Agricultural Science": "AGRICULTURAL_SCIENCE",
    };
    const subjectEnum = subjectMap[subject] || subject;

    const where: any = { subject: subjectEnum as any, isActive: true };

    if (game === "speed-quiz" || game === "true-false") {
      const count = game === "speed-quiz" ? 15 : 15;
      const questions = await db.question.findMany({
        where,
        include: { topic: { select: { name: true } } },
        take: 100,
      });

      if (questions.length < 5) {
        return NextResponse.json({ error: `Not enough ${subject} questions in the bank yet. Try another subject.` }, { status: 400 });
      }

      // Shuffle and pick
      const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, count);

      if (game === "speed-quiz") {
        return NextResponse.json({
          questions: shuffled.map((q, i) => ({
            id: i + 1,
            dbId: q.id,
            question: q.body,
            options: [q.optionA, q.optionB, q.optionC, q.optionD],
            correct: ["A", "B", "C", "D"].indexOf(q.correctOption),
            points: q.difficulty === "EASY" ? 10 : q.difficulty === "HARD" ? 30 : 20,
            difficulty: q.difficulty,
            topic: q.topic.name,
            explanation: q.explanation || "",
          })),
        });
      }

      // true-false: convert MCQs into true/false statements
      return NextResponse.json({
        statements: shuffled.map((q, i) => {
          const isTrue = Math.random() > 0.5;
          const correctIdx = ["A", "B", "C", "D"].indexOf(q.correctOption);
          const wrongIdx = [0, 1, 2, 3].filter((x) => x !== correctIdx)[Math.floor(Math.random() * 3)];
          const options = [q.optionA, q.optionB, q.optionC, q.optionD];

          return {
            id: i + 1,
            dbId: q.id,
            statement: isTrue
              ? `${q.body.replace(/\?$/, "")} - The answer is ${options[correctIdx]}.`
              : `${q.body.replace(/\?$/, "")} - The answer is ${options[wrongIdx]}.`,
            isTrue,
            explanation: isTrue
              ? `Correct! ${q.explanation || `The answer is ${options[correctIdx]}.`}`
              : `The correct answer is ${options[correctIdx]}. ${q.explanation || ""}`,
            points: q.difficulty === "EASY" ? 10 : q.difficulty === "HARD" ? 30 : 20,
            topic: q.topic.name,
          };
        }),
      });
    }

    if (game === "word-scramble") {
      // Get topics as words to scramble
      const topics = await db.topic.findMany({
        where: { subject: subjectEnum as any },
        select: { name: true },
        take: 50,
      });

      const questions = await db.question.findMany({
        where,
        include: { topic: { select: { name: true } } },
        take: 60,
      });

      // Extract key terms from questions and topics
      const terms: Array<{ word: string; hint: string; category: string }> = [];

      // Add topic names
      topics.forEach((t) => {
        if (t.name.length >= 4 && t.name.length <= 15 && /^[a-zA-Z\s]+$/.test(t.name)) {
          terms.push({ word: t.name.toUpperCase().replace(/\s+/g, ""), hint: `A topic in ${subject}`, category: subject });
        }
      });

      // Extract terms from question options (correct answers that are single words/short phrases)
      questions.forEach((q) => {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD];
        const correct = options[["A", "B", "C", "D"].indexOf(q.correctOption)];
        if (correct && correct.length >= 4 && correct.length <= 15 && /^[a-zA-Z\s]+$/.test(correct)) {
          terms.push({ word: correct.toUpperCase().replace(/\s+/g, ""), hint: q.body.slice(0, 60), category: q.topic.name });
        }
      });

      // Dedupe and shuffle
      const unique = [...new Map(terms.map((t) => [t.word, t])).values()];
      const picked = unique.sort(() => Math.random() - 0.5).slice(0, 12);

      if (picked.length < 5) {
        return NextResponse.json({ error: `Not enough terms found for ${subject}. Try another subject.` }, { status: 400 });
      }

      return NextResponse.json({
        words: picked.map((t, i) => ({
          id: i + 1,
          word: t.word,
          hint: t.hint,
          category: t.category,
          points: t.word.length <= 6 ? 10 : t.word.length <= 10 ? 20 : 30,
        })),
      });
    }

    if (game === "memory-match") {
      const questions = await db.question.findMany({
        where,
        include: { topic: { select: { name: true } } },
        take: 40,
      });

      if (questions.length < 8) {
        return NextResponse.json({ error: `Not enough ${subject} questions. Try another subject.` }, { status: 400 });
      }

      // Create term-definition pairs from questions and their correct answers
      const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 8);
      return NextResponse.json({
        pairs: shuffled.map((q, i) => {
          const options = [q.optionA, q.optionB, q.optionC, q.optionD];
          const correct = options[["A", "B", "C", "D"].indexOf(q.correctOption)];
          // Shorten the question to fit cards
          const shortQ = q.body.length > 40 ? q.body.slice(0, 37) + "..." : q.body;
          return {
            id: i + 1,
            term: shortQ,
            definition: correct,
          };
        }),
      });
    }

    return NextResponse.json({ error: "Unknown game type" }, { status: 400 });
  } catch (error: any) {
    console.error("Arcade error:", error?.message);
    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}