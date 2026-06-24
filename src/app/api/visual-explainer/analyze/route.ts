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
    const image = formData.get("image") as File | null;
    const question = (formData.get("question") as string) || "Explain everything in this image in detail.";
    const context = (formData.get("context") as string) || "";

    if (!image) {
      return NextResponse.json({ error: "Please upload an image." }, { status: 400 });
    }

    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const mediaType = image.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Unsupported image format. Use JPG, PNG, GIF, or WebP." }, { status: 400 });
    }

    const contextLine = context ? `\nAdditional context: ${context}` : "";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: `You are an expert JAMB tutor analyzing a study image for a Nigerian student.${contextLine}

Student's question: "${question}"

Analyze this image thoroughly and provide an educational explanation. If it's a diagram, chart, graph, equation, or textbook page, explain every element.

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "What the image shows",
  "type": "diagram|chart|equation|textbook|graph|table|photo|other",
  "summary": "One paragraph overview of what this image contains",
  "explanation": "Detailed multi-paragraph explanation. Use simple English. Reference specific parts of the image. Include formulas if relevant.",
  "keyConcepts": [
    { "term": "Concept name", "definition": "Clear definition" }
  ],
  "examTips": ["How this topic appears in JAMB", "Common mistakes students make"],
  "relatedTopics": ["Topic 1", "Topic 2"],
  "difficulty": "EASY|MEDIUM|HARD"
}`,
          },
        ],
      }],
    });

    const raw = res.content.map((b) => b.type === "text" ? b.text : "").join("");
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const analysis = JSON.parse(cleaned);
      return NextResponse.json(analysis);
    } catch {
      return NextResponse.json({ error: "Failed to parse analysis. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Visual explainer error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}