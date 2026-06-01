import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // Normalize phone (ensure +234 format)
    let normalized = phone.replace(/\s|-/g, "");
    if (normalized.startsWith("0")) {
      normalized = "234" + normalized.slice(1);
    }
    if (!normalized.startsWith("234")) {
      normalized = "234" + normalized;
    }

    // Link session to user
    await db.whatsAppSession.upsert({
      where: { phone: normalized },
      update: { userId: session.user.id },
      create: { phone: normalized, userId: session.user.id },
    });

    // Update user phone
    await db.user.update({
      where: { id: session.user.id },
      data: { phone: normalized },
    });

    return NextResponse.json({ success: true, phone: normalized });
  } catch (error) {
    console.error("Link error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}