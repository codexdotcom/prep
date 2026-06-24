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
    const cardCount = parseInt(formData.get("cardCount") as string) || 15;

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

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are a flashcard generator for JAMB exam preparation. Based on the following study material, generate exactly ${cardCount} flashcards.

Rules:
- Each card has a front (question/term/prompt) and back (answer/definition/explanation)
- Front should be concise - a question, term, or prompt
- Back should be clear and complete but not too long (2-4 sentences max)
- Cover the most important concepts from the material
- Vary card types: definitions, concepts, formulas, comparisons, applications
- Order from fundamental concepts to more advanced ones

Study material:
${trimmed}

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "Deck title based on content",
  "cards": [
    { "id": 1, "front": "Question or term", "back": "Answer or definition", "tag": "topic-tag" }
  ]
}`,
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const deck = JSON.parse(cleaned);
      return NextResponse.json(deck);
    } catch {
      return NextResponse.json({ error: "Failed to parse flashcards. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Flashcard generation error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}