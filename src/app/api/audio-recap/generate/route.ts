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
    const style = (formData.get("style") as string) || "conversational";
    const duration = (formData.get("duration") as string) || "medium";

    let content = text || "";

    if (file) {
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const extractRes = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              { type: "text", text: "Extract all the text content from this document. Return only the raw text." },
            ],
          }],
        });
        content = extractRes.content.map((b) => b.type === "text" ? b.text : "").join("\n");
      } else {
        content = await file.text();
      }
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "No content provided." }, { status: 400 });
    }

    const trimmed = content.slice(0, 8000);

    const lengthGuide = duration === "short" ? "about 300-400 words" : duration === "long" ? "about 800-1000 words" : "about 500-600 words";

    const styleGuide = style === "formal"
      ? "Use a clear, academic tone like a university lecturer."
      : style === "storytelling"
      ? "Use a storytelling approach, weaving concepts into a narrative with analogies and real-world examples."
      : "Use a friendly, conversational tone like two friends studying together. Use 'you' and 'we'.";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are creating a podcast-style audio study recap for a Nigerian JAMB student. Based on the following study material, create a spoken-word script that explains the key concepts clearly.

Style: ${styleGuide}
Length: ${lengthGuide}

Rules:
- Write as if speaking aloud - use natural speech patterns
- Break complex ideas into simple, memorable explanations
- Include memory tricks or mnemonics where helpful
- Add "exam tip" callouts for JAMB-specific advice
- Use transitions like "Now let's talk about...", "Here's the key thing..."
- End with a quick recap of the most important points
- Do NOT use markdown formatting, bullet points, or headers - write pure flowing speech
- Use paragraph breaks to indicate natural pauses

Study material:
${trimmed}

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "Episode title",
  "summary": "One sentence summary",
  "script": "The full spoken script here...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedMinutes": 3
}`,
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const recap = JSON.parse(cleaned);
      return NextResponse.json(recap);
    } catch {
      return NextResponse.json({ error: "Failed to generate recap. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Audio recap error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}