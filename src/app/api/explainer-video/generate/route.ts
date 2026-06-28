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

    const subjectLine = subject ? ` for ${subject}` : "";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `Create 8 educational slides about "${topic}"${subjectLine}. Return ONLY valid JSON:

{"title":"...","subject":"...","totalDuration":120,"slides":[{"id":1,"type":"title","heading":"...","content":{"items":["subtitle"],"formula":null,"leftLabel":null,"rightLabel":null,"leftItems":null,"rightItems":null,"question":null,"answer":null},"illustration":{"type":"atoms","elements":[],"labels":[]},"narration":"2 sentences","duration":15,"accentColor":"#3b82f6","bgGradient":["#0f172a","#1e293b"]}]}

Slide types: title, text, formula, comparison, list, quiz, summary
Illustration types: atoms, wave, graph, circuit, cell, process
For comparison: use leftLabel, rightLabel, leftItems, rightItems
For formula: use formula field
For quiz: use question and answer fields
For others: use items array
Each slide needs different bgGradient and accentColor.
Narration: 2-3 conversational sentences per slide.
No markdown backticks. Pure JSON only.`,
      }],
    });

    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Extract JSON from response
    let jsonStr = raw.trim();

    // Remove markdown fences if present
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Find JSON object boundaries
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw response:", raw.slice(0, 500));
      return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
    }

    // Validate structure
    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      console.error("Invalid slides structure:", JSON.stringify(parsed).slice(0, 300));
      return NextResponse.json({ error: "AI returned incomplete data. Please try again." }, { status: 500 });
    }

    // Ensure every slide has required fields with defaults
    parsed.slides = parsed.slides.map((s: any, i: number) => ({
      id: s.id || i + 1,
      type: s.type || "text",
      heading: s.heading || `Slide ${i + 1}`,
      content: {
        items: s.content?.items || null,
        formula: s.content?.formula || null,
        leftLabel: s.content?.leftLabel || null,
        rightLabel: s.content?.rightLabel || null,
        leftItems: s.content?.leftItems || null,
        rightItems: s.content?.rightItems || null,
        question: s.content?.question || null,
        answer: s.content?.answer || null,
      },
      illustration: {
        type: s.illustration?.type || "atoms",
        elements: s.illustration?.elements || [],
        labels: s.illustration?.labels || [],
      },
      narration: s.narration || s.heading || "",
      duration: s.duration || 15,
      accentColor: s.accentColor || ["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#6366f1", "#0ea5e9"][i % 8],
      bgGradient: s.bgGradient || [
        ["#0f172a", "#1e293b"],
        ["#1a0f2e", "#2d1b4e"],
        ["#0f2027", "#203a43"],
        ["#1f1c2c", "#928dab33"],
        ["#0c0c1d", "#1a1a3e"],
        ["#1a1a2e", "#16213e"],
        ["#0d1b2a", "#1b263b"],
        ["#2d1b4e", "#1a0f2e"],
      ][i % 8],
    }));

    parsed.title = parsed.title || topic;
    parsed.subject = parsed.subject || subject || "";
    parsed.totalDuration = parsed.totalDuration || parsed.slides.reduce((sum: number, s: any) => sum + s.duration, 0);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Explainer video error:", error?.message || error);

    if (error?.message?.includes("timeout") || error?.message?.includes("ETIMEDOUT")) {
      return NextResponse.json({ error: "Request timed out. Try a simpler topic." }, { status: 504 });
    }

    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}