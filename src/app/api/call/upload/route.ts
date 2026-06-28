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
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    let content = "";
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    if (file.type === "application/pdf") {
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: "Extract all text content. Return only the raw text." },
          ],
        }],
      });
      content = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
    } else if (file.type.startsWith("audio/")) {
      const mediaMap: Record<string, string> = {
        "audio/mpeg": "audio/mpeg", "audio/mp3": "audio/mpeg", "audio/wav": "audio/wav",
        "audio/webm": "audio/webm", "audio/ogg": "audio/ogg", "audio/mp4": "audio/mp4",
        "audio/m4a": "audio/mp4", "audio/x-m4a": "audio/mp4",
      };
      const mediaType = mediaMap[file.type] || "audio/mpeg";
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: mediaType as any, data: base64 } } as any,
            { type: "text", text: "Transcribe this audio. Return only the transcription." },
          ],
        }],
      });
      content = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
    } else {
      content = await file.text();
    }

    return NextResponse.json({ content: content.slice(0, 8000), filename: file.name });
  } catch (error: any) {
    console.error("Call upload error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to process file" }, { status: 500 });
  }
}