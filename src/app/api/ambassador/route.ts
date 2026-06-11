import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { computeTier, getEarningsForTier } from "@/lib/ambassador";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ambassador = await db.ambassador.findUnique({
      where: { userId: session.user.id },
      include: {
        recruits: {
          include: { recruitUser: { select: { name: true, email: true, createdAt: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        payouts: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!ambassador) return NextResponse.json({ ambassador: null });

    // Get leaderboard position
    const rank = await db.ambassador.count({
      where: {
        isActive: true,
        verifiedReferrals: { gt: ambassador.verifiedReferrals },
      },
    }) + 1;

    // Get current month challenge
    const now = new Date();
    const challenge = await db.ambassadorChallenge.findUnique({
      where: { month_year: { month: now.getMonth() + 1, year: now.getFullYear() } },
    });

    return NextResponse.json({ ambassador, rank, challenge });
  } catch (error) {
    console.error("Ambassador error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { schoolName, schoolState, schoolCity, schoolType, bio } = await req.json();
    if (!schoolName || !schoolState) return NextResponse.json({ error: "School name and state required" }, { status: 400 });

    const existing = await db.ambassador.findUnique({ where: { userId: session.user.id } });
    if (existing) return NextResponse.json({ error: "Already an ambassador" }, { status: 400 });

    const code = `JOS-${randomBytes(3).toString("hex").toUpperCase()}`;

    const profile = await db.studentProfile.findUnique({ where: { userId: session.user.id } });

    const ambassador = await db.ambassador.create({
      data: {
        userId: session.user.id,
        code,
        displayName: profile ? `${profile.firstName} ${profile.lastName || ""}`.trim() : session.user.name || "Ambassador",
        schoolName,
        schoolState,
        schoolCity: schoolCity || null,
        schoolType: schoolType || "PRIVATE",
        bio: bio || null,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ ambassador }, { status: 201 });
  } catch (error) {
    console.error("Ambassador apply error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}