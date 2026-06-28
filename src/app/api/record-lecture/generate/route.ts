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

    const contentType = req.headers.get("content-type") || "";
    let transcript = "";
    let subject = "";
    let noteStyle = "comprehensive";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      transcript = (formData.get("transcript") as string) || "";
      subject = (formData.get("subject") as string) || "";
      noteStyle = (formData.get("noteStyle") as string) || "comprehensive";
      const audioFile = formData.get("audio") as File | null;

      if (audioFile && !transcript.trim()) {
        // Transcribe audio using Claude
        const buffer = await audioFile.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        const mediaMap: Record<string, string> = {
          "audio/mpeg": "audio/mpeg",
          "audio/mp3": "audio/mpeg",
          "audio/wav": "audio/wav",
          "audio/webm": "audio/webm",
          "audio/ogg": "audio/ogg",
          "audio/mp4": "audio/mp4",
          "audio/m4a": "audio/mp4",
          "audio/x-m4a": "audio/mp4",
        };

        const mediaType = mediaMap[audioFile.type] || "audio/mpeg";

        const transcribeRes = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: "Transcribe this audio recording word for word. Return only the transcription text, nothing else. If you cannot process the audio, respond with: CANNOT_TRANSCRIBE" },
            ],
          }],
        });

        const transcribed = transcribeRes.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        if (transcribed.includes("CANNOT_TRANSCRIBE") || transcribed.trim().length < 20) {
          return NextResponse.json({ error: "Could not transcribe the audio. Try a clearer recording or paste the transcript manually." }, { status: 400 });
        }

        transcript = transcribed;
      }
    } else {
      const body = await req.json();
      transcript = body.transcript || "";
      subject = body.subject || "";
      noteStyle = body.noteStyle || "comprehensive";
    }

    if (!transcript || transcript.trim().length < 30) {
      return NextResponse.json({ error: "Transcript too short. Record at least a few sentences." }, { status: 400 });
    }

    const trimmed = transcript.slice(0, 10000);
    const subjectLine = subject ? `Subject: ${subject}` : "";

    const styleGuide = noteStyle === "cornell"
      ? "Use Cornell note format: main notes, cue column with questions/keywords, and a summary at the bottom."
      : noteStyle === "outline"
      ? "Use a structured outline format with clear hierarchy: main topics, subtopics, and details."
      : noteStyle === "mindmap"
      ? "Organize as a mind map structure: central topic, main branches, and sub-branches with connections noted."
      : "Use a clean, comprehensive note format with clear sections, definitions, and key points highlighted.";

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `You are an expert note-taker for a Nigerian JAMB student. Convert this lecture transcript into comprehensive, well-organized study notes.

${subjectLine}
Note style: ${styleGuide}

Transcript:
"""
${trimmed}
"""

Rules:
- Fix grammar and filler words from spoken language
- Organize content logically even if the lecture jumped around
- Highlight key definitions, formulas, and important concepts
- Add exam tips where relevant
- Note any gaps where the lecture was unclear

Respond ONLY with valid JSON, no markdown backticks:
{
  "title": "Lecture title based on content",
  "subject": "Detected or given subject",
  "duration": "Estimated lecture duration",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Well-written notes for this section. Multiple paragraphs separated by newlines.",
      "keyTerms": ["Important term 1"],
      "isImportant": false
    }
  ],
  "definitions": [
    { "term": "Term", "definition": "Clear definition" }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "The formula", "usage": "When to use it" }
  ],
  "summary": "2-3 sentence summary of the entire lecture",
  "examTips": ["JAMB tip 1"],
  "gaps": ["Topic mentioned but not fully explained"],
  "wordCount": 500
}`,
      }],
    });

    const raw = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    let jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const first = jsonStr.indexOf("{");
    const last = jsonStr.lastIndexOf("}");
    if (first !== -1 && last !== -1) jsonStr = jsonStr.slice(first, last + 1);

    try {
      return NextResponse.json(JSON.parse(jsonStr));
    } catch {
      console.error("Record lecture parse error:", raw.slice(0, 300));
      return NextResponse.json({ error: "Failed to generate notes. Try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Record lecture error:", error?.message);
    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}