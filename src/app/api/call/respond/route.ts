import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history, context, materialContent } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // Fetch student profile
    let profileContext = "";
    try {
      const profile = await db.studentProfile.findUnique({ where: { userId: session.user.id } });
      if (profile) {
        // Get subjects safely - field might be jambSubjects, selectedSubjects, etc.
        const raw = profile as Record<string, any>;
        const subjects = raw.jambSubjects || raw.selectedSubjects || raw.subjects || [];
        const subjectList = Array.isArray(subjects) ? subjects.join(", ") : String(subjects || "Not set");

        profileContext = `
Student Profile:
- Name: ${profile.firstName} ${profile.lastName}
- Exam Year: ${profile.examYear}
- Target Score: ${profile.targetScore}
- Subjects: ${subjectList}
- Preferred Course: ${profile.preferredCourse || "Not set"}
- Learning Style: ${profile.learningStyle || "Not set"}
- Study Hours/Day: ${profile.studyHoursPerDay || "Not set"}
- Previous JAMB Score: ${profile.previousJambScore || "First attempt"}
- School: ${profile.schoolName || "Not set"}
`;
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }

    const materialLine = materialContent ? `\n\nThe student uploaded study material for this session. Here is the content:\n"""\n${materialContent.slice(0, 6000)}\n"""` : "";
    const contextLine = context ? `\nSession topic: ${context}` : "";

    const messages = [
      ...(history || []).map((h: any) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message.trim() },
    ];

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: `You are JambOS, a warm and engaging AI tutor for Nigerian JAMB students. You are having a LIVE VOICE CONVERSATION.

${profileContext}${contextLine}${materialLine}

CRITICAL VOICE RULES:
- You are SPEAKING OUT LOUD. Write exactly how a friendly, knowledgeable tutor would talk.
- NEVER use asterisks, bullet points, dashes, markdown, code blocks, or any formatting.
- NEVER say "asterisk" or read out symbols.
- Use natural speech patterns: "So basically...", "Here is the thing...", "Let me put it this way..."
- Use Nigerian-friendly expressions naturally but do not overdo it.
- Keep responses concise for voice: 2-4 sentences for simple questions, up to 6-8 for complex explanations.
- When explaining formulas, say them in words: "V equals I times R" not "V = IR".
- Pause naturally by using short sentences instead of long ones.
- Be encouraging and patient. Use the student's name when appropriate.
- Reference their target score, subjects, and goals when relevant.
- If they seem confused, try a different analogy or approach.
- Think WITH them, not FOR them. Ask guiding questions to help them reason through problems.
- If they need to see something visual, say "Let me send you a note about that" and include a text block.

When you want to send a written note or diagram description alongside your speech, wrap it in [NOTE] tags:
[NOTE]Content here that will be shown as text on screen[/NOTE]

Your spoken response should still make sense without the note. The note is supplementary.`,
      messages,
    });

    const reply = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");

    // Extract notes
    const noteRegex = /\[NOTE\]([\s\S]*?)\[\/NOTE\]/g;
    const extractedNotes: string[] = [];
    let match;
    while ((match = noteRegex.exec(reply)) !== null) {
      extractedNotes.push(match[1].trim());
    }

    // Clean spoken text
    let spoken = reply
      .replace(noteRegex, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .replace(/[-*]\s/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    return NextResponse.json({ spoken, notes: extractedNotes, fullReply: reply });
  } catch (error: any) {
    console.error("Call respond error:", error?.message);
    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}