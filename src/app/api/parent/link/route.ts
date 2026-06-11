import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { parentEmail } = await req.json();
    if (!parentEmail) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const code = `PG-P-${randomBytes(4).toString("hex").toUpperCase()}`;

    const link = await db.parentLink.upsert({
      where: { parentEmail_studentId: { parentEmail, studentId: session.user.id } },
      update: { accessCode: code, status: "PENDING" },
      create: { parentEmail, studentId: session.user.id, accessCode: code },
    });

    return NextResponse.json({ code: link.accessCode, shareUrl: `https://prepgenius.ng/parent?code=${link.accessCode}` });
  } catch (error) {
    console.error("Parent link error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}