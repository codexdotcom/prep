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

    // Get topic info
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true, subject: true, description: true },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // ─── Step 1: Analyze the question bank for this topic ───
    const questions = await db.question.findMany({
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
        totalAttempts: true,
      },
      orderBy: { totalAttempts: "desc" },
      take: 50,
    });

    // ─── Step 2: Identify patterns from questions ───
    const questionAnalysis = questions.map((q, i) => {
      const correctAnswer = (q as any)[`option${q.correctOption}`];
      return `Q${i + 1}${q.year ? ` (${q.year})` : ""}${q.difficulty === "HARD" ? " [HARD]" : ""}: ${q.body}\nAnswer: ${q.correctOption}. ${correctAnswer}${q.explanation ? `\nWhy: ${q.explanation}` : ""}${q.correctRate !== null ? `\n(${Math.round((q.correctRate || 0) * 100)}% of students get this right)` : ""}`;
    }).join("\n\n");

    // ─── Step 3: Get uploaded reference materials ───
    let uploadedContent = "";
    if (uploadIds && uploadIds.length > 0) {
      const uploads = await db.noteUpload.findMany({
        where: { id: { in: uploadIds }, userId: session.user.id },
        select: { extractedText: true, filename: true },
      });

      uploadedContent = uploads
        .filter((u) => u.extractedText)
        .map((u) => `--- From: ${u.filename} ---\n${u.extractedText}`)
        .join("\n\n");
    }

    // ─── Step 4: Find what students struggle with ───
    const hardQuestions = questions.filter((q) =>
      (q.correctRate !== null && q.correctRate < 0.4) || q.difficulty === "HARD"
    );

    const easyQuestions = questions.filter((q) =>
      q.correctRate !== null && q.correctRate > 0.8
    );

    // ─── Step 5: Generate the note with AI ───
    const systemPrompt = `You are an expert Nigerian JAMB examiner and tutor creating study notes. 
Your job is to create the MOST EFFICIENT study notes possible — covering ONLY what students need to know to answer JAMB questions on this topic.

CRITICAL RULES:
- Analyze the actual exam questions provided to understand exactly what JAMB tests
- Focus on concepts that appear repeatedly in questions
- Include worked examples that mirror actual JAMB question patterns
- Use simple English — the student might be reading this on a phone with limited time
- Use $...$ for inline math and $$...$$ for display math (LaTeX notation)
- Bold key terms with **term**
- Structure with clear headings using ## and ###
- Keep it concise — every sentence must earn its place
- Include memory tricks (mnemonics) where helpful
- End with a quick self-test section`;

    const prompt = `Generate comprehensive but concise JAMB study notes for:

**Subject:** ${subject.replace(/_/g, " ")}
**Topic:** ${topic.name}
${topic.description ? `**Description:** ${topic.description}` : ""}

I have analyzed ${questions.length} actual JAMB questions on this topic. Here are the patterns:

${questionAnalysis}

${hardQuestions.length > 0 ? `\n**Questions students struggle with most (${hardQuestions.length} questions with <40% success rate):**\nThese concepts MUST be covered in detail with clear explanations.` : ""}

${easyQuestions.length > 0 ? `\n**Easy marks (${easyQuestions.length} questions with >80% success rate):**\nCover these briefly — students mostly know them already.` : ""}

${uploadedContent ? `\n**Additional reference material provided by the teacher:**\n${uploadedContent.slice(0, 3000)}` : ""}

Generate the notes in this EXACT structure:

## ${topic.name}

### Key Concepts
(Core theory — only what JAMB actually tests)

### Formulas & Definitions
(Every formula that appears in the questions, with clear labels)

### Worked Examples
(3-5 worked examples that mirror actual JAMB question patterns. Show step-by-step solutions.)

### Common Mistakes
(What students get wrong based on the question analysis)

### Exam Tips
(Specific tricks for answering JAMB questions on this topic faster)

### Quick Self-Test
(5 quick questions the student can answer mentally to check understanding)

Make sure EVERY concept you include can be traced back to an actual JAMB question pattern. Do NOT include anything that JAMB never tests.`;

    const { text: noteContent, error: aiError } = await generateAIResponse(
      systemPrompt,
      [{ role: "user", content: prompt }],
      4000
    );

    if (aiError || !noteContent) {
      return NextResponse.json({ error: "Failed to generate notes. Try again." }, { status: 500 });
    }

    // ─── Step 6: Extract structured data from the note ───
    const extractSection = (content: string, heading: string): string[] => {
      const regex = new RegExp(`###\\s*${heading}[\\s\\S]*?(?=###|$)`, "i");
      const match = content.match(regex);
      if (!match) return [];
      return match[0]
        .split("\n")
        .filter((line) => line.startsWith("- ") || line.startsWith("* ") || /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    };

    const keyFormulas = extractSection(noteContent, "Formulas");
    const commonMistakes = extractSection(noteContent, "Common Mistakes");
    const examTips = extractSection(noteContent, "Exam Tips");

    // ─── Step 7: Generate TL;DR summary ───
    const { text: summary } = await generateAIResponse(
      "You create ultra-concise summaries. Respond with a 2-3 sentence summary only.",
      [{ role: "user", content: `Summarize these study notes in 2-3 sentences. What are the absolute essentials a student must know?\n\n${noteContent.slice(0, 2000)}` }],
      200
    );

    // ─── Step 8: Save to database ───
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
        title: `${topic.name} — JAMB Study Notes`,
        content: noteContent,
        summary: summary || null,
        keyFormulas,
        commonMistakes,
        examTips,
        questionCount: questions.length,
        difficulty: questions.length > 0
          ? questions.filter((q) => q.difficulty === "HARD").length > questions.length / 2 ? "HARD" : "MEDIUM"
          : "MEDIUM",
        version,
        isPublished: true,
        generatedFrom: {
          questionIds: questions.map((q) => (q as any).id).filter(Boolean),
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
      questionCount: note.questionCount,
      version: note.version,
    });
  } catch (error) {
    console.error("Note generation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}