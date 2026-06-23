import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;
    const questionCount = parseInt(formData.get("questionCount") as string) || 10;
    const difficulty = (formData.get("difficulty") as string) || "MIXED";

    let content = text || "";

    // Extract text from uploaded file
    if (file) {
      if (file.type === "application/pdf") {
        // For PDF, read as base64 and send to Claude with document type
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        const extractRes = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              { type: "text", text: "Extract all the text content from this document. Return only the raw text, no commentary." },
            ],
          }],
        });
        content = extractRes.content.map((b) => b.type === "text" ? b.text : "").join("\n");
      } else {
        // Plain text, markdown, etc.
        content = await file.text();
      }
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "No content provided. Paste text or upload a file." }, { status: 400 });
    }

    // Truncate if too long
    const trimmed = content.slice(0, 8000);

    const difficultyInstruction = difficulty === "MIXED"
      ? "Mix difficulties: about 30% easy, 50% medium, 20% hard."
      : `Make all questions ${difficulty.toLowerCase()} difficulty.`;

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are a JAMB exam question generator. Based on the following study material, generate exactly ${questionCount} multiple-choice questions.

${difficultyInstruction}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- One correct answer per question
- Include a brief explanation for the correct answer
- Questions should test understanding, not just recall
- Vary question types: definition, application, analysis, comparison

Study material:
${trimmed}

Respond ONLY with valid JSON in this exact format, no markdown backticks:
{
  "title": "Quiz title based on the content",
  "questions": [
    {
      "id": 1,
      "body": "Question text",
      "optionA": "First option",
      "optionB": "Second option",
      "optionC": "Third option",
      "optionD": "Fourth option",
      "correctOption": "A",
      "explanation": "Brief explanation",
      "difficulty": "EASY"
    }
  ]
}`,
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const quiz = JSON.parse(cleaned);
      return NextResponse.json(quiz);
    } catch {
      return NextResponse.json({ error: "Failed to parse quiz. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("QuizFetch error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}