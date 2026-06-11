import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all_time"; // "all_time" | "monthly" | "state"
    const state = searchParams.get("state");

    const where: any = { isActive: true };
    if (state) where.schoolState = state;

    const orderBy = type === "monthly"
      ? { monthlyReferrals: "desc" as const }
      : { verifiedReferrals: "desc" as const };

    const ambassadors = await db.ambassador.findMany({
      where,
      orderBy,
      take: 50,
      select: {
        id: true,
        displayName: true,
        schoolName: true,
        schoolState: true,
        tier: true,
        verifiedReferrals: true,
        premiumConversions: true,
        totalEarnings: true,
        monthlyReferrals: true,
        monthlyEarnings: true,
        isSchoolCaptain: true,
        userId: true,
      },
    });

    // Get current user's rank
    const myAmbassador = await db.ambassador.findUnique({ where: { userId: session.user.id } });
    let myRank = null;
    if (myAmbassador) {
      const above = await db.ambassador.count({
        where: {
          isActive: true,
          ...(type === "monthly"
            ? { monthlyReferrals: { gt: myAmbassador.monthlyReferrals } }
            : { verifiedReferrals: { gt: myAmbassador.verifiedReferrals } }),
        },
      });
      myRank = above + 1;
    }

    return NextResponse.json({
      leaderboard: ambassadors.map((a, i) => ({
        rank: i + 1,
        displayName: a.displayName || "Ambassador",
        schoolName: a.schoolName,
        schoolState: a.schoolState,
        tier: a.tier,
        referrals: type === "monthly" ? a.monthlyReferrals : a.verifiedReferrals,
        earnings: type === "monthly" ? a.monthlyEarnings : a.totalEarnings,
        isSchoolCaptain: a.isSchoolCaptain,
        isMe: a.userId === session.user.id,
      })),
      myRank,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}