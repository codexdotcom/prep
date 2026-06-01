import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyReferralCode } from "@/lib/referral";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const result = await applyReferralCode(session.user.id, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}