import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await db.chatConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, message, subject } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  let convo;

  if (conversationId) {
    convo = await db.chatConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
    });
    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  } else {
    convo = await db.chatConversation.create({
      data: {
        userId: session.user.id,
        title: message.trim().slice(0, 60),
        subject: subject || null,
      },
      include: { messages: [] as any },
    });
    (convo as any).messages = [];
  }

  // Save user message
  await db.chatMessage.create({
    data: { conversationId: convo.id, role: "user", content: message.trim() },
  });

  // Build history for Claude
  const history = (convo as any).messages.map((m: any) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user" as const, content: message.trim() });

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: `You are JambOS, an expert JAMB tutor for Nigerian students. You are patient, encouraging, and thorough. Explain concepts clearly with examples. Reference JAMB exam patterns when relevant. Never use em dashes. Keep responses focused and helpful.`,
      messages: history,
    });

    const reply = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");

    // Save assistant message
    await db.chatMessage.create({
      data: { conversationId: convo.id, role: "assistant", content: reply },
    });

    // Update conversation timestamp and title if first message
    await db.chatConversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ conversationId: convo.id, reply });
  } catch (error: any) {
    console.error("Chat error:", error?.message);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}