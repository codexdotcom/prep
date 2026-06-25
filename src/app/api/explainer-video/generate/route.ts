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

    const { topic, subject, style } = await req.json();
    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({ error: "Enter a topic." }, { status: 400 });
    }

    const subjectLine = subject ? `Subject: ${subject}` : "";
    const styleGuide = style === "fun"
      ? "Use humor, pop culture references, and a casual vibe."
      : style === "exam"
      ? "Focus on exam strategy, what to memorize, common traps."
      : "Clear, structured educational approach with examples.";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are creating an animated educational video for a Nigerian JAMB student.

Topic: "${topic}"
${subjectLine}
Style: ${styleGuide}

Create 8-12 slides. Each slide needs a visual type, heading, content, illustration description, background gradient, narration script, and accent color.

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "Video title",
  "subject": "Subject",
  "totalDuration": 180,
  "slides": [
    {
      "id": 1,
      "type": "title",
      "heading": "Slide heading",
      "content": {
        "items": ["Subtitle or points"],
        "formula": null,
        "leftLabel": null,
        "rightLabel": null,
        "leftItems": null,
        "rightItems": null,
        "question": null,
        "answer": null
      },
      "illustration": {
        "type": "atoms",
        "elements": ["Description"],
        "labels": ["Label"]
      },
      "narration": "Narrator script 2-4 sentences",
      "duration": 15,
      "accentColor": "#3b82f6",
      "bgGradient": ["#0f172a", "#1e293b"]
    }
  ]
}

Slide types: title, text, formula, comparison, list, quiz, summary, diagram
Illustration types: atoms, circuit, graph, cell, wave, forces, equation, process, comparison, globe, book, trophy
Use different bgGradient colors per slide for visual variety.`,
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      return NextResponse.json(JSON.parse(cleaned));
    } catch {
      return NextResponse.json({ error: "Failed to generate. Try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Explainer video error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}