import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAIResponse } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subject = formData.get("subject") as string;
    const topicId = formData.get("topicId") as string | null;

    if (!file || !subject) {
      return NextResponse.json({ error: "File and subject required" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Allowed: JPEG, PNG, WebP, PDF, TXT" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Max 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    let extractedText = "";

    if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else if (file.type.startsWith("image/")) {
      // Use AI to extract text from image
      const { text } = await generateAIResponse(
        "You extract and transcribe text from educational images. Output the text content exactly as it appears, preserving structure. If there are equations, write them in LaTeX notation.",
        [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
            { type: "text", text: "Extract all text, equations, and content from this image. Preserve the structure and formatting." },
          ] as any,
        }],
        2000
      );
      extractedText = text || "";
    } else if (file.type === "application/pdf") {
      // For PDFs, store and note that manual extraction may be needed
      extractedText = "[PDF uploaded — text extraction pending]";
    }

    const upload = await db.noteUpload.create({
      data: {
        userId: session.user.id,
        subject: subject as any,
        topicId: topicId || null,
        filename: file.name,
        fileType: file.type,
        fileData: `data:${file.type};base64,${base64}`,
        processed: !!extractedText,
        extractedText: extractedText || null,
      },
    });

    return NextResponse.json({
      id: upload.id,
      filename: upload.filename,
      processed: upload.processed,
      hasText: !!extractedText,
      textPreview: extractedText ? extractedText.slice(0, 200) + (extractedText.length > 200 ? "..." : "") : null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}