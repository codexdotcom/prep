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

    const { topicId, subject, uploadIds } = await req.json();

    if (!topicId || !subject) {
      return NextResponse.json({ error: "Topic and subject required" }, { status: 400 });
    }

    // Parallel data fetch
    const [topic, questions, uploads] = await Promise.all([
      db.topic.findUnique({
        where: { id: topicId },
        select: { id: true, name: true, subject: true, description: true },
      }),
      db.question.findMany({
        where: { topicId, isActive: true },
        select: {
          body: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          correctOption: true,
          explanation: true,
          difficulty: true,
          year: true,
          correctRate: true,
        },
        orderBy: { totalAttempts: "desc" },
        take: 20,
      }),
      uploadIds?.length
        ? db.noteUpload.findMany({
            where: { id: { in: uploadIds }, userId: session.user.id },
            select: { extractedText: true, filename: true },
          })
        : Promise.resolve([]),
    ]);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Build trimmed question analysis
    const questionAnalysis = questions.map((q, i) => {
      const correctAnswer = (q as any)[`option${q.correctOption}`];
      const body = q.body.length > 250 ? q.body.slice(0, 250) + "..." : q.body;
      const explanation = q.explanation ? q.explanation.slice(0, 150) : "";
      return `Q${i + 1}${q.year ? ` (${q.year})` : ""}${q.difficulty === "HARD" ? " [HARD]" : ""}: ${body}\nAns: ${q.correctOption}. ${correctAnswer}${explanation ? `\nWhy: ${explanation}` : ""}`;
    }).join("\n\n");

    const hardCount = questions.filter(
      (q) => (q.correctRate !== null && q.correctRate < 0.4) || q.difficulty === "HARD"
    ).length;
    const easyCount = questions.filter(
      (q) => q.correctRate !== null && q.correctRate > 0.8
    ).length;

    const uploadedContent = uploads
      .filter((u) => u.extractedText)
      .map((u) => `--- ${u.filename} ---\n${u.extractedText!.slice(0, 1500)}`)
      .join("\n\n");

    const systemPrompt = `You are an expert Nigerian JAMB examiner and tutor. Create study notes that are comprehensive, clear, and focused on what JAMB actually tests.

FORMATTING RULES:
- Use $...$ for inline math and $$...$$ for display math (LaTeX)
- Bold key terms with **term**
- Use ## for main sections and ### for subsections
- Use markdown tables for comparisons
- Use numbered lists for steps and processes
- Use bullet lists for collections of facts
- Write in clear, simple English suitable for Nigerian secondary school students
- Every sentence must serve the student. No filler.

CONTENT RULES:
- Analyze the actual exam questions to determine what JAMB really tests
- Focus heavily on concepts that appear repeatedly in questions
- For hard topics (<40% pass rate), give extra detail and multiple worked examples
- For easy topics (>80% pass rate), cover briefly
- Include step-by-step worked examples that mirror actual JAMB question patterns
- Show the formula, the substitution, and the answer for every calculation
- Include memory tricks and mnemonics where helpful
- Address the most common wrong answers and why students pick them

PRACTICE QUESTIONS:
After your main notes, include exactly 5 practice questions using this format:

[PRACTICE]
Q: (question text)
A) (option)
B) (option)
C) (option)
D) (option)
CORRECT: (letter)
WHY: (1-2 sentence explanation)
[/PRACTICE]

Make the questions progressive: start easy, end hard.`;

    const prompt = `Generate comprehensive JAMB study notes for:

**Subject:** ${subject.replace(/_/g, " ")}
**Topic:** ${topic.name}
${topic.description ? `**About:** ${topic.description}` : ""}

${questions.length} actual JAMB questions analyzed:

${questionAnalysis}

${hardCount > 0 ? `\n${hardCount} questions have <40% success rate. Cover these in extra detail.` : ""}
${easyCount > 0 ? `\n${easyCount} questions have >80% success rate. Cover briefly.` : ""}
${uploadedContent ? `\nReference material:\n${uploadedContent.slice(0, 2000)}` : ""}

Use this structure:

## ${topic.name}

### What JAMB Tests
(Brief overview of the key areas JAMB focuses on for this topic)

### Key Concepts
(Core theory with clear explanations. Use tables for comparisons.)

### Formulas & Definitions
(Every formula and definition that appears in questions. Use display math.)

### Worked Examples
(4-5 step-by-step solutions mirroring real JAMB question patterns)

### Common Traps
(What students get wrong and why. Be specific.)

### Quick Review
(Bullet points of the most important facts to memorize)

Then add exactly 5 practice questions using the [PRACTICE] format.

Finally, add these metadata sections:

---SUMMARY---
(2-3 sentence summary of the most critical takeaways)
---KEY_FORMULAS---
(one formula per line)
---COMMON_MISTAKES---
(one mistake per line)
---EXAM_TIPS---
(one tip per line)
---END---`;

    const { text: rawContent, error: aiError } = await generateAIResponse(
      systemPrompt,
      [{ role: "user", content: prompt }],
      4000
    );

    if (aiError || !rawContent) {
      return NextResponse.json(
        { error: "Failed to generate notes. Try again." },
        { status: 500 }
      );
    }

    // Parse metadata sections
    const parseSuffix = (content: string, marker: string): string[] => {
      const regex = new RegExp(`---${marker}---([\\s\\S]*?)(?=---[A-Z_]+---|$)`);
      const match = content.match(regex);
      if (!match) return [];
      return match[1]
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
        .filter((l) => l.length > 2);
    };

    const summary = (() => {
      const match = rawContent.match(
        /---SUMMARY---([\s\S]*?)(?=---[A-Z_]+---|$)/
      );
      return match ? match[1].trim() : null;
    })();

    const keyFormulas = parseSuffix(rawContent, "KEY_FORMULAS");
    const commonMistakes = parseSuffix(rawContent, "COMMON_MISTAKES");
    const examTips = parseSuffix(rawContent, "EXAM_TIPS");

    // Strip metadata from main content
    const noteContent =
      rawContent.replace(/---SUMMARY---[\s\S]*?---END---/, "").trim() ||
      rawContent.replace(/---SUMMARY---[\s\S]*/, "").trim() ||
      rawContent;

    // Extract practice questions
    const practiceQuestions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }> = [];

    const practiceBlocks = rawContent.matchAll(
      /\[PRACTICE\]([\s\S]*?)\[\/PRACTICE\]/g
    );
    for (const block of practiceBlocks) {
      const text = block[1];
      const qMatch = text.match(/Q:\s*(.+)/);
      const opts = [...text.matchAll(/([A-D])\)\s*(.+)/g)].map((m) =>
        m[2].trim()
      );
      const correctMatch = text.match(/CORRECT:\s*([A-D])/);
      const whyMatch = text.match(/WHY:\s*(.+)/);
      if (qMatch && opts.length >= 2 && correctMatch) {
        practiceQuestions.push({
          question: qMatch[1].trim(),
          options: opts,
          correctIndex: correctMatch[1].charCodeAt(0) - 65,
          explanation: whyMatch?.[1]?.trim() || "",
        });
      }
    }

    // Save to database
    const existingNote = await db.generatedNote.findFirst({
      where: { topicId, subject: subject as any },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const version = (existingNote?.version || 0) + 1;

    const note = await db.generatedNote.create({
      data: {
        subject: subject as any,
        topicId,
        title: `${topic.name} - JAMB Study Notes`,
        content: noteContent,
        summary: summary || null,
        keyFormulas,
        commonMistakes,
        examTips,
        practiceQuestions:
          practiceQuestions.length > 0 ? (practiceQuestions as any) : undefined,
        questionCount: questions.length,
        difficulty:
          questions.length > 0
            ? questions.filter((q) => q.difficulty === "HARD").length >
              questions.length / 2
              ? "HARD"
              : "MEDIUM"
            : "MEDIUM",
        version,
        isPublished: true,
        generatedFrom: {
          uploadIds: uploadIds || [],
          generatedAt: new Date().toISOString(),
        },
      },
      include: { topic: { select: { name: true } } },
    });

    return NextResponse.json({
      id: note.id,
      title: note.title,
      content: note.content,
      summary: note.summary,
      keyFormulas: note.keyFormulas,
      commonMistakes: note.commonMistakes,
      examTips: note.examTips,
      practiceQuestions:
        practiceQuestions.length > 0 ? practiceQuestions : undefined,
      questionCount: note.questionCount,
      version: note.version,
    });
  } catch (error) {
    console.error("Note generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}