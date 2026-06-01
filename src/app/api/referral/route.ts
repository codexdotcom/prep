import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReferralStats } from "@/lib/referral";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getReferralStats(session.user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}