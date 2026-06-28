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

    const { transcript, title, subject } = await req.json();

    if (!transcript || transcript.trim().length < 30) {
      return NextResponse.json({ error: "Transcript is too short. Record at least a few sentences." }, { status: 400 });
    }

    const trimmed = transcript.slice(0, 10000);
    const subjectLine = subject ? `Subject: ${subject}` : "";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `You are a study assistant for a Nigerian JAMB student. A student just recorded a lecture. Convert this raw transcript into clean, structured study notes.

${subjectLine}
${title ? `Lecture title: ${title}` : ""}

Raw transcript:
"""
${trimmed}
"""

Rules:
- Fix grammar and remove filler words (um, uh, like, you know)
- Organize into clear sections with headings
- Extract key definitions, formulas, and important facts
- Add exam tips where relevant for JAMB
- Keep the core content accurate - don't invent information not in the transcript
- If the transcript mentions a formula or equation, format it clearly

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "Clean title for these notes",
  "subject": "Detected or provided subject",
  "summary": "2-3 sentence overview of what was covered",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Clean, well-written paragraph(s) of the content. Multiple paragraphs separated by newlines.",
      "keyPoint": "One key takeaway from this section or null"
    }
  ],
  "definitions": [
    { "term": "Term", "definition": "Clear definition" }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "The formula", "note": "When to use it" }
  ],
  "examTips": ["JAMB-specific tip 1"],
  "actionItems": ["What to study next based on this lecture"],
  "wordCount": 350,
  "cleanTranscript": "The full transcript cleaned up with proper grammar and punctuation, but preserving all content"
}`,
      }],
    });

    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let jsonStr = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    try {
      const notes = JSON.parse(jsonStr);
      return NextResponse.json(notes);
    } catch {
      console.error("Parse failed:", raw.slice(0, 500));
      return NextResponse.json({ error: "Failed to process transcript. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Record lecture error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}