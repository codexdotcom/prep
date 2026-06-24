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

    const { topic, subject, depth } = await req.json();

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({ error: "Enter a topic to explain." }, { status: 400 });
    }

    const subjectLine = subject ? `Subject: ${subject}` : "";
    const depthGuide = depth === "quick"
      ? "Keep it short and focused - about 400-500 words total. Hit only the essentials."
      : depth === "deep"
      ? "Go deep - about 1000-1200 words. Cover subtleties, edge cases, and advanced applications."
      : "Medium depth - about 600-800 words. Cover all key aspects clearly.";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are an expert JAMB tutor creating an educational explainer for a Nigerian student.

Topic: "${topic}"
${subjectLine}
${depthGuide}

Create a comprehensive, engaging explanation of this topic. Write as if you're the best teacher they've ever had.

Rules:
- Start with a hook or real-world connection
- Break into clear sections
- Use analogies and examples a Nigerian student would relate to
- Include formulas with explanations if relevant
- Add worked examples where applicable
- End with exam tips specific to JAMB
- Use simple, clear English throughout

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "Topic title",
  "subject": "Subject area",
  "hook": "Opening hook - one compelling sentence",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content with clear explanations. Can be multiple paragraphs separated by newlines.",
      "example": "Optional worked example or null"
    }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "The formula", "meaning": "What each part means" }
  ],
  "mnemonics": ["Memory trick 1"],
  "commonMistakes": ["Mistake students make 1"],
  "examTips": ["JAMB-specific tip 1"],
  "practiceQuestions": [
    { "question": "Quick self-test question", "answer": "Short answer" }
  ],
  "difficulty": "EASY|MEDIUM|HARD"
}`,
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const explainer = JSON.parse(cleaned);
      return NextResponse.json(explainer);
    } catch {
      return NextResponse.json({ error: "Failed to generate explainer. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Explainer error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}