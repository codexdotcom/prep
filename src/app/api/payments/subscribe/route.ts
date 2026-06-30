import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { initializePayment } from "@/lib/paystack";
import { PLANS } from "@/lib/plans";
import { SubscriptionTier } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json();
    const plan = PLANS.find((p) => p.tier === tier);
    if (!plan || plan.price === 0) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const reference = `jambos_sub_${session.user.id}_${Date.now()}`;
    const origin = req.headers.get("origin") || "https://jambos.vercel.app";

    const payment = await initializePayment({
      email: session.user.email,
      amount: plan.price * 100, // kobo
      reference,
      callback_url: `${origin}/api/payments/verify?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        tier,
        type: "subscription",
      },
    });

    // Record pending payment
    await db.payment.create({
      data: {
        userId: session.user.id,
        type: "subscription",
        amount: plan.price,
        paystackRef: reference,
        status: "PENDING",
        paystackData: { tier },
      },
    });

    return NextResponse.json({ url: payment.authorization_url, reference });
  } catch (error: any) {
    console.error("Subscribe error:", error?.message);
    return NextResponse.json({ error: error?.message || "Payment failed" }, { status: 500 });
  }
}