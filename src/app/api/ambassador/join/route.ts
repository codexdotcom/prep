import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeTier, getEarningsForTier } from "@/lib/ambassador";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();

    const ambassador = await db.ambassador.findUnique({ where: { code } });
    if (!ambassador || !ambassador.isActive) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    if (ambassador.userId === session.user.id) return NextResponse.json({ error: "Cannot use your own code" }, { status: 400 });

    const existing = await db.ambassadorRecruit.findUnique({ where: { recruitUserId: session.user.id } });
    if (existing) return NextResponse.json({ error: "Already referred" }, { status: 400 });

    // Create recruit — no payment yet, just signup tracking
    await db.ambassadorRecruit.create({
      data: { ambassadorId: ambassador.id, recruitUserId: session.user.id, status: "SIGNED_UP" },
    });

    await db.ambassador.update({
      where: { id: ambassador.id },
      data: {
        totalSignups: { increment: 1 },
        monthlyReferrals: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, ambassadorName: ambassador.displayName || ambassador.schoolName });
  } catch (error) {
    console.error("Ambassador join error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}