import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ hasProfile: false });
    }

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    return NextResponse.json({ hasProfile: !!profile });
  } catch {
    return NextResponse.json({ hasProfile: false });
  }
}