import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/subscription";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/paystack";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = await getUserPlan(session.user.id);

    const payments = await db.payment.findMany({
      where: { userId: session.user.id, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ...userPlan,
      planDetails: PLANS[userPlan.plan],
      payments,
      allPlans: PLANS,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}