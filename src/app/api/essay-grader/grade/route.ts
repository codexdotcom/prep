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

    const { essay, prompt: essayPrompt, type } = await req.json();

    if (!essay || essay.trim().length < 50) {
      return NextResponse.json({ error: "Essay must be at least 50 characters." }, { status: 400 });
    }

    const typeContext = type === "jamb"
      ? "This is a JAMB Use of English essay. Grade based on JAMB standards: content relevance, organization, expression, grammar, and mechanics. Score out of 40."
      : type === "waec"
      ? "This is a WAEC English Language essay. Grade based on WAEC criteria: content, organization, expression, mechanical accuracy. Score out of 20."
      : "This is a general academic essay. Grade on content, structure, clarity, grammar, and argumentation. Score out of 100.";

    const promptSection = essayPrompt ? `\n\nThe essay prompt/topic was: "${essayPrompt}"` : "";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `You are a strict but encouraging Nigerian English teacher grading a student's essay.

${typeContext}${promptSection}

Student's essay:
"""
${essay.slice(0, 5000)}
"""

Grade this essay thoroughly. Be specific with praise and criticism. Point to exact sentences or phrases.

Respond ONLY with valid JSON, no markdown backticks:
{
  "overallScore": 28,
  "maxScore": 40,
  "grade": "B+",
  "summary": "One paragraph overall assessment",
  "categories": [
    { "name": "Content & Relevance", "score": 8, "maxScore": 10, "comment": "Specific feedback" },
    { "name": "Organization", "score": 7, "maxScore": 10, "comment": "Specific feedback" },
    { "name": "Expression & Style", "score": 7, "maxScore": 10, "comment": "Specific feedback" },
    { "name": "Grammar & Mechanics", "score": 6, "maxScore": 10, "comment": "Specific feedback" }
  ],
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "corrections": [
    { "original": "exact quote from essay", "corrected": "corrected version", "rule": "grammar rule" }
  ],
  "wordCount": 350,
  "rewrittenParagraph": "Take the weakest paragraph and rewrite it to show the student how it could be improved"
}`,
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "Failed to parse grading. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Essay grader error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}